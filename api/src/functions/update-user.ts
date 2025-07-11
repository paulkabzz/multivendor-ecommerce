import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import prisma from "../utils/database";
import { IUpdateUserRequest } from "../utils/types";
import { DecodedToken } from "../utils/authMiddleware";
import { withAuth } from "../utils/middleware";
import { sendOTPEmail } from "../utils/gmailService";
import { generateOTP, getOTPExpirationTime, headers, isValidUCTEmail, parseJsonRequest, processImageFromMultipart } from "../utils/helpers";
import { Avatar } from "../utils/avatars";

interface IUpdateUserWithAvatarRequest extends IUpdateUserRequest {
    avatar_url?: string;
}

async function updateUserHandler(request: HttpRequest, context: InvocationContext, decodedToken?: DecodedToken): Promise<HttpResponseInit> {

if (request.method === "PATCH") {
    try {

        context.warn(request)
        let requestData: Partial<IUpdateUserWithAvatarRequest>;
        let imageFile: { buffer: Buffer; filename: string; mimeType: string } | null = null;

        const contentType = request.headers.get("content-type") || "";

        context.warn(contentType)
        
        if (contentType.includes("multipart/form-data")) {

            const processingResult = await processImageFromMultipart(
                request,
                'avatar',
                {
                    maxSizeBytes: 20 * 1024 * 1024, // 20MB
                    outputQuality: 85,
                    maxWidth: 1024,
                    maxHeight: 1024,
                    convertToJpeg: true
                },
                context
            );

            if (!processingResult.success) {
                return {
                    status: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: processingResult.error
                    })
                };
            }

            // Extract the processed image and form data
            imageFile = processingResult.imageFile || null;
            requestData = { 
                user_id: processingResult.formData?.user_id || "",
                first_name: processingResult.formData?.first_name,
                last_name: processingResult.formData?.last_name,
                email: processingResult.formData?.email,
                phone: processingResult.formData?.phone
            };

        } else {

            requestData = await parseJsonRequest(request) as IUpdateUserWithAvatarRequest;
        }

        const { first_name, last_name, email, phone, user_id } = requestData;
    
        if (!user_id) {
            return {
                status: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: "No user ID provided"
                })
            };
        }
        
        // Verify that the user is updating their own profile or is an admin
        if (decodedToken && decodedToken.user_id !== user_id && decodedToken.role !== 'ADMIN') {
            return {
                status: 403,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: "You are not authorised to update this user's information"
                })
            };
        }

        const existingUser = await prisma.users.findUnique({ 
            where: {user_id: user_id},
            select: {
                user_id: true,
                first_name: true,
                last_name: true,
                email: true,
                phone: true,
                avatar_url: true,
                role: true,
                vendor: true,
                is_verified: true,
            }
        });

        if (!existingUser) {
            return {
                status: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: "User does not exist"
                })
            };
        }

        // If user is not verified, resend verification email (skip for profile image updates)
        if (!existingUser?.is_verified && !imageFile) {
            
            const otpCode = generateOTP();
            const otpExpiresAt = getOTPExpirationTime();
            
            // Send verification email
            const emailSent = await sendOTPEmail({
                to: existingUser.email,
                firstName: existingUser.first_name,
                otpCode,
                // baseUrl
            });

            await prisma.users.update({
                where: { user_id },
                data: {
                    otp_code: otpCode,
                    otp_expires_at: otpExpiresAt
                }
            })

            return {
                status: 403,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: "Account is not verified. A new verification email has been sent to your email address.",
                    emailSent
                })
            };
        }

        // Build update data object with only changed fields (excluding email for now)
        const updateData: Partial<IUpdateUserWithAvatarRequest> = {};
        
        if (first_name && first_name !== existingUser.first_name) updateData.first_name = first_name;
        if (last_name && last_name !== existingUser.last_name) updateData.last_name = last_name;
        if (phone && phone !== existingUser.phone) updateData.phone = phone;
        
        let imageUploadResult = null;
        if (imageFile) {
            try {
                imageUploadResult = await Avatar.uploadUserAvatar(
                    imageFile.buffer,
                    imageFile.filename,
                    imageFile.mimeType,
                    user_id
                );

                if (imageUploadResult.success && imageUploadResult.imageUrl) {
                    updateData.avatar_url = imageUploadResult.imageUrl;
                } else {
                    return {
                        status: 400,
                        headers,
                        body: JSON.stringify({
                            success: false,
                            message: imageUploadResult.error || "Failed to upload avatar"
                        })
                    };
                }
            } catch (error: unknown) {
                context.log("Error uploading image:", error);
                return {
                    status: 500,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "Failed to process image upload"
                    })
                };
            }
        }
        
        // Handle email update with verification - VALIDATE AND SEND EMAIL FIRST
        let emailVerificationData = null;
        let emailUpdateSuccess = false;
        
        if (email && email !== existingUser.email) {
            if (!isValidUCTEmail(email)) {
                return {
                    status: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: email + " is not a valid UCT email."
                    })
                };
            }

            // Generate OTP for email verification
            const otpCode = generateOTP();
            const otpExpiresAt = getOTPExpirationTime();
            
            // Try to send verification email BEFORE updating anything
            try {
                const emailSent = await sendOTPEmail({
                    to: email, // Send to the NEW email address
                    firstName: first_name || existingUser.first_name,
                    otpCode,
                    // baseUrl
                });

                if (!emailSent) {
                    // EMAIL FAILED - ABORT THE ENTIRE UPDATE
                    return {
                        status: 400,
                        headers,
                        body: JSON.stringify({
                            success: false,
                            message: "Failed to send verification email to the new email address. No changes were made."
                        })
                    };
                }

                // Email sent successfully, prepare verification data
                emailVerificationData = {
                    email: email,
                    is_verified: false,
                    otp_code: otpCode,
                    otp_expires_at: otpExpiresAt
                };

                context.warn(emailVerificationData.otp_code);
                emailUpdateSuccess = true;

            } catch (error) {
                context.error("Failed to send verification email:", error);
                // EMAIL FAILED - ABORT THE ENTIRE UPDATE
                return {
                    status: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "Failed to send verification email to the new email address. No changes were made."
                    })
                };
            }
        }

        // Add email verification data to update data ONLY if email verification was successful
        if (emailVerificationData && emailUpdateSuccess) {
            Object.assign(updateData, emailVerificationData);
        }

        // Check if there are any changes to make
        if (Object.keys(updateData).length === 0) {
            return {
                status: 200,
                headers,
                body: JSON.stringify({ 
                    success: true, 
                    message: "No changes detected.",
                    user: existingUser 
                })
            };
        }

        // Update user with new data (only if email verification succeeded or no email change)

        await prisma.users.update({
            where: {
                user_id
            },
            data: updateData,
        });

        const updatedUser = await prisma.users.findUnique({
            where: { user_id},
            select: {
                user_id: true,
                first_name: true,
                last_name: true,
                email: true,
                phone: true,
                avatar_url: true,
                role: true,
                vendor: true,
                is_verified: true
            }
        });

        if (!updatedUser) {
            return {
                status: 404,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: "User not found after update"
                })
            }
        }
        
        // Prepare response message based on what was updated
        let message = "User updated successfully";
        const emailUpdated = emailUpdateSuccess;
        
        if (emailUpdated) {
            message = "User updated successfully. A verification email has been sent to your new email address. Please verify your email to complete the update.";
        } else if (imageFile) {
            message = "Avatar updated successfully";
        }
        
        return {
            status: 200,
            headers: headers,
            body: JSON.stringify({
                success: true,
                message: message,
                user: updatedUser,
                emailSent: emailUpdated,
                requiresVerification: emailUpdated,
                imageUpload: imageUploadResult ? {
                    success: imageUploadResult.success,
                    fileId: imageUploadResult.fileId,
                    oldImageDeleted: imageUploadResult.oldAvatarDeleted
                } : undefined
            })
        };

    } catch (error: unknown) {
        context.error("Error updating user", error);
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

const UPDATE_USER = withAuth(updateUserHandler);

app.http('update-user', {
    methods: ['PATCH'],
    authLevel: 'anonymous',
    handler: UPDATE_USER
});