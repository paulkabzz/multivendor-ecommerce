
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { IUser } from "../utils/types";
import bcrypt from 'bcrypt';
import prisma from '../utils/database';
import { sendVerificationEmail } from '../utils/gmailService';
import { generateVerificationToken } from '../utils/tokenUtils';

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

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create user in database
            const newUser = await prisma.users.create({
                data: {
                    first_name,
                    last_name,
                    email: email.toLowerCase(),
                    password: hashedPassword,
                    phone: phone || null,
                    role: role || 'CUSTOMER',
                    is_verified: false
                }
            });

            const verificationToken = generateVerificationToken(newUser.email, newUser.user_id);
            
            const url = new URL(request.url);
            const baseUrl = `${url.protocol}//${url.host}`;

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