import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { ILoginRequest, ILoginResponse } from "../utils/types";
import jwt from 'jsonwebtoken';
import prisma from '../utils/database';
import { scryptSync, timingSafeEqual } from "crypto";
import { generateVerificationToken } from "../utils/tokenUtils";
import { sendVerificationEmail } from "../utils/gmailService";

async function login(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Processing login request for URL "${request.url}"`);

    const headers = {
        'Content-Type': 'application/json'
    };

    if (request.method === "POST") {
        try {
            const { email, password } = await request.json() as ILoginRequest;

            // Validate input
            if (!email || !password) {
                const response: ILoginResponse = {
                    success: false,
                    message: "Email and password are required"
                };
                return {
                    status: 400,
                    headers,
                    body: JSON.stringify(response)
                };
            }

            // Find user by email
            const user = await prisma.users.findUnique({
                where: {
                    email: email.toLowerCase().trim()
                }
            });

            if (!user) {
                const response: ILoginResponse = {
                    success: false,
                    message: "User with this email does not exsist."
                };
                return {
                    status: 401,
                    headers,
                    body: JSON.stringify(response)
                };
            }

            const url: URL = new URL(request.url);
            const baseUrl: string = `${url.protocol}//localhost:5173`;

            // Check if user is verified
            if (!user.is_verified) {
                // Generate a new verification token
                const verificationToken = generateVerificationToken(user.email, user.user_id);
                
                // Send verification email
                const emailSent = await sendVerificationEmail({
                    to: user.email, 
                    firstName: user.first_name, 
                    verificationToken,
                    baseUrl
                });
                
                const response: ILoginResponse = {
                    success: false,
                    message: "Please verify your account before logging in. A new verification email has been sent to your email address.",
                    emailSent
                };
                return {
                    status: 401,
                    headers,
                    body: JSON.stringify(response)
                };
            }

            // Verify password
            const [salt, key] = user.password.split(":");
            const hashedBuffer = scryptSync(password, salt, 64);

            const keyBuffer = Buffer.from(key, 'hex');

            const match = timingSafeEqual(hashedBuffer, keyBuffer);

            if (!match) {
                const response: ILoginResponse = {
                    success: false,
                    message: "Invalid email or password"
                };
                return {
                    status: 401,
                    headers,
                    body: JSON.stringify(response)
                };
            }

            // Generate JWT token
            const jwtSecret = process.env.JWT_SECRET;

            if (!jwtSecret) throw new Error("JWT_SECRET environment variable not set.");

            const token = jwt.sign(
                {
                    user_id: user.user_id,
                    email: user.email.trim(),
                    role: user.role
                },
                jwtSecret,
                { expiresIn: '24h' }
            );

            // Successful login response
            const response: ILoginResponse = {
                success: true,
                message: "Login successful",
                user: {
                    user_id: user.user_id,
                    first_name: user.first_name.trim(),
                    last_name: user.last_name,
                    email: user.email.trim(),
                    role: user.role || 'CUSTOMER',
                    is_verified: user.is_verified || false
                },
                token
            };

            return {
                status: 200,
                headers,
                body: JSON.stringify(response)
            };

        } catch (error) {
            context.log('Login error:', error);
            const response: ILoginResponse = {
                success: false,
                message: "Internal server error"
            };
            return {
                status: 500,
                headers,
                body: JSON.stringify(response)
            };
        }
    }

    return {
        status: 405,
        headers,
        body: JSON.stringify({ success: false, message: "Method not allowed" })
    };
}

app.http('login', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: login
});