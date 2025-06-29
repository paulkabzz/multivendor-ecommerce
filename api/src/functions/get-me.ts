import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { DecodedToken } from "../utils/authMiddleware";
import { headers } from "../utils/helpers";
import { withAuth } from "../utils/middleware";
import prisma from "../utils/database";
import { IUser, IVendor } from "../utils/types";

interface IUsefuleUserDetails extends IUser {
    user_id: string;
    vendor?: IVendor;
}

async function getMe(request: HttpRequest, context: InvocationContext, decodedToken?: DecodedToken): Promise<HttpResponseInit> {
    if (request.method === "GET") {
        try {

            if (!decodedToken) {
                context.error("You are not authorised to access this user's details");
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
                context.error("User not found.")
                return {
                    status: 404,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "User not found."
                    })
                }
            }

            const vendor = await prisma.vendor.findUnique({ where: { user_id: updatedUser.user_id }});

            if (vendor) {
                context.warn("Found vendor");
                await prisma.vendor.update({
                    where: { user_id: decodedToken.user_id},
                    data: {
                        last_active: new Date()
                    }
                })
            };


            const data: Partial<IUsefuleUserDetails> = {
                user_id: updatedUser.user_id,
                first_name: updatedUser.first_name,
                last_name: updatedUser.last_name,
                email: updatedUser.email,
                avatar_url: updatedUser.avatar_url ?? null,
                phone: updatedUser.phone ?? null,
                role: updatedUser.role ?? "CUSTOMER",
                vendor: vendor ?? undefined
            }

            // DEBUG: logging out the updated user data to see if changes are really applied
            context.warn(data);

            return {
                status: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: "User details retrieved successfully",
                    user: data
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