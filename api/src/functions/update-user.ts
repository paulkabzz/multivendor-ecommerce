import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import prisma from "../utils/database";
import { IUpdateUserRequest, IUser } from "../utils/types";
import { DecodedToken } from "../utils/authMiddleware";
import { withAuth } from "../utils/middleware";
import { generateVerificationToken } from "../utils/tokenUtils";
import { sendVerificationEmail } from "../utils/gmailService";
import { headers, isValidUCTEmail } from "../utils/helpers";
import { Avatar } from "../utils/avatars";
import * as multipart from "parse-multipart-data";

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

                        imageFile = {
                            buffer: part.data,
                            filename: part.filename || `avatar_${Date.now()}.jpg`,
                            mimeType: part.type || "image/jpeg"
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
            
            // Handle avatar upload
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

// async function uploadProfileImageHandler(request: HttpRequest, context: InvocationContext, decodedToken?: DecodedToken): Promise<HttpResponseInit> {
//     if (request.method === "POST") {
//         try {
//             const contentType = request.headers.get("content-type") || "";
            
//             if (!contentType.includes("multipart/form-data")) {
//                 return {
//                     status: 400,
//                     headers,
//                     body: JSON.stringify({
//                         success: false,
//                         message: "Request must be multipart/form-data"
//                     })
//                 };
//             }

//             let user_id: string | null = null;
//             let imageFile: { buffer: Buffer; filename: string; mimeType: string } | null = null;

//             try {
//                 const formData = await (request as any).formData();
                
//                 user_id = formData.get('user_id');
//                 const imageFormFile = formData.get('profile_image') || formData.get('image') || formData.get('file');
                
//                 if (imageFormFile && imageFormFile instanceof File) {
//                     const arrayBuffer = await imageFormFile.arrayBuffer();
//                     imageFile = {
//                         buffer: Buffer.from(arrayBuffer),
//                         filename: imageFormFile.name || `profile_${Date.now()}.jpg`,
//                         mimeType: imageFormFile.type || "image/jpeg"
//                     };
//                 }
                
//                 context.log("Using formData() method - success");
                
//             } catch (formDataError) {
//                 context.log("formData() not available, falling back to manual parsing");
                
//                 const boundary = contentType.split("boundary=")[1];
//                 if (!boundary) {
//                     return {
//                         status: 400,
//                         headers,
//                         body: JSON.stringify({
//                             success: false,
//                             message: "Invalid multipart boundary"
//                         })
//                     };
//                 }

//                 const body = await request.arrayBuffer();
//                 const bodyBuffer = Buffer.from(body);
//                 const boundaryBuffer = Buffer.from(`--${boundary}`);
                
//                 context.log("Manual parsing - body size:", bodyBuffer.length);
//                 context.log("Boundary:", boundary);
                
//                 const parts = [];
//                 let currentIndex = 0;
                
//                 while (true) {
//                     const boundaryIndex = bodyBuffer.indexOf(boundaryBuffer, currentIndex);
//                     if (boundaryIndex === -1) break;
                    
//                     if (currentIndex !== 0) {
//                         const partBuffer = bodyBuffer.slice(currentIndex, boundaryIndex);
//                         parts.push(partBuffer);
//                     }
                    
//                     currentIndex = boundaryIndex + boundaryBuffer.length;
//                 }
                
//                 context.log("Found parts:", parts.length);
                
//                 for (const partBuffer of parts) {
//                     if (partBuffer.length < 10) continue; // Skip tiny parts
                    
//                     const partString = partBuffer.toString('binary');
//                     const headerEndIndex = partString.indexOf('\r\n\r\n');
                    
//                     if (headerEndIndex === -1) continue;
                    
//                     const headers = partString.substring(0, headerEndIndex);
//                     const dataStartIndex = headerEndIndex + 4;
                    
//                     // Extract field name
//                     const nameMatch = headers.match(/name="([^"]+)"/);
//                     const filenameMatch = headers.match(/filename="([^"]+)"/);
//                     const contentTypeMatch = headers.match(/Content-Type:\s*([^\r\n]+)/i);
                    
//                     if (!nameMatch) continue;
                    
//                     const fieldName = nameMatch[1];
//                     const filename = filenameMatch ? filenameMatch[1] : null;
//                     const mimeType = contentTypeMatch ? contentTypeMatch[1].trim() : null;
                    
//                     const dataBuffer = partBuffer.slice(dataStartIndex, partBuffer.length - 2); // Remove trailing \r\n
                    
//                     context.log(`Found field: ${fieldName}, filename: ${filename}, type: ${mimeType}, size: ${dataBuffer.length}`);
                    
//                     if (fieldName === "user_id") {
//                         user_id = dataBuffer.toString('utf8').trim();
//                     } else if (["profile_image", "image", "file", "avatar", "picture"].includes(fieldName) && filename && dataBuffer.length > 0) {
//                         imageFile = {
//                             buffer: dataBuffer,
//                             filename: filename,
//                             mimeType: mimeType || "image/jpeg"
//                         };
//                     }
//                 }


//             }

//             context.log("Final parsed data:", {
//                 user_id,
//                 hasImageFile: !!imageFile,
//                 imageFileSize: imageFile?.buffer.length || 0,
//                 imageFileName: imageFile?.filename,
//                 imageMimeType: imageFile?.mimeType
//             });

//             if (!user_id) {
//                 return {
//                     status: 400,
//                     headers,
//                     body: JSON.stringify({
//                         success: false,
//                         message: "User ID is required"
//                     })
//                 };
//             }

//             if (!imageFile) {
//                 return {
//                     status: 400,
//                     headers,
//                     body: JSON.stringify({
//                         success: false,
//                         message: "Image file is required. Make sure you're uploading a file with field name 'profile_image', 'image', or 'file'"
//                     })
//                 };
//             }

//             // Verify authorization
//             if (decodedToken && decodedToken.user_id !== user_id && decodedToken.role !== 'ADMIN') {
//                 return {
//                     status: 403,
//                     headers,
//                     body: JSON.stringify({
//                         success: false,
//                         message: "You are not authorised to upload images for this user"
//                     })
//                 };
//             }

//             // Check if user exists
//             const existingUser = await prisma.users.findUnique({ where: { user_id } });
//             if (!existingUser) {
//                 return {
//                     status: 404,
//                     headers,
//                     body: JSON.stringify({
//                         success: false,
//                         message: "User not found"
//                     })
//                 };
//             }

//             // Upload image to Appwrite
//             const uploadResult = await backendImageService.uploadProfileImage(
//                 imageFile.buffer,
//                 imageFile.filename,
//                 imageFile.mimeType,
//                 user_id
//             );

//             if (!uploadResult.success) {
//                 return {
//                     status: 400,
//                     headers,
//                     body: JSON.stringify({
//                         success: false,
//                         message: uploadResult.error || "Failed to upload image"
//                     })
//                 };
//             }

//             // Update user record with new image URL
//             const updatedUser = await prisma.users.update({
//                 where: { user_id },
//                 data: { profile_pic_url: uploadResult.imageUrl }
//             });

//             return {
//                 status: 200,
//                 headers,
//                 body: JSON.stringify({
//                     success: true,
//                     message: "avatar uploaded successfully",
//                     user: updatedUser,
//                     imageUpload: {
//                         fileId: uploadResult.fileId,
//                         imageUrl: uploadResult.imageUrl,
//                         oldImageDeleted: uploadResult.oldImageDeleted
//                     }
//                 })
//             };

//         } catch (error) {
//             context.error("Error uploading profile image:", error);
//             return {
//                 status: 500,
//                 headers,
//                 body: JSON.stringify({
//                     success: false,
//                     message: "Internal server error: " + (error as Error).message
//                 })
//             };
//         }
//     }

//     return {
//         status: 405,
//         headers,
//         body: JSON.stringify({ success: false, message: "Method not allowed" })
//     };
// }

const UPDATE_USER = withAuth(updateUserHandler);
// const UPLOAD_PROFILE_IMAGE = withAuth(uploadProfileImageHandler);

app.http('update-user', {
    methods: ['PATCH'],
    authLevel: 'anonymous',
    handler: UPDATE_USER
});

// app.http('upload-profile-image', {
//     methods: ['POST'],
//     authLevel: 'anonymous',
//     handler: UPLOAD_PROFILE_IMAGE
// });