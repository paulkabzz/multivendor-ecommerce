import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import prisma from '../utils/database';
import { sendOTPEmail } from '../utils/gmailService';
import { generateOTP, getOTPExpirationTime } from '../utils/helpers';
import { headers } from "../utils/helpers";

interface ResendOTPRequest {
    email: string;
}

async function resendOTP(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {

    if (request.method === "POST") {
        try {
            const { email } = await request.json() as ResendOTPRequest;

            if (!email) {
                return {
                    status: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "Email is required"
                    })
                };
            }

            const user = await prisma.users.findUnique({
                where: {
                    email: email.toLowerCase()
                }
            });

            if (!user) {
                return {
                    status: 404,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "User not found"
                    })
                };
            }

            if (user.is_verified) {
                return {
                    status: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "Email is already verified"
                    })
                };
            }

            // Generate new OTP
            const otpCode = generateOTP();
            const otpExpiresAt = getOTPExpirationTime();

            // Update user with new OTP
            await prisma.users.update({
                where: {
                    user_id: user.user_id
                },
                data: {
                    otp_code: otpCode,
                    otp_expires_at: otpExpiresAt
                }
            });

            const emailSent = await sendOTPEmail({
                to: user.email,
                firstName: user.first_name,
                otpCode: otpCode
            });

            if (!emailSent) {
                context.error('Failed to send OTP email');
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
                status: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: "New verification code sent successfully. Please check your email."
                })
            };

        } catch (error) {
            context.log('Resend OTP error:', error);
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

app.http('resend-otp', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: resendOTP
});