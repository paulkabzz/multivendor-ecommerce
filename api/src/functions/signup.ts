
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { IUser } from "../utils/types";
import bcrypt from 'bcrypt';
import prisma from '../utils/database';

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
                    is_verified: false // User needs to verify their account
                }
            });

            // Return success response (don't include password)
            return {
                status: 201,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: "User created successfully. Please verify your account.",
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