import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import prisma from "../utils/database";
import { IUpdateUserRequest } from "../utils/types";


async function updateUser(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {

    const headers = {
        'Content-Type': 'application/json'
    };

    if (request.method === "PATCH") {

        try {

            const { first_name, last_name, email, phone, user_id } = await request.json() as IUpdateUserRequest;
        
            if (!user_id) {
                return {
                    status: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "No user ID provided"
                    })
                }
            };


            const existingUser = await prisma.users.findUnique({ where: {user_id: user_id}});

            if (!existingUser) {
                return {
                    status: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "User does no exsist"
                    })
                }
            };

        } catch (error) {
            context.log("Error updating user", error);
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

    return {
        status: 405,
        headers,
        body: JSON.stringify({ success: false, message: "Method not allowed" })
    };
}

app.http('update-user', {
    methods: ['PATCH'],
    authLevel: 'anonymous',
    handler: updateUser
});
