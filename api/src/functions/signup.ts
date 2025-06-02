
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { IUser } from "../utils/types";
import { scryptSync, randomBytes } from "crypto";

import prisma from '../utils/database';
import { sendVerificationEmail } from '../utils/gmailService';
import { generateVerificationToken } from '../utils/tokenUtils';
import { isStrongPassword, isValidUCTEmail } from "../utils/helpers";

async function signup(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Processing request for URL "${request.url}"`);

    const headers = {
        'Content-Type': 'application/json'
    };

    if (request.method === "POST") {
        try {
            const { first_name, last_name, email, password, phone, role } = await request.json() as IUser;

            // Validate required fields
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

            // Check if user already exists
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

            // Hash password
            const hashedPassword = scryptSync(password, salt, 64).toString('hex');

            // Create user in database
            const newUser = await prisma.users.create({
                data: {
                    first_name,
                    last_name,
                    email: email.toLowerCase(),
                    password: `${salt}:${hashedPassword}`,
                    phone: phone || null,
                    role: role || 'CUSTOMER',
                    is_verified: false
                }
            });

            const verificationToken = generateVerificationToken(newUser.email, newUser.user_id);
            
            const url = new URL(request.url);
            const baseUrl = `${url.protocol}//localhost:5173`;

            const emailSent = await sendVerificationEmail({
                to: newUser.email,
                firstName: newUser.first_name,
                verificationToken,
                baseUrl
            });

            if (!emailSent) {
                context.error('Failed to send verification email');
                await prisma.$executeRaw`DELETE FROM Users WHERE email='${newUser.email}';`;
            }

            return {
                status: 201,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: "User created successfully. Please check your email to verify your account.",
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