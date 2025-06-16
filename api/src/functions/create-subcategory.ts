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
                        message: "Subcategories names must be provided as a non-empty array"
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
            
            const category = await prisma.category.findUnique({
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
                        message: `Subcategories already exist in this category: ${duplicates.join(', ')}`
                    })
                }
            }

            const existingGobalSubcategories = await prisma.subcategory.findMany({
                where: {
                    subcategory_name: {
                        in: subcategory_name.map(name => name.trim())
                    }
                },
                select: {
                    subcategory_id: true,
                    subcategory_name: true
                }
            });

            const result = await prisma.$transaction(async tx => {
                const createdSubcategories: any[] = [];
                const categorySubcategoryLinks: any[] = [];

                for (const name of subcategory_name) {
                    const trimmedName = name.trim();

                    // Check if subcategory already exists globally
                    let existingSubcategory = existingGobalSubcategories.find(
                        subcat => subcat.subcategory_name === trimmedName
                    );

                    let subcategoryId: string;
                    
                    if (existingSubcategory) {
                        subcategoryId = existingSubcategory.subcategory_id;
                    } else {
                        const newSubcategory = await tx.subcategory.create({
                            data: {
                                subcategory_name: trimmedName
                            }
                        });
                        createdSubcategories.push(newSubcategory);
                        subcategoryId = newSubcategory.subcategory_id;                        
                    }


                    const categorySubcategoryLink = await tx.categorysubcategory.create({
                        data: {
                            category_id,
                            subcategory_id: subcategoryId
                        }
                    });

                    categorySubcategoryLinks.push(categorySubcategoryLink);

                }
                const linkedSubcategories = await tx.categorysubcategory.findMany({
                    where: { 
                        category_id,
                        subcategory_id: {
                            in: [...createdSubcategories.map(s => s.subcategory_id), ...existingGobalSubcategories.filter(s => subcategory_name.map(n => n.trim()).includes(s.subcategory_name)).map(s => s.subcategory_id)]
                        }
                    },
                    include: {
                        subcategory: true
                    }
                });

                return {
                    newSubcategoriesCount: createdSubcategories.length,
                    linkedSubcategoriesCount: linkedSubcategories.length,
                    subcategories: linkedSubcategories
                }
            });
            
            context.log(`Successfully processed ${result?.linkedSubcategoriesCount} subcategories for category ${category_id}. Created ${result?.newSubcategoriesCount} new subcategories.`);

            return {
                status: 201,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: "Subcategory(ies) created successfully.",
                    data: {
                        category_id,
                        category_name: category.category_name,
                        subcategories_processed: result?.subcategories.map(cs => ({
                            subcategory_id: cs.subcategory.subcategory_id,
                            subcategory_name: cs.subcategory.subcategory_name,
                            was_new_subcategory: result.subcategories.some(subcat => 
                                subcat.subcategory.subcategory_id === cs.subcategory.subcategory_id
                            )
                        })),
                        total_linked: result?.linkedSubcategoriesCount,
                        new_categories_created: result?.newSubcategoriesCount
                    }                    
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