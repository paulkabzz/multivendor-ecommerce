import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { IUser } from "../utils/types";
import { scryptSync, randomBytes } from "crypto";

import prisma from '../utils/database';
import { sendOTPEmail } from '../utils/gmailService';
import { generateOTP, getOTPExpirationTime } from '../utils/helpers' ;
import { headers, isStrongPassword, isValidUCTEmail } from "../utils/helpers";

async function signup(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {

    if (request.method === "POST") {
        try {
            const { first_name, last_name, email, password, phone, role } = await request.json() as IUser;

            if (!first_name || !last_name || !email || !password) {
                return {
                    status: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "First name, last name, email, and password are required"
                    })
                };
            }

            if (!isValidUCTEmail(email)) {
                return {
                    status: 403,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: email.trim() + " is not a valid uct email."
                    })
                };
            };

            if (!isStrongPassword(password)) {
                return {
                    status: 403,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "Password should contain at least 1 capital letter, number and special character, and must be at least 8 characters long. "
                    })
                }
            }

            const existingUser = await prisma.users.findUnique({
                where: {
                    email: email.toLowerCase()
                }
            });

            if (existingUser) {
                return {
                    status: 409,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "User with this email already exists"
                    })
                };
            }

            const salt = randomBytes(16).toString('hex');
            const hashedPassword = scryptSync(password, salt, 64).toString('hex');
            
            // Generate OTP
            const otpCode = generateOTP();
            const otpExpiresAt = getOTPExpirationTime();

            const newUser = await prisma.users.create({
                data: {
                    first_name,
                    last_name,
                    email: email.toLowerCase(),
                    password: `${salt}:${hashedPassword}`,
                    phone: phone || null,
                    role: role || 'CUSTOMER',
                    is_verified: false,
                    otp_code: otpCode,
                    otp_expires_at: otpExpiresAt
                }
            });

            const emailSent = await sendOTPEmail({
                to: newUser.email,
                firstName: newUser.first_name,
                otpCode: otpCode
            });

            if (!emailSent) {
                context.error('Failed to send OTP email');
                await prisma.users.delete({
                    where: { email: newUser.email }
                });
                return {
                    status: 500,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "Failed to send verification email. Please try again."
                    })
                };
            }

            return {
                status: 201,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: "User created successfully. Please check your email for the verification code.",
                    user: {
                        user_id: newUser.user_id,
                        first_name: newUser.first_name,
                        last_name: newUser.last_name,
                        email: newUser.email,
                        role: newUser.role,
                        is_verified: newUser.is_verified
                    }
                })
            };

        } catch (error) {
            context.log('Signup error:', error);
            return {
                status: 500,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: "Internal server error"
                })
            };
        }
    }

    return {
        status: 405,
        headers,
        body: JSON.stringify({ success: false, message: "Method not allowed" })
    };
}

app.http('sign-up', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: signup
});