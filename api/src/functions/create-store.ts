import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { DecodedToken } from "../utils/authMiddleware";
import { headers, parseJsonRequest, processImageFromMultipart } from "../utils/helpers";
import { withAuth } from "../utils/middleware";
import { ICreateStore } from "../utils/types";
import prisma from "../utils/database";
import { Avatar } from "../utils/avatars";
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

async function createStore(request: HttpRequest, context: InvocationContext, decodedToken?: DecodedToken): Promise<HttpResponseInit> {
    if (request.method === "POST") {
        try {
            let requestData: ICreateStore;
            let imageFile: { buffer: Buffer; filename: string; mimeType: string } | null = null;

            const contentType = request.headers.get("content-type") || "";
            
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

                imageFile = processingResult.imageFile || null;
                requestData = { 
                    user_id: processingResult.formData?.user_id || "",
                    store_name: processingResult.formData?.store_name || "",
                    bio: processingResult.formData?.bio || null
                };
            } else {
                requestData = await parseJsonRequest(request) as ICreateStore;
            }

            const { user_id, store_name, bio } = requestData;

            if (!user_id) {
                return {
                    status: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "User ID not provided."
                    })
                }
            }

            if (decodedToken && decodedToken.user_id !== user_id) {
                return {
                    status: 403,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "Please log in to create a store"
                    })
                };
            }

            if (decodedToken?.role !== "CUSTOMER" && decodedToken?.role !== "ADMIN") {
                return {
                    status: 403,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "Only customers and admins can create stores"
                    })
                }
            }

            if (!store_name || store_name.length < 2 || store_name === "") {
                return {
                    status: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "Store name cannot be less than 2 letters"
                    })
                }
            }

            const userAlreadyHasStore = await prisma.vendor.findFirst({ where: { user_id }});

            if (userAlreadyHasStore) {
                return {
                    status: 409,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "You already have an existing store"
                    })
                }
            }

            // Execute the transaction
            const result = await prisma.$transaction(async tx => {
                const user = await tx.users.findFirst({ where: { user_id }});

                if (user?.role !== "CUSTOMER" && user?.role !== "ADMIN") {
                    throw new Error("Only customers and admins can create stores");
                }

                let updatedUser = user;
                if (user?.role === "CUSTOMER") {
                    updatedUser = await tx.users.update({
                        where: { user_id },
                        data: { role: "VENDOR" }
                    });
                }

                // Create vendor first without avatar_url
                const vendorData: ICreateStore = {
                    user_id,
                    store_name,
                    bio: bio ?? null,
                };

                const vendor = await tx.vendor.create({ data: vendorData });

                // Now handle image upload if present
                let avatarUrl: string | null = null;
                if (imageFile) {
                    try {
                        const imageUploadResult = await Avatar.uploadVendorAvatar(
                            imageFile.buffer,
                            imageFile.filename,
                            imageFile.mimeType,
                            vendor.vendor_id,
                            process.env.APPWRITE_VENDOR_AVATAR_BUCKET_ID ?? ""
                        );

                        if (imageUploadResult.success && imageUploadResult.imageUrl) {
                            avatarUrl = imageUploadResult.imageUrl;
                        } else {
                            throw new Error(imageUploadResult.error || "Failed to upload avatar");
                        }
                    } catch (error: unknown) {
                        context.error("Error uploading image:", error);
                        throw new Error("Failed to process image upload");
                    }
                }

                // Update vendor with avatar URL if upload was successful
                if (avatarUrl) {
                    await tx.vendor.update({ 
                        where: { vendor_id: vendor.vendor_id }, 
                        data: { avatar_url: avatarUrl }
                    });
                }

                return { vendor, avatarUrl, updatedUser };
            });

            // if (result) {
            //     await prisma.tokenblacklist.create({
            //         data: {
            //             token_jti: decodedToken,
            //             expires_at: new Date(decodedToken.exp * 1000)
            //         }
            //     })
            // }

            const jwtSecret = process.env.JWT_SECRET;
            if (!jwtSecret) {
                throw new Error("JWT_SECRET environment variable not set.");
            }

            const jti = crypto.randomUUID();
            const newToken = jwt.sign(
                {
                    user_id: result.updatedUser.user_id,
                    email: result.updatedUser.email,
                    role: result.updatedUser.role,
                    jti
                },
                jwtSecret,
                { expiresIn: '24h' }
            );

            return {
                status: 201,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: "Store successfully created",
                    token: newToken,
                    user: {
                        user_id: result.updatedUser.user_id,
                        first_name: result.updatedUser.first_name,
                        last_name: result.updatedUser.last_name,
                        email: result.updatedUser.email,
                        avatar_url: result.updatedUser.avatar_url,
                        phone: result.updatedUser.phone,
                        role: result.updatedUser.role,
                        vendor: {
                            vendor_id: result.vendor.vendor_id,
                            store_name: result.vendor.store_name,
                            avatar_url: result.avatarUrl,
                            bio: result.vendor.bio
                        }
                    }
                })
            };
            
        } catch (error: unknown) {
            context.error("Error creating store:", error);
            
            if (error instanceof Error) {
                if (error.message.includes("Only customers and admins")) {
                    return {
                        status: 403,
                        headers,
                        body: JSON.stringify({
                            success: false,
                            message: error.message
                        })
                    };
                }
                if (error.message.includes("Failed to process image") || error.message.includes("Failed to upload avatar")) {
                    return {
                        status: 400,
                        headers,
                        body: JSON.stringify({
                            success: false,
                            message: error.message
                        })
                    };
                }
            }
            
            return {
                status: 500,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: "Internal server error"
                })
            };
        } finally {
            await prisma.$disconnect();
        }
    }

    return {
        status: 405,
        headers,
        body: JSON.stringify({
            success: false,
            message: "Method not allowed"
        })
    }
}

const CREATE_STORE = withAuth(createStore);

app.http('create-store', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: CREATE_STORE
});