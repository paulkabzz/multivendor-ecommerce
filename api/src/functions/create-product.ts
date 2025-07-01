import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { withAuth } from "../utils/middleware";
import { DecodedToken } from "../utils/authMiddleware";
import prisma from "../utils/database";
import { headers, parseJsonRequest, processImagesFromMultipart } from "../utils/helpers";
import { ICreateProduct } from "../utils/types";
import { ProductImages } from "../utils/product-images"; // Assuming you export this from your service

interface CreateProductRequest extends ICreateProduct {
    images?: string[];
}

// TODO: FIx product creation logic
/// make some fields optional
async function createProduct(request: HttpRequest, context: InvocationContext, decodedToken?: DecodedToken): Promise<HttpResponseInit> {
    if (request.method === "POST") {
        try {
            let requestData: CreateProductRequest;
            let imageFiles: { buffer: Buffer; filename: string; mimeType: string }[] = [];

            const contentType = request.headers.get("content-type") || "";
            
            if (contentType.includes("multipart/form-data")) {
                const processingResult = await processImagesFromMultipart(
                    request,
                    'images', // Field name for images
                    {
                        maxSizeBytes: 20 * 1024 * 1024, // 20MB per image
                        outputQuality: 85,
                        maxWidth: 1920,
                        maxHeight: 1920,
                        convertToJpeg: true,
                        maxImages: 6
                    },
                    context
                );

                if (!processingResult.success) {
                    return {
                        status: 400,
                        headers,
                        body: JSON.stringify({
                            success: false,
                            message: processingResult.error
                        })
                    };
                }

                imageFiles = processingResult.imageFiles || [];
                requestData = {
                    name: processingResult.formData?.name || "",
                    vendor_id: processingResult.formData?.vendor_id || "",
                    price: parseFloat(processingResult.formData?.price || "0"),
                    description: processingResult.formData?.description || null,
                    condition: processingResult.formData?.condition || "GOOD",
                    is_available: processingResult.formData?.is_available === "true",
                    subcategory_id: processingResult.formData?.subcategory_id || "",
                    size_id: processingResult.formData?.size_id || "",
                    brand_id: processingResult.formData?.brand_id || null,
                    department_id: processingResult.formData?.department_id || null
                };
            } else {
                requestData = await parseJsonRequest(request) as CreateProductRequest;
            }

            const { 
                name, 
                vendor_id, 
                price, 
                description, 
                condition, 
                is_available = true,
                subcategory_id,
                size_id,
                brand_id,
                department_id
            } = requestData;

            if (!name || name.trim().length < 2) {
                return {
                    status: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "Product name must be at least 2 characters long"
                    })
                };
            }

            if (!vendor_id) {
                return {
                    status: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "Vendor ID is required"
                    })
                };
            }

            if (!price || price <= 0) {
                return {
                    status: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "Price must be greater than 0"
                    })
                };
            }

            // Verify vendor ownership (vendors can only create products for their own store)
            if (decodedToken?.role === "VENDOR") {
                const vendor = await prisma.vendor.findFirst({
                    where: { 
                        user_id: decodedToken.user_id,
                        vendor_id: vendor_id 
                    }
                });

                if (!vendor) {
                    return {
                        status: 403,
                        headers,
                        body: JSON.stringify({
                            success: false,
                            message: "You can only create products for your own store"
                        })
                    };
                }
            }

            // Verify vendor exists
            const vendorExists = await prisma.vendor.findUnique({
                where: { vendor_id }
            });

            if (!vendorExists) {
                return {
                    status: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "Vendor not found"
                    })
                };
            }

            if (subcategory_id) {
                const subcategoryExists = await prisma.subcategory.findUnique({
                    where: { subcategory_id }
                });
                if (!subcategoryExists) {
                    return {
                        status: 400,
                        headers,
                        body: JSON.stringify({
                            success: false,
                            message: "Subcategory not found"
                        })
                    };
                }
            }

            if (size_id) {
                const sizeExists = await prisma.sizes.findUnique({
                    where: { size_id }
                });
                if (!sizeExists) {
                    return {
                        status: 400,
                        headers,
                        body: JSON.stringify({
                            success: false,
                            message: "Size not found"
                        })
                    };
                }
            }

            if (brand_id) {
                const brandExists = await prisma.brands.findUnique({
                    where: { brand_id }
                });
                if (!brandExists) {
                    return {
                        status: 400,
                        headers,
                        body: JSON.stringify({
                            success: false,
                            message: "Brand not found"
                        })
                    };
                }
            }

            if (department_id) {
                const departmentExists = await prisma.department.findUnique({
                    where: { department_id }
                });
                if (!departmentExists) {
                    return {
                        status: 400,
                        headers,
                        body: JSON.stringify({
                            success: false,
                            message: "Department not found"
                        })
                    };
                }
            }

            // Execute transaction
            const result = await prisma.$transaction(async (tx) => {
                // Create product
                const product = await tx.product.create({
                    data: {
                        name: name.trim(),
                        vendor_id,
                        price,
                        decsription: description, // TODO: I need to fix the typo in the schema
                        condition,
                        is_available,
                        subcategory_id,
                        size_id,
                        brand_id,
                        department_id
                    },
                    include: {
                        vendor: {
                            select: {
                                store_name: true,
                                user_id: true
                            }
                        },
                        subcategory: {
                            select: {
                                subcategory_name: true
                            }
                        },
                        sizes: {
                            select: {
                                size_name: true,
                                category: true
                            }
                        },
                        brands: {
                            select: {
                                brand_name: true
                            }
                        },
                        department: {
                            select: {
                                department_name: true
                            }
                        }
                    }
                });

                // Handle image uploads]
                let uploadedImages: string[] = [];
                if (imageFiles.length > 0) {
                    try {
                        const imageUploadFiles = imageFiles.map(file => ({
                            fileBuffer: file.buffer,
                            fileName: file.filename,
                            mimeType: file.mimeType
                        }));

                        const imageUploadResult = await ProductImages.uploadProductImages(
                            imageUploadFiles,
                            product.product_id,
                            process.env.APPWRITE_PRODUCT_IMAGES_BUCKET_ID,
                            6,
                            false // don't replace existing (since this is a new product)
                        );

                        if (imageUploadResult.success && imageUploadResult.uploadedImages.length > 0) {
                            // Store image URLs in database
                            const imageRecords = imageUploadResult.uploadedImages.map(img => ({
                                image_url: img.imageUrl!,
                                product_id: product.product_id
                            }));

                            await tx.image.createMany({
                                data: imageRecords
                            });

                            uploadedImages = imageUploadResult.uploadedImages.map(img => img.imageUrl!);
                        } else if (imageUploadResult.failedImages.length > 0) {
                            // Log failed uploads but don't fail the entire operation
                            context.warn("Some images failed to upload:", imageUploadResult.failedImages);
                        }
                    } catch (error: unknown) {
                        context.error("Error uploading product images:", error);
                        // Continue without failing the product creation
                    }
                }

                return { product, uploadedImages };
            }, {
                timeout: 30000
            });

            return {
                status: 201,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: "Product created successfully",
                    data: {
                        product_id: result.product.product_id,
                        name: result.product.name,
                        price: result.product.price,
                        description: result.product.decsription,
                        condition: result.product.condition,
                        is_available: result.product.is_available,
                        created_at: result.product.created_at,
                        vendor: {
                            vendor_id: result.product.vendor_id,
                            store_name: result.product.vendor.store_name
                        },
                        subcategory: result.product.subcategory ? {
                            subcategory_id: result.product.subcategory_id,
                            subcategory_name: result.product.subcategory.subcategory_name
                        } : null,
                        size: result.product.sizes ? {
                            size_id: result.product.size_id,
                            size_name: result.product.sizes.size_name,
                            category: result.product.sizes.category
                        } : null,
                        brand: result.product.brands ? {
                            brand_id: result.product.brand_id,
                            brand_name: result.product.brands.brand_name
                        } : null,
                        department: result.product.department ? {
                            department_id: result.product.department_id,
                            department_name: result.product.department.department_name
                        } : null,
                        images: result.uploadedImages,
                        image_count: result.uploadedImages.length
                    }
                })
            };

        } catch (error: unknown) {
            context.error("Error creating product:", error);
            
            if (error instanceof Error) {
                if (error.message.includes("Unique constraint")) {
                    context.error(error);
                    return {
                        status: 409,
                        headers,
                        body: JSON.stringify({
                            success: false,
                            message: "A product with this name already exists for this vendor"
                        })
                    };
                }
                
                if (error.message.includes("Foreign key constraint")) {
                    context.error(error);
                    return {
                        status: 400,
                        headers,
                        body: JSON.stringify({
                            success: false,
                            message: "Invalid reference data provided"
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

const CREATE_PRODUCT = withAuth(createProduct, ["VENDOR", "ADMIN"]);

app.http('create-product', {
    authLevel: "anonymous",
    methods: ["POST"],
    handler: CREATE_PRODUCT
});