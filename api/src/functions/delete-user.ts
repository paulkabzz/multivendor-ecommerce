import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { DecodedToken } from "../utils/authMiddleware";
import { withAuth } from "../utils/middleware";
import prisma from "../utils/database";
import { headers } from "../utils/helpers";


interface DeleteUserRequest {
    user_id: string;
}

async function deleteUser(request: HttpRequest, context: InvocationContext, decodedToken?: DecodedToken): Promise<HttpResponseInit> {
    if (request.method === "DELETE") {
        try {
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
            
            // Verify that the user is deleting their own profile or is an admin
            if (decodedToken && decodedToken.user_id !== user_id && decodedToken.role !== 'ADMIN') {
                return {
                    status: 403,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "You are not authorised to delete this account"
                    })
                };
            };

            const existingUser = await prisma.users.findUnique({ where: { user_id } });

            if (!existingUser) {
                return {
                    status: 404,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "User does not exist."
                    })
                }
            }

            await prisma.users.delete({
                where: { user_id }
            });

            return {
                status: 201,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: "User successfully deleted"
                })
            }            
        } catch (error: unknown) {
            context.log("Error deleting user", error);
            return {
                status: 500,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: "Internal server error",
                    error: error
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

const DELETE_USER = withAuth(deleteUser);

app.http('delete-user', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    handler: DELETE_USER
});