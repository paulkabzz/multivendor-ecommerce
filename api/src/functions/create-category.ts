import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { DecodedToken } from "../utils/authMiddleware";
import { withAuth } from "../utils/middleware";
import { ICreateCategory } from "../utils/types";
import prisma from "../utils/database";
import { headers } from "../utils/helpers";

async function createCategory(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {

    if (request.method === "POST") {
        try {
            const { department_id, category_name } = await request.json() as ICreateCategory;

            if (!department_id) {
                return {
                    status: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "No department provided."
                    })
                };
            }

            if (!category_name || !Array.isArray(category_name) || category_name.length === 0) {
                return {
                    status: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "Category names must be provided as a non-empty array"
                    })
                };
            }

            const invalidCategories = category_name.filter(name => 
                typeof name !== 'string' || name.trim().length === 0
            );

            if (invalidCategories.length > 0) {
                return {
                    status: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "All category names must be non-empty strings"
                    })
                };
            }

            const department = await prisma.department.findUnique({
                where: { department_id }
            });

            if (!department) {
                return {
                    status: 404,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "Department not found"
                    })
                };
            }

            // Check for duplicate category names within the same department
            const existingCategoriesInDepartment = await prisma.departmentcategory.findMany({
                where: {
                    department_id,
                    category: {
                        category_name: {
                            in: category_name.map(name => name.trim())
                        }
                    }
                },
                include: {
                    category: {
                        select: {
                            category_name: true
                        }
                    }
                }
            });

            if (existingCategoriesInDepartment.length > 0) {
                const duplicateNames = existingCategoriesInDepartment.map(dc => dc.category.category_name);
                return {
                    status: 409,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: `Categories already exist in this department: ${duplicateNames.join(', ')}`
                    })
                };
            }

            const existingGlobalCategories = await prisma.category.findMany({
                where: {
                    category_name: {
                        in: category_name.map(name => name.trim())
                    }
                },
                select: {
                    category_id: true,
                    category_name: true
                }
            });

            const result = await prisma.$transaction(async (tx) => {
                const createdCategories = [];
                const departmentCategoryLinks = [];

                for (const name of category_name) {
                    const trimmedName = name.trim();
                    
                    let existingCategory = existingGlobalCategories.find(
                        cat => cat.category_name === trimmedName
                    );

                    let categoryId: string;

                    if (existingCategory) {
                        categoryId = existingCategory.category_id;
                    } else {
                        const newCategory = await tx.category.create({
                            data: {
                                category_name: trimmedName
                            }
                        });
                        createdCategories.push(newCategory);
                        categoryId = newCategory.category_id;
                    }

                    const departmentCategoryLink = await tx.departmentcategory.create({
                        data: {
                            department_id,
                            category_id: categoryId
                        }
                    });
                    departmentCategoryLinks.push(departmentCategoryLink);
                }

                const linkedCategories = await tx.departmentcategory.findMany({
                    where: {
                        department_id,
                        category_id: {
                            in: [...createdCategories.map(c => c.category_id), 
                                ...existingGlobalCategories.filter(c => 
                                    category_name.map(n => n.trim()).includes(c.category_name)
                                ).map(c => c.category_id)]
                        }
                    },
                    include: {
                        category: true
                    }
                });

                return {
                    newCategoriesCount: createdCategories.length,
                    linkedCategoriesCount: departmentCategoryLinks.length,
                    categories: linkedCategories
                };
            });

            context.log(`Successfully processed ${result.linkedCategoriesCount} categories for department ${department_id}. Created ${result.newCategoriesCount} new categories.`);

            return {
                status: 201,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: `Successfully processed ${result.linkedCategoriesCount} categories. ${result.newCategoriesCount} new categories created.`,
                    data: {
                        department_id,
                        department_name: department.department_name,
                        categories_processed: result.categories.map(dc => ({
                            category_id: dc.category.category_id,
                            category_name: dc.category.category_name,
                            was_new_category: result.categories.some(cat => 
                                cat.category.category_id === dc.category.category_id
                            )
                        })),
                        total_linked: result.linkedCategoriesCount,
                        new_categories_created: result.newCategoriesCount
                    }
                })
            };

        } catch (error: unknown) {
            context.error("Error creating categories", error);
            
            if (error instanceof Error) {
                if (error.message.includes('Unique constraint')) {
                    return {
                        status: 409,
                        headers,
                        body: JSON.stringify({
                            success: false,
                            message: "One or more category names already exist"
                        })
                    };
                }
            }

            return {
                status: 500,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: "Internal server error"
                })
            };
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
    };
}



const CREATE_CATEGORY = withAuth(createCategory, ['ADMIN']);

app.http('create-category', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: CREATE_CATEGORY
});