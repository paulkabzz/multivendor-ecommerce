import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { IVerificationResponse } from "../utils/types";
import prisma from '../utils/database';
import { isOTPExpired } from '../utils/helpers';
import { headers } from "../utils/helpers";

interface OTPVerificationRequest {
    email: string;
    otpCode: string;
}

async function verifyOTP(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {

    if (request.method === "POST") {
        try {
            const { email, otpCode } = await request.json() as OTPVerificationRequest;

            if (!email || !otpCode) {
                const response: IVerificationResponse = {
                    success: false,
                    message: "Email and OTP code are required"
                };
                return {
                    status: 400,
                    headers,
                    body: JSON.stringify(response)
                };
            }

            const user = await prisma.users.findUnique({
                where: {
                    email: email.toLowerCase()
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

            if (!user.otp_code || !user.otp_expires_at) {
                const response: IVerificationResponse = {
                    success: false,
                    message: "No OTP found for this user"
                };
                return {
                    status: 400,
                    headers,
                    body: JSON.stringify(response)
                };
            }

            if (isOTPExpired(user.otp_expires_at)) {
                const response: IVerificationResponse = {
                    success: false,
                    message: "OTP has expired. Please request a new one."
                };
                return {
                    status: 400,
                    headers,
                    body: JSON.stringify(response)
                };
            }

            if (user.otp_code !== otpCode) {
                const response: IVerificationResponse = {
                    success: false,
                    message: "Invalid OTP code"
                };
                return {
                    status: 400,
                    headers,
                    body: JSON.stringify(response)
                };
            }

            // OTP is valid, verify the user and clear OTP data
            await prisma.users.update({
                where: {
                    user_id: user.user_id
                },
                data: {
                    is_verified: true,
                    otp_code: null,
                    otp_expires_at: null
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
            context.log('OTP verification error:', error);
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

app.http('verify-otp', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: verifyOTP
});