import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { headers } from "../utils/helpers";
import prisma from "../utils/database";

async function getProduct(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    if (request.method === "GET") {
        try {

            const product_id = request.query.get("product_id")?.trim();
            context.warn(product_id);

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

            const product = await prisma.product.findUnique({
                where: { product_id: product_id },
                include: {
                    image: true,
                    vendor: true,
                }
            });

            if (!product) {
                return {
                    status: 404,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        messsage: "Product not found."
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