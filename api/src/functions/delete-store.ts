import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { DecodedToken } from "../utils/authMiddleware";
import { headers } from "../utils/helpers";
import { withAuth } from "../utils/middleware";
import prisma from "../utils/database";
import { Avatar } from "../utils/avatars";

async function deleteStore(request: HttpRequest, context: InvocationContext, decodedToken?: DecodedToken): Promise<HttpResponseInit> {
    if (request.method === "DELETE") {
        try {
            const { vendor_id } = await request.json() as { vendor_id: string };

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

            if (!store) {
                context.error("Store not found.");
                return {
                    status: 404,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "Store not found."
                    })
                }
            }

            if (decodedToken && decodedToken.user_id !== store?.user_id && decodedToken.role !== "ADMIN") {
                context.error("You are not authorised to delete this store.");
                return {
                    status: 403,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "You are not authorised to delete this store."
                    })
                };
            };

            await prisma.$transaction(async (tx:any) => {

                if (decodedToken?.role === "VENDOR") {
                    await tx.users.update({
                        where: { user_id: decodedToken.user_id },
                        data: { role: "CUSTOMER"}
                    });

                }
                const bucketId = process.env.APPWRITE_VENDOR_AVATAR_BUCKET_ID;

                if (!bucketId) throw new Error("APPWRITE_VENDOR_AVATAR_BUCKET_ID variable not set.");
                  
                await tx.vendor.delete({ where: { vendor_id, user_id: decodedToken?.user_id }});
                
                await Avatar.deleteVendorAvatar(vendor_id, bucketId);
            });

            return {
                status: 204,
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

const DELETE_STORE = withAuth(deleteStore, ['VENDOR', 'ADMIN']);

app.http('delete-store', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    handler: DELETE_STORE
});