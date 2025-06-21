import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { DecodedToken } from "../utils/authMiddleware";
import { headers } from "../utils/helpers";
import { withAuth } from "../utils/middleware";
import prisma from "../utils/database";
import { IUser } from "../utils/types";

async function getMe(request: HttpRequest, context: InvocationContext, decodedToken?: DecodedToken): Promise<HttpResponseInit> {
    if (request.method === "GET") {
        try {

            if (!decodedToken) {
                return {
                    status: 403,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "You are not authorised to access this user's details"
                    })
                };
            };

            const updatedUser = await prisma.users.findFirst({
                where: {  user_id: decodedToken.user_id },
            });

            if (!updatedUser) {
                return {
                    status: 404,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "User not found."
                    })
                }
            }

            const data: Partial<IUser & {user_id: string}> = {
                user_id: updatedUser.user_id,
                first_name: updatedUser.first_name,
                last_name: updatedUser.last_name,
                email: updatedUser.email,
                profile_pic_url: updatedUser.profile_pic_url ?? null,
                phone: updatedUser.phone ?? null,
                role: updatedUser.role ?? "CUSTOMER"
            }

            return {
                status: 200,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: "User details updated",
                    data
                })
            }
        } catch (error: unknown) {
            context.error("Error getting user details", error);
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

const GET_ME = withAuth(getMe);

app.http('get-me', {
    methods: ["GET"],
    handler: GET_ME,
    authLevel: "anonymous"
})