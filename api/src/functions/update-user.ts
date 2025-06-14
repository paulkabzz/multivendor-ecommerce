import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import prisma from "../utils/database";
import { IUpdateUserRequest, IUser } from "../utils/types";


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

            if (!existingUser?.is_verified) {
                return {
                    status: 403,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "Account is not verified."
                    })
                }
            };

            // Build update data object with only changed fields
            const updateData: Partial<IUpdateUserRequest> = {};
            if (first_name && first_name !== existingUser.first_name) updateData.first_name = first_name;
            if (last_name && last_name !== existingUser.last_name) updateData.last_name = last_name;
            if (email && email !== existingUser.email) updateData.email = email;
            if (phone && phone !== existingUser.phone) updateData.phone = phone;

            if (Object.keys(updateData).length === 0) {
                return {
                    status: 200,
                    headers,
                    body: JSON.stringify({ success: true, message: "No changes detected." })
                };
            }

            const updatedUser = await prisma.users.update({
                where: {
                    user_id
                },
                data: updateData
            });

            return {
                status: 200,
                headers: headers,
                body: JSON.stringify({
                    success: true,
                    message: "User updated successfuly",
                    user: updatedUser
                })
            }


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
