
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { IUser } from "../utils/types";
import { scryptSync, randomBytes } from "crypto";

import prisma from '../utils/database';
import { sendVerificationEmail } from '../utils/gmailService';
import { generateVerificationToken } from '../utils/tokenUtils';
import { headers, isStrongPassword, isValidUCTEmail } from "../utils/helpers";

export function generateOTP(): number {
    return Math.floor(Math.random() * (100_000 - 999_999) + 999_999);
}

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

            const otp = generateOTP();

            const pendingUser = await prisma.unverifiedusers.create({
                data: {
                    first_name,
                    last_name,
                    email: email.toLowerCase(),
                    password: `${salt}:${hashedPassword}`,
                    otp
                }
            });

            const emailSent = await sendVerificationEmail({
                to: pendingUser.email,
                firstName: pendingUser.first_name,
                otp,
            });

            if (!emailSent) {
                context.error('Failed to send verification email');
                await prisma.unverifiedusers.delete({
                    where: { email: pendingUser.email}
                });
            }

            return {
                status: 201,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: "Please check your email to verify your account.",
                    user: {
                        user_id: pendingUser.user_id,
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