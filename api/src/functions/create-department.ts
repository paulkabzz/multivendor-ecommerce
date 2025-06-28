import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { withAuth } from "../utils/middleware";
import { ICreateDepartment } from "../utils/types";
import { DecodedToken } from "../utils/authMiddleware";
import prisma from "../utils/database";
import { headers, parseJsonRequest, processImageFromMultipart } from "../utils/helpers";
import { Avatar } from "../utils/avatars";

async function createDepartment(request: HttpRequest, context: InvocationContext, decodedToken?: DecodedToken): Promise<HttpResponseInit> {
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
            let requestData: Partial<ICreateDepartment>;

            let imageFile: { buffer: Buffer; filename: string; mimeType: string } | null = null;

            const contentType = request.headers.get("content-type") || "";
            
            if (contentType.includes("multipart/form-data")) {
                const processingResult = await processImageFromMultipart(
                    request,
                    'cover',
                    {
                        maxSizeBytes: 20 * 1024 * 1024, // 20MB
                        outputQuality: 85,
                        maxWidth: 1024,
                        maxHeight: 1024,
                        convertToJpeg: true
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

                // Extract the processed image and form data
                imageFile = processingResult.imageFile || null;
                requestData = { 
                    department_name: processingResult.formData?.department_name || "",
                };
            } else {
                requestData = await parseJsonRequest(request) as Partial<ICreateDepartment>;
            }            

            const { department_name } = requestData as ICreateDepartment;

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

            await prisma.$transaction(async tx => {
                const department = await tx.department.create({
                    data: { department_name }
                })

                let coverUrl: string | null = null;
                
                if (imageFile) {
                    try {
                        const imageUploadResult = await Avatar.uploadDepartmentCover(
                            imageFile.buffer,
                            imageFile.filename,
                            imageFile.mimeType,
                            department.department_id,
                            process.env.APPWRITE_DEPARTMENT_BUCKET_ID ?? ""
                        );

                        if (imageUploadResult.success && imageUploadResult.imageUrl) {
                            coverUrl = imageUploadResult.imageUrl;
                        } else {
                            throw new Error(imageUploadResult.error || "Failed to upload department cover.")
                        }
                    } catch (error: unknown) {
                        context.error("Error uploading department cover image", error);
                        throw new Error("Failed to process image upload.")
                    }
                }

                if (coverUrl) {
                    await tx.department.update({
                        where: {
                            department_id: department.department_id
                        },
                        data: {
                            image_url: coverUrl
                        }
                    })
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
            context.error("Error creating department", error);
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

const CREATE_DEPARTMENT = withAuth(createDepartment, ['ADMIN']);

app.http('create-department', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: CREATE_DEPARTMENT
});