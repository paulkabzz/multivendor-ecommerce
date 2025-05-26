import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { IVerificationResponse } from "../utils/types";
import prisma from '../utils/database';
import { verifyVerificationToken } from '../utils/tokenUtils';

async function verifyEmail(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Processing email verification for URL "${request.url}"`);

    const headers = {
        'Content-Type': 'application/json'
    };

    if (request.method === "GET") {
        try {
            const url = new URL(request.url);
            const token = url.searchParams.get('token');

            if (!token) {
                const response: IVerificationResponse = {
                    success: false,
                    message: "Verification token is required"
                };
                return {
                    status: 400,
                    headers,
                    body: JSON.stringify(response)
                };
            }

            // Verify the token
            const tokenData = verifyVerificationToken(token);
            if (!tokenData) {
                const response: IVerificationResponse = {
                    success: false,
                    message: "Invalid or expired verification token"
                };
                return {
                    status: 400,
                    headers,
                    body: JSON.stringify(response)
                };
            }

            // Find the user
            const user = await prisma.users.findUnique({
                where: {
                    user_id: tokenData.userId,
                    email: tokenData.email
                }
            });

            if (!user) {
                const response: IVerificationResponse = {
                    success: false,
                    message: "User not found"
                };
                return {
                    status: 404,
                    headers,
                    body: JSON.stringify(response)
                };
            }

            if (user.is_verified) {
                const response: IVerificationResponse = {
                    success: true,
                    message: "Email already verified"
                };
                return {
                    status: 200,
                    headers,
                    body: JSON.stringify(response)
                };
            }

            // Update user verification status
            await prisma.users.update({
                where: {
                    user_id: user.user_id
                },
                data: {
                    is_verified: true
                }
            });

            const response: IVerificationResponse = {
                success: true,
                message: "Email verified successfully! You can now log in."
            };

            return {
                status: 200,
                headers,
                body: JSON.stringify(response)
            };

        } catch (error) {
            context.log('Email verification error:', error);
            const response: IVerificationResponse = {
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

app.http('verify-email', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: verifyEmail
});