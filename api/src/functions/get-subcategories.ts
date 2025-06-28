import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import prisma from "../utils/database";
import { headers } from "../utils/helpers";

async function getSubcategories(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {

    if (request.method === "GET") {
        try {
            // Get query parameters instead of request body for GET request
            const url = new URL(request.url);
            const category_id = url.searchParams.get('categoryId');
            const department_id = url.searchParams.get('departmentId');

            // Validate required parameters
            if (!category_id) {
                context.error("No category ID provided");
                return {
                    status: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "No category ID provided"
                    })
                }
            }

            // Build the where clause
            let whereClause: any = { category_id };

            // If department_id is provided, add the constraint to ensure the category belongs to that department
            if (department_id) {
                whereClause = {
                    category_id,
                    category: {
                        departmentcategory: {
                            some: {
                                department_id
                            }
                        }
                    }
                };
            }

            const subcategories = await prisma.categorysubcategory.findMany({
                where: whereClause,
                include: {
                    subcategory: {
                        select: {
                            subcategory_id: true,
                            subcategory_name: true
                        }
                    }
                }
            });

            if (!subcategories || subcategories.length === 0) {
                context.log("Subcategories not found.");
                return {
                    status: 404,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "Subcategories not found."
                    })
                }
            }

            // Transform the data to return clean subcategory objects
            const formattedSubcategories = subcategories.map(item => item.subcategory);

            return {
                status: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: "Subcategories retrieved successfully",
                    body: formattedSubcategories
                })
            }

        } catch (error: unknown) {
            context.error("Error fetching subcategories", error);
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

/**
 * Endpoint usage:
 *      ${BASE_URL}/get-subcategories?category_id=xxx -> returns subcategories for a specific category
 *      ${BASE_URL}/get-subcategories?category_id=xxx&department_id=yyy -> returns subcategories that belong to both the category AND the department
 */
app.http('get-subcategories', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: getSubcategories
});