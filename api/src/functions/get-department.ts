import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { DecodedToken } from "../utils/authMiddleware";
import prisma from "../utils/database";
import { headers } from "../utils/helpers";

async function getDepartments(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {

    if (request.method === "GET") {
        try {
            const url = new URL(request.url);
            const includeCategories = url.searchParams.get('include-categories') === 'true';
            const departmentId = url.searchParams.get('departmentId');

            if (departmentId) {
                // Get specific department with its categories
                const department = await prisma.department.findUnique({
                    where: { department_id: departmentId },
                    include: {
                        departmentcategory: {
                            include: {
                                category: {
                                    include: {
                                        categorysubcategory: {
                                            include: {
                                                subcategory: true
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
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

                const formattedDepartment = {
                    department_id: department.department_id,
                    department_name: department.department_name,
                    department_cover: department.image_url,
                    categories: department.departmentcategory.map((dc:any) => ({
                        category_id: dc.category.category_id,
                        category_name: dc.category.category_name,
                        subcategories: dc.category.categorysubcategory.map((cs:any) => ({
                            subcategory_id: cs.subcategory.subcategory_id,
                            subcategory_name: cs.subcategory.subcategory_name
                        }))
                    }))
                };

                return {
                    status: 200,
                    headers,
                    body: JSON.stringify({
                        success: true,
                        data: formattedDepartment
                    })
                };
            } else {
                // Get all departments
                const departments = await prisma.department.findMany({
                    include: includeCategories ? {
                        departmentcategory: {
                            include: {
                                category: {
                                    include: {
                                        categorysubcategory: {
                                            include: {
                                                subcategory: true
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    } : undefined,
                    orderBy: {
                        department_name: 'asc'
                    }
                });

                const formattedDepartments = departments.map((dept: any) => ({
                    department_id: dept.department_id,
                    department_name: dept.department_name,
                    department_cover: dept.image_url,
                    ...(includeCategories && {
                        categories: dept.departmentcategory?.map((dc: any) => ({
                            category_id: dc.category.category_id,
                            category_name: dc.category.category_name,
                            subcategories: dc.category.categorysubcategory.map((cs: any) => ({
                                subcategory_id: cs.subcategory.subcategory_id,
                                subcategory_name: cs.subcategory.subcategory_name
                            }))
                        })) || []
                    })
                }));

                return {
                    status: 200,
                    headers,
                    body: JSON.stringify({
                        success: true,
                        data: formattedDepartments,
                        total: formattedDepartments.length
                    })
                };
            }

        } catch (error: unknown) {
            context.error("Error fetching departments", error);
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
 * Endpoint params:
 *      ${BASE_URL}/get-departments -> this'll just return the department name and id, nothing else
 *      ${BASE_URL}/get-departments?include-categories=true -> this'll return the department and the categories
 *      ${BASE_URL}/get-departments?departmentId -> returns speciifc department with that id
 *      ${BASE_URL}/get-departments?departmentID&include-categories=true -> returns specific department with its categories
 */
app.http('get-departments', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: getDepartments
});