import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import prisma from "../utils/database";
import { IUpdateUserRequest } from "../utils/types";
import { DecodedToken } from "../utils/authMiddleware";
import { withAuth } from "../utils/middleware";
import { generateVerificationToken } from "../utils/tokenUtils";
import { sendVerificationEmail } from "../utils/gmailService";
import { headers, isValidUCTEmail } from "../utils/helpers";
import { Avatar } from "../utils/avatars";
import * as multipart from "parse-multipart-data";
import convert from 'heic-convert';
import sharp from 'sharp';

interface IUpdateUserWithAvatarRequest extends IUpdateUserRequest {
    avatar_url?: string;
}

async function updateUserHandler(request: HttpRequest, context: InvocationContext, decodedToken?: DecodedToken): Promise<HttpResponseInit> {
if (request.method === "PATCH") {
    try {
        let requestData: IUpdateUserWithAvatarRequest;
        let imageFile: { buffer: Buffer; filename: string; mimeType: string } | null = null;

        const contentType = request.headers.get("content-type") || "";
        
        if (contentType.includes("multipart/form-data")) {

            const boundary = contentType.split("boundary=")[1];
            if (!boundary) {
                return {
                    status: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "Invalid multipart boundary"
                    })
                };
            }

            const body = await request.arrayBuffer();
            const parts = multipart.parse(Buffer.from(body), boundary);
            
            requestData = { user_id: "" };
            
            for (const part of parts) {
                const name = part.name;
                
                if (name === "avatar" && part.data && part.data.length > 0) {
                    let processedBuffer = part.data;
                    let processedMimeType = part.type || "image/jpeg";
                    let processedFilename = part.filename || `avatar_${Date.now()}.jpg`;

                    // Check if the uploaded file is HEIC/HEIF
                    const isHeic = processedMimeType.toLowerCase().includes('heic') || 
                                  processedMimeType.toLowerCase().includes('heif') ||
                                  processedFilename.toLowerCase().endsWith('.heic') ||
                                  processedFilename.toLowerCase().endsWith('.heif') ||

                                  processedMimeType === 'image/heif';

                    if (isHeic) {
                        try {
                            context.log(`Converting HEIC image to JPEG: ${processedFilename}`);
                            
                            // Convert HEIC to JPEG using heic-convert
                            const jpegBuffer = await convert({
                                buffer: processedBuffer,
                                format: 'JPEG',
                                quality: 0.8 
                            });


                            processedBuffer = await sharp(Buffer.from(jpegBuffer))
                                .jpeg({ 
                                    quality: 85,
                                    progressive: true 
                                })
                                .resize(1024, 1024, { 
                                    fit: 'inside',
                                    withoutEnlargement: true 
                                })
                                .toBuffer();

                            processedMimeType = "image/jpeg";
                            
                            const nameWithoutExt = processedFilename.replace(/\.(heic|heif)$/i, '');
                            processedFilename = `${nameWithoutExt}.jpg`;
                            
                            context.log(`Successfully converted HEIC to JPEG: ${processedFilename}, size: ${processedBuffer.length} bytes`);
                            
                        } catch (conversionError) {
                            context.error("Error converting HEIC to JPEG:", conversionError);
                            return {
                                status: 400,
                                headers,
                                body: JSON.stringify({
                                    success: false,
                                    message: "Failed to convert HEIC image. Please try uploading a JPEG or PNG file instead."
                                })
                            };
                        }
                    } else {

                        try {
                            const imageInfo = await sharp(processedBuffer).metadata();
                            

                            if (imageInfo.format && ['jpeg', 'jpg', 'png', 'webp'].includes(imageInfo.format)) {
                                processedBuffer = await sharp(processedBuffer)
                                    .resize(1024, 1024, { 
                                        fit: 'inside',
                                        withoutEnlargement: true 
                                    })
                                    .jpeg({ quality: 85 })
                                    .toBuffer();
                                
                                processedMimeType = "image/jpeg";

                                if (!processedFilename.toLowerCase().endsWith('.jpg') && !processedFilename.toLowerCase().endsWith('.jpeg')) {
                                    const nameWithoutExt = processedFilename.replace(/\.(png|webp|gif|bmp)$/i, '');
                                    processedFilename = `${nameWithoutExt}.jpg`;
                                }
                            }
                        } catch (imageProcessError) {
                            context.log("Image processing skipped:", imageProcessError);
                            return {
                                status: 400,
                                headers,
                                body: JSON.stringify({
                                    success: false,
                                    message: "Failed to process image"
                                })
                            }
                        }
                    }

                    imageFile = {
                        buffer: processedBuffer,
                        filename: processedFilename,
                        mimeType: processedMimeType
                    };
                } else if (part.data && typeof name === "string" && name) {

                    const value = part.data.toString('utf8');
                    if (value && value.trim()) {
                        (requestData as any)[name] = value;
                    }
                }
            }
        } else {
            requestData = await request.json() as IUpdateUserWithAvatarRequest;
        }

        const { first_name, last_name,email, phone, user_id } = requestData;
    
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