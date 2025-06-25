import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { DecodedToken } from "../utils/authMiddleware";
import { headers } from "../utils/helpers";
import { withAuth } from "../utils/middleware";
import prisma from "../utils/database";

async function myStore(request: HttpRequest, context: InvocationContext, decodedToken?: DecodedToken): Promise<HttpResponseInit> {
    if (request.method === "GET") {


        if (!decodedToken) {
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

        return {
            status: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: "Vendor details retrieved successfully",
                data: vendor
            })
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

const MY_STORE = withAuth(myStore, ['ADMIN', 'VENDOR']);

app.http('my-store', {
    handler: MY_STORE,
    authLevel: "anonymous",
    methods: ["GET"]
})