import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { IVerificationResponse } from "../utils/types";
import prisma from '../utils/database';
import { verifyVerificationToken } from '../utils/tokenUtils';
import { headers } from "../utils/helpers";

async function verifyEmail(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {

    if (request.method === "POST") {
        try {

            const { user_id, otp } = await request.json() as any;


            context.warn("OTP:", otp)

            context.warn(typeof otp)
            if (!user_id) {
                const response: IVerificationResponse = {
                    success: false,
                    message: "User ID is required"
                };
                return {
                    status: 400,
                    headers,
                    body: JSON.stringify(response)
                };
            }

            if (!otp) {
                return {
                    status: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "OTP not provided"
                    })
                }
            }

            const user = await prisma.unverifiedusers.findUnique({
                where: { user_id }
            });

            console.log(user);

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

            if (user.otp !== parseInt(otp)) {
                const response: IVerificationResponse = {
                    success: false,
                    message: "Invalid OTP"
                };
                return {
                    status: 400,
                    headers,
                    body: JSON.stringify(response)
                };
            }

            const newUser = await prisma.users.create({
                data: {
                    user_id: user.user_id,
                    email: user.email,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    password: user.password,
                    is_verified: true
                }
            });


            if (!newUser) {
                return {
                    status: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "Failed to create new user."
                    })
                }
            }

            await prisma.unverifiedusers.delete({
                where: { user_id: user.user_id }
            });

            const response: IVerificationResponse = {
                success: true,
                message: "Email verified successfully! You can now log in."
            };

            return {
                status: 201,
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
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: verifyEmail
});