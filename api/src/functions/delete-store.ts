import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { DecodedToken } from "../utils/authMiddleware";
import { headers } from "../utils/helpers";
import { withAuth } from "../utils/middleware";
import prisma from "../utils/database";

async function deleteStore(request: HttpRequest, context: InvocationContext, decodedToken?: DecodedToken): Promise<HttpResponseInit> {
    if (request.method === "DELETE") {
        try {
            const { user_id, vendor_id } = await request.json() as { user_id: string, vendor_id: string };

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

            if (!vendor_id) {
                return {
                    status: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "Vendor ID not provided."
                    })
                } 
            }

            const store = await prisma.vendor.findUnique({ where: { vendor_id } });

            if (decodedToken && decodedToken.user_id !== store?.user_id && decodedToken.role !== "ADMIN") {
                return {
                    status: 403,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "You are not authorised to delete this store."
                    })
                };
            };

            await prisma.vendor.delete({ where: { vendor_id, user_id }});

            return {
                status: 201,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: "Store successfully deleted"
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

const DELETE_STORE = withAuth(deleteStore);

app.http('delete-store', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    handler: DELETE_STORE
});