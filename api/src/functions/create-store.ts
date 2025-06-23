import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { DecodedToken } from "../utils/authMiddleware";
import { headers } from "../utils/helpers";
import { withAuth } from "../utils/middleware";
import { ICreateStore } from "../utils/types";
import prisma from "../utils/database";
import * as multipart from "parse-multipart-data";

async function createStore(request: HttpRequest, context: InvocationContext, decodedToken?: DecodedToken): Promise<HttpResponseInit> {
    if (request.method === "POST") {
        try {
            const { user_id, store_name, bio } = await request.json() as ICreateStore;

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
            };

            let requestData: ICreateStore;
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
                
                requestData = { user_id: "", store_name: "" };
                
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
                requestData = await request.json() as ICreateStore;
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

            const data: ICreateStore = {
                user_id,
                store_name,
                bio: bio ?? null,
            };

            await prisma.$transaction(async tx => {
                const user = await prisma.users.findFirst({ where: { user_id }});

                if (user?.role !== "CUSTOMER" && user?.role !== "ADMIN") {
                    return {
                        status: 403,
                        headers,
                        body: JSON.stringify({
                            success: false,
                            message: "Only customers and admins can create stores"
                        })
                    }
                }

                if (user?.role === "CUSTOMER") {
                    await tx.users.update({
                        where: {user_id},
                        data: {role: "VENDOR"}
                    });
                }


                await tx.vendor.create({ data });
            });

            return {
                status: 201,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: "Store successfully created"
                })
            }            
        } catch (error: unknown) {
            context.log("Error creating store", error);
            return {
                status: 500,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: "Internal server error"
                })
            }
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