import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { DecodedToken } from "../utils/authMiddleware";
import { withAuth } from "../utils/middleware";

const headers = {
    'Content-Type': 'application/json'
} as const;

interface DeleteUserRequest {
    user_id: string;
}

async function deleteUser(request: HttpRequest, context: InvocationContext, decodedToken?: DecodedToken): Promise<HttpResponseInit> {
    if (request.method === "DELETE") {
        const { user_id } = await request.json() as DeleteUserRequest;

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

const deleteUSer = withAuth(deleteUser);

app.http('delete-user', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    handler: deleteUSer
});