import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { withAuth } from "../utils/middleware";
import { DecodedToken } from "../utils/authMiddleware";
import prisma from "../utils/database";
import { headers } from "../utils/helpers";
import { ICreateProduct } from "../utils/types";


async function createProduct(request: HttpRequest, context: InvocationContext, decodedToken?: DecodedToken): Promise<HttpResponseInit> {
    if (request.method === "POST") {
        try {

            const { name, vendor_id, price, is_available, description, condition, image_url, subcategory_id } = await request.json() as ICreateProduct;

            
            
        } catch (error: unknown) {
            context.error(error);
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

const CREATE_PRODUCT = withAuth(createProduct);

app.http('create-product', {
    authLevel: "anonymous",
    methods: ["POST"],
    handler: CREATE_PRODUCT
})