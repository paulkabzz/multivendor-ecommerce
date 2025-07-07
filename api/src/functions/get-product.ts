import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { headers } from "../utils/helpers";
import prisma from "../utils/database";

async function getProduct(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    if (request.method === "GET") {
        try {

            const product_id = request.query.get("product_id")?.trim();

            if (!product_id) {
                context.error("Product ID not provided");
                return {
                    status: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "Product ID not provided"
                    })
                }
            }
            
            const product = await prisma.product.findFirst({
                where: { product_id: product_id },
                select: {
                    // Basic product info
                    product_id: true,
                    name: true,
                    decsription: true,
                    price: true,
                    condition: true,
                    is_available: true,
                    created_at: true,
                    
                    // Images
                    image: {
                        select: {
                            image_url: true
                        }
                    },
                    
                    // Vendor info
                    vendor: {
                        select: {
                            vendor_id: true,
                            avatar_url: true,
                            store_name: true,
                            last_active: true
                        }
                    },
                    
                    // Department (direct relationship)
                    department: {
                        select: {
                            department_id: true,
                            department_name: true
                        }
                    },
                    
                    // Subcategory (direct relationship)
                    subcategory: {
                        select: {
                            subcategory_id: true,
                            subcategory_name: true,
                            // Get categories through the subcategory
                            categorysubcategory: {
                                select: {
                                    category: {
                                        select: {
                                            category_id: true,
                                            category_name: true
                                        }
                                    }
                                }
                            }
                        }
                    },
                    
                    // Brand info
                    brands: {
                        select: { 
                            brand_name: true 
                        }
                    },
                    
                    // Size info
                    sizes: {
                        select: {
                            size_name: true,
                        }
                    }
                }
            });

            if (!product) {
                context.error("Product not found.")
                return {
                    status: 404,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "Product not found."
                    })
                }
            }

            context.warn(product);

            return {
                status: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    product
                })
            };
            
        } catch (error: unknown) {
            context.error("Error fetching product: ", error);
            return {
                status: 500,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: "Internal Server Error"
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

app.http('get-product', {
    methods: ["GET"],
    authLevel: "anonymous",
    handler: getProduct,
});