import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import prisma from "../utils/database";
import { IUpdateUserRequest } from "../utils/types";
import { DecodedToken } from "../utils/authMiddleware";
import { withAuth } from "../utils/middleware";
import { generateVerificationToken } from "../utils/tokenUtils";
import { sendVerificationEmail } from "../utils/gmailService";
import { headers, isValidUCTEmail, parseJsonRequest, processImageFromMultipart } from "../utils/helpers";
import { Avatar } from "../utils/avatars";

interface IUpdateUserWithAvatarRequest extends IUpdateUserRequest {
    avatar_url?: string;
}

async function updateUserHandler(request: HttpRequest, context: InvocationContext, decodedToken?: DecodedToken): Promise<HttpResponseInit> {

if (request.method === "PATCH") {
    try {

        context.warn(request)
        let requestData: IUpdateUserWithAvatarRequest;
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

        const url: URL = new URL(request.url);
        const baseUrl: string = `${url.protocol}//localhost:5173`;

        // If user is not verified, resend verification email (skip for profile image updates)
        if (!existingUser?.is_verified && !imageFile) {
            // Generate a new verification token
            const verificationToken = generateVerificationToken(existingUser.email, existingUser.user_id);
            
            // Send verification email
            const emailSent = await sendVerificationEmail({
                to: existingUser.email,
                firstName: existingUser.first_name,
                verificationToken,
                baseUrl
            });
            
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

        // Build update data object with only changed fields
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
        
        // Check if email is being updated
        let emailUpdated = false;
        let verificationToken = null;
        
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

            updateData.email = email;
            updateData.is_verified = false;
            emailUpdated = true;
            
            // Generate a new verification token for the new email
            verificationToken = generateVerificationToken(email, existingUser.user_id);
        }

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

        if (!updateData) {
            return {
                status: 404,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: "User not found"
                })
            }
        }
        
        // If email was updated, send verification email to the new email address
        let emailSent = false;

        if (emailUpdated && verificationToken && updatedUser) {
            emailSent = await sendVerificationEmail({
                to: email!,
                firstName: updatedUser.first_name,
                verificationToken,
                baseUrl
            });
        }

        // Prepare response message based on what was updated
        let message = "User updated successfully";
        if (emailUpdated) {
            message = "User updated successfully. A verification email has been sent to your new email address. Please verify your email to complete the update.";
        } else if (imageFile) {
            message = "Avatar updated successfully";
        }
        
        return {
            status: 201,
            headers: headers,
            body: JSON.stringify({
                success: true,
                message: message,
                user: updatedUser,
                emailSent: emailUpdated ? emailSent : undefined,
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