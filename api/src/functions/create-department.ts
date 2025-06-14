import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { withAuth } from "../utils/middleware";
import { ICreateDepartment } from "../utils/types";
import { DecodedToken } from "../utils/authMiddleware";
import prisma from "../utils/database";

async function createDepartment(request: HttpRequest, context: InvocationContext, decodedToken?: DecodedToken): Promise<HttpResponseInit> {
    const headers = {
        'Content-Type': 'application/json'
    };

    // Department -> Male, female, kids, sports
    // Categories -> Clothes, Shoes, Accessories, etc
    // Subcategories -> Sneakers, flipflops, dresses, hoodies

    /**
     * A category belongs to a department, example - clothes, belong to the male, female, kids, etc departments
     * A category has subcategories, examples - a subcategory dress belongs to the clothes categories
     * 
     * SO the department comes first, then the category, then the subcat
     */

    if (request.method === 'POST') {
        try {

            const { department_name, user_id } = await request.json() as ICreateDepartment;

            if (!department_name) {
                return {
                    status: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "No department name provided."
                    })
                }
            };

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


            if (decodedToken && decodedToken.user_id !== user_id && decodedToken.role !== 'ADMIN') {
                return {
                    status: 403,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "You are not authorised to create new departmenrs"
                    })
                };
            };


            const exsistingUser = await prisma.users.findUnique({
                where: {user_id}
            });

            if (!exsistingUser) {
                return {
                    status: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "User does not exsist."
                    })
                }
            };

            if (decodedToken && (decodedToken.user_id !== exsistingUser?.user_id || exsistingUser.role !== 'ADMIN')) {
                return {
                    status: 403,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "You are not authorised to create new departmenrs"
                    })
                };
            };


            const existingDepartment = await prisma.department.findUnique({
                where: {department_name}
            });

            if (existingDepartment) {
                return {
                    status: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "Department called " +  department_name + " already exists."
                    })
                };
            };

            await prisma.department.create({
                data: {
                    department_name,
                }
            });

            return {
                status: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: "Department created successfully."
                })
            }

            
        } catch (error: unknown) {
            context.log("Error creating department", error);
            return {
                status: 500,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: "Internal server error"
                })
            }
        }
    }

    return {
        status: 405,
        headers,
        body: JSON.stringify({ success: false, message: "Method not allowed" })        
    }
}

const adminCreateDepartment = withAuth(createDepartment, ['ADMIN']);

app.http('create-department', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: adminCreateDepartment
});