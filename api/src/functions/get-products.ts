import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { headers } from "../utils/helpers";
import prisma from "../utils/database";

async function getProducts(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    if (request.method === "GET") {
        try {
            const url = new URL(request.url);
            const department_id = url.searchParams.get("departmentId");
            const category_id = url.searchParams.get("categoryId");
            const subcategory_id = url.searchParams.get("subcategory_id");
            const brand_id = url.searchParams.get("brandId");
            const size_id = url.searchParams.get("sizeId");
            const condition = url.searchParams.get("condition");
            const vendor_id = url.searchParams.get("vendorId");
            const is_available = url.searchParams.get("isAvailable");
            
            // Pagination parameters
            const page = parseInt(url.searchParams.get("page") || "1");
            const limit = parseInt(url.searchParams.get("limit") || "20");
            const offset = (page - 1) * limit;

            // Search parameters
            const search = url.searchParams.get("search");
            const sortBy = url.searchParams.get("sortBy") || "created_at";
            const sortOrder = url.searchParams.get("sortOrder") || "desc";

            // Build where clause
            const where: any = {};

            if (department_id) {
                where.department_id = department_id;
            }

            if (subcategory_id) {
                where.subcategory_id = subcategory_id;
            }

            if (brand_id) {
                where.brand_id = brand_id;
            }

            if (size_id) {
                where.size_id = size_id;
            }

            if (condition) {
                where.condition = condition.toUpperCase();
            }

            if (vendor_id) {
                where.vendor_id = vendor_id;
            }

            if (is_available !== null) {
                where.is_available = is_available === "true";
            } else {
                where.is_available = true;
            }

            // Handle category filtering through subcategory relationship
            if (category_id && !subcategory_id) {
                where.subcategory = {
                    categorysubcategory: {
                        some: {
                            category_id: category_id
                        }
                    }
                };
            }

            // Handle search
            if (search) {
                where.OR = [
                    {
                        name: {
                            contains: search,
                            mode: 'insensitive'
                        }
                    },
                    {
                        decsription: {
                            contains: search,
                            mode: 'insensitive'
                        }
                    }
                ];
            }

            // Build orderBy clause
            const orderBy: any = {};
            if (sortBy === "price") {
                orderBy.price = sortOrder;
            } else if (sortBy === "name") {
                orderBy.name = sortOrder;
            } else {
                orderBy.created_at = sortOrder;
            }

            // Get products with related data
            const products = await prisma.product.findMany({
                where,
                include: {
                    image: true,
                    vendor: {
                        include: {
                            users: {
                                select: {
                                    first_name: true,
                                    last_name: true,
                                    avatar_url: true
                                }
                            }
                        }
                    },
                    brands: true,
                    sizes: true,
                    department: true,
                    subcategory: {
                        include: {
                            categorysubcategory: {
                                include: {
                                    category: true
                                }
                            }
                        }
                    }
                },
                orderBy,
                skip: offset,
                take: limit
            });

            // Get total count for pagination
            const totalCount = await prisma.product.count({ where });

            // Calculate pagination info
            const totalPages = Math.ceil(totalCount / limit);
            const hasNextPage = page < totalPages;
            const hasPrevPage = page > 1;

            return {
                status: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    data: {
                        products,
                        pagination: {
                            currentPage: page,
                            totalPages,
                            totalCount,
                            limit,
                            hasNextPage,
                            hasPrevPage
                        }
                    }
                })
            };

        } catch (error) {
            context.error("Error fetching products:", error);
            
            return {
                status: 500,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: "Internal server error while fetching products.",
                    error: process.env.NODE_ENV === 'development' ? error : undefined
                })
            };
        }
    }

    return {
        status: 405,
        headers,
        body: JSON.stringify({
            success: false,
            message: "Method not allowed."
        })
    };
}

app.http('get-products', {
    methods: ["GET"],
    authLevel: "anonymous",
    handler: getProducts
});