import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { DecodedToken } from "../utils/authMiddleware";
import { headers } from "../utils/helpers";
import { withAuth } from "../utils/middleware";
import { ICreateStore } from "../utils/types";
import prisma from "../utils/database";

async function createStore(request: HttpRequest, context: InvocationContext, decodedToken?: DecodedToken): Promise<HttpResponseInit> {
    if (request.method === "POST") {
        try {
            const { user_id, store_name, bio, image_url } = await request.json() as ICreateStore;

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
                image_url: image_url ?? null
            };

            await prisma.vendor.create({
                data,
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