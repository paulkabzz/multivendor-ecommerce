import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { DecodedToken } from "../utils/authMiddleware";
import { headers } from "../utils/helpers";
import { withAuth } from "../utils/middleware";

async function myStore(request: HttpRequest, context: InvocationContext, decodedToken?: DecodedToken): Promise<HttpResponseInit> {
    if (request.method === "GET") {
        const url: URL = new URL(request.url);

        const userId = url.searchParams.get('userId');
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