import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { DecodedToken } from "../utils/authMiddleware";
import prisma from "../utils/database";
import { ICreateSubCategory } from "../utils/types";
import { withAuth } from "../utils/middleware";

async function createSubcategory(request: HttpRequest, context: InvocationContext, decodedToken?: DecodedToken): Promise<HttpResponseInit> {
    const headers = {
        'Content-Type': 'application/json'
    };

    if (request.method === "POST") {
        try {

            const { user_id, subcategory_name, category_id } = await request.json() as ICreateSubCategory;

            if (!user_id) {
                return {
                    status: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "No user ID provided"
                    })
                }
            }

            if (!category_id) {
                return {
                    status: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "No category ID provided."
                    })
                }
            }

            if (decodedToken && decodedToken.user_id !== user_id && decodedToken.role !== 'ADMIN') {
                return {
                    status: 403,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "You are not authorised to create new subcategories"
                    })
                };
            };
            
            const existingUser = await prisma.users.findUnique({
                where: { user_id }
            });

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

            if (decodedToken && (decodedToken.user_id !== existingUser.user_id && existingUser.role !== 'ADMIN')) {
                return {
                    status: 403,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "You are not authorised to create new subcategories"
                    })
                };
            };
            
            if (!subcategory_name || !Array.isArray(subcategory_name) || subcategory_name.length === 0) {
                return {
                    status: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "Category names must be provided as a non-empty array"
                    })
                };
            }

            const invalidSubcategories: string[] = subcategory_name.filter(name => 
                typeof name !== 'string' || name.trim().length === 0
            );

            if (invalidSubcategories.length > 0) {
                return {
                    status: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "All category names must be non-empty strings"
                    })
                };
            }
            
            const category = prisma.category.findUnique({
                where: { category_id }
            });

            if (!category) {
                return {
                    status: 404,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "Category not found."
                    })
                }
            }

            const exsitingSubcategoriesInCategory = await prisma.categorysubcategory.findMany({
                where: {
                    category_id,
                    subcategory: {
                        subcategory_name: {
                            in: subcategory_name.map(name => name.trim())
                        }
                    }
                }, 
                include: {
                    subcategory: {
                        select: {
                            subcategory_name: true
                        }
                    }
                }
            });

            if (exsitingSubcategoriesInCategory.length > 0) {
                const duplicates = exsitingSubcategoriesInCategory.map(duplicate => duplicate.subcategory.subcategory_name);
                return {
                    status: 409,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: `Categories already exist in this department: ${duplicates.join(', ')}`
                    })
                }
            }

            const exsistingGobalSubcategories = await prisma.subcategory.findMany({
                where: {
                    subcategory_name: {
                        in: subcategory_name.map(name => name.trim())
                    }
                },
                select: {
                    subcategory_id: true,
                    subcategory_name: true
                }
            })
            
            

            return {
                status: 201,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: "Subcategory(ies) created successfully."
                })
            }
            
        } catch (error: unknown) {
            context.error("Error creating subcategory", error);

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
            message: "Method not allowed."
        })
    }

}

const adminCreateSubcategory = withAuth(createSubcategory, ['ADMIN']);

app.http('create-subcategory', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: adminCreateSubcategory
});