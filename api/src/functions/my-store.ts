import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { DecodedToken } from "../utils/authMiddleware";
import { headers } from "../utils/helpers";
import { withAuth } from "../utils/middleware";
import prisma from "../utils/database";

async function myStore(request: HttpRequest, context: InvocationContext, decodedToken?: DecodedToken): Promise<HttpResponseInit> {
    if (request.method === "GET") {
        try {
            if (!decodedToken) {
                context.error("No token provided");
                return {
                    status: 403,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "Please log in to access your store."
                    })
                }
            }

            const vendor = await prisma.vendor.findUnique({
                where: {
                    user_id: decodedToken.user_id,
                },
                select: {
                    vendor_id: true,
                    user_id: true,
                    store_name: true,
                    bio: true,
                    avatar_url: true,
                    last_active: true
                }
            });

            if (!vendor) {
                return {
                    status: 404,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "Store not found."
                    })
                }
            }

            
            const products = await prisma.product.findMany({
                where: {
                    vendor_id: vendor.vendor_id,
                },
                select: {
                    product_id: true,
                    name: true,
                    price: true,
                    created_at: true,
                    image: {
                        select: {
                            image_id: true,
                            image_url: true,
                        },
                    },
                },
                orderBy: {
                    created_at: 'desc'
                },
                take: 50, // Limit to 50 products initially
            });

            const result = {
                ...vendor,
                product: products
            };

            return {
                status: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: "Vendor details retrieved successfully",
                    data: result
                })
            }
        } catch (error) {
            context.error("Error retrieving store details:", error);
            return {
                status: 500,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: "Internal server error."
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


const MY_STORE = withAuth(myStore, ["VENDOR", "ADMIN"]);

app.http('my-store', {
    handler: MY_STORE,
    authLevel: "anonymous",
    methods: ["GET"]
});