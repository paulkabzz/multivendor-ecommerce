import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { headers } from "../utils/helpers";
import prisma from "../utils/database";

async function getStore(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    if (request.method !== "GET") {
        return {
            status: 405,
            headers,
            body: JSON.stringify({
                success: false,
                message: "Method not allowed"
            })
        };
    }

    try {
        const store_id = request.query.get("store_id")?.trim();

        if (!store_id) {
            context.warn("Store ID not provided in request");
            return {
                status: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: "Store ID is required"
                })
            };
        }

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

        if (!uuidRegex.test(store_id)) {
            context.warn(`Invalid store ID format: ${store_id}`);
            return {
                status: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: "Invalid store ID format"
                })
            };
        }

        const store = await prisma.vendor.findFirst({
            where: { vendor_id: store_id },
            select: {
                vendor_id: true,
                store_name: true,
                bio: true,
                avatar_url: true,
                ig_username: true,
                last_active: true,
                product: {
                    select: {
                        product_id: true,
                        name: true,
                        price: true,
                        is_available: true,
                        image: {
                            select: {
                                image_url: true
                            }
                        }
                    },
                    orderBy: {
                        created_at: 'desc'
                    }
                },
            }
        });

        if (!store) {
            context.error(`Store not found for ID: ${store_id}`);
            return {
                status: 404,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: "Store not found"
                })
            };
        }

        context.info(`Successfully fetched store: ${store.store_name}`);

        return {
            status: 200,
            headers,
            body: JSON.stringify({
                success: true,
                store
            })
        };

    } catch (error: unknown) {
        context.error("Error fetching store:", error);
        
        if (error instanceof Error) {
            if (error.message.includes('Invalid `prisma.vendor.findFirst()`')) {
                return {
                    status: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "Invalid query parameters"
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
    }
}

app.http('get-store', {
    methods: ["GET"],
    authLevel: "anonymous",
    handler: getStore,
});