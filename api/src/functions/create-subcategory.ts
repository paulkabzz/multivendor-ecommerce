import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { DecodedToken } from "../utils/authMiddleware";
import prisma from "../utils/database";
import { withAuth } from "../utils/middleware";
import { headers } from "../utils/helpers";

interface ICreateSubCategory {
    subcategory_name: string[];
    category_id: string;
}

async function createSubcategory(request: HttpRequest, context: InvocationContext, decodedToken?: DecodedToken): Promise<HttpResponseInit> {

    if (request.method === "POST") {
        try {
            const { subcategory_name, category_id } = await request.json() as ICreateSubCategory;

            // Validate category_id
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

            // Validate subcategory_name array
            if (!subcategory_name || !Array.isArray(subcategory_name) || subcategory_name.length === 0) {
                return {
                    status: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "Subcategory names must be provided as a non-empty array"
                    })
                };
            }

            // Validate each subcategory name
            const invalidSubcategories = subcategory_name.filter(name => 
                typeof name !== 'string' || name.trim().length === 0
            );

            if (invalidSubcategories.length > 0) {
                return {
                    status: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "All subcategory names must be non-empty strings"
                    })
                };
            }

            // Normalize subcategory names
            const normalizedNames = subcategory_name.map(name => name.trim());
            
            // Check if category exists
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

            // Check for existing subcategories already linked to this category
            const existingLinksInCategory = await prisma.categorysubcategory.findMany({
                where: {
                    category_id,
                    subcategory: {
                        subcategory_name: {
                            in: normalizedNames
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

            if (existingLinksInCategory.length > 0) {
                const duplicates = existingLinksInCategory.map(link => link.subcategory.subcategory_name);
                return {
                    status: 409,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: `Subcategories already exist in this category: ${duplicates.join(', ')}`
                    })
                }
            }

            // Get existing subcategories globally (to reuse if they exist)
            const existingGlobalSubcategories = await prisma.subcategory.findMany({
                where: {
                    subcategory_name: {
                        in: normalizedNames
                    }
                }
            });

            const existingGlobalNames = existingGlobalSubcategories.map(s => s.subcategory_name);

            const result = await prisma.$transaction(async tx => {
                const processedSubcategories = [];
                let newSubcategoriesCreated = 0;

                for (const name of normalizedNames) {
                    let subcategoryId: string;
                    let isNewSubcategory = false;

                    // Check if subcategory already exists globally
                    const existingSubcategory = existingGlobalSubcategories.find(
                        subcat => subcat.subcategory_name === name
                    );

                    if (existingSubcategory) {
                        // Use existing subcategory
                        subcategoryId = existingSubcategory.subcategory_id;
                    } else {
                        // Create new subcategory
                        const newSubcategory = await tx.subcategory.create({
                            data: {
                                subcategory_name: name
                            }
                        });
                        subcategoryId = newSubcategory.subcategory_id;
                        isNewSubcategory = true;
                        newSubcategoriesCreated++;
                    }

                    // Create the link between category and subcategory
                    await tx.categorysubcategory.create({
                        data: {
                            category_id,
                            subcategory_id: subcategoryId
                        }
                    });

                    processedSubcategories.push({
                        subcategory_id: subcategoryId,
                        subcategory_name: name,
                        was_new_subcategory: isNewSubcategory
                    });
                }

                return {
                    processedSubcategories,
                    newSubcategoriesCreated,
                    totalProcessed: processedSubcategories.length
                };
            });
            
            context.log(`Successfully processed ${result.totalProcessed} subcategories for category ${category_id}. Created ${result.newSubcategoriesCreated} new subcategories.`);

            return {
                status: 201,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: "Subcategory(ies) created and linked successfully.",
                    data: {
                        category_id,
                        category_name: category.category_name,
                        subcategories_processed: result.processedSubcategories,
                        total_processed: result.totalProcessed,
                        new_subcategories_created: result.newSubcategoriesCreated
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

const CREATE_SUBCATEGORY = withAuth(createSubcategory, ['ADMIN']);

app.http('create-subcategory', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: CREATE_SUBCATEGORY
});