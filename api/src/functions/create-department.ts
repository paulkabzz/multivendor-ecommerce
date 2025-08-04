import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { withAuth } from "../utils/middleware";
import { ICreateDepartment } from "../utils/types";
import { DecodedToken } from "../utils/authMiddleware";
import prisma from "../utils/database";
import { headers, parseJsonRequest, processImageFromMultipart } from "../utils/helpers";
import { Avatar } from "../utils/avatars";

/**
 * Creates a new department in the system
 * 
 * HIERARCHY EXPLANATION:
 * Department -> Categories -> Subcategories
 * Example: "Male" department -> "Clothes" category -> "Hoodies" subcategory
 * 
 * This function handles both:
 * 1. Text-only requests (JSON)
 * 2. Requests with image uploads (multipart/form-data)
 * 
 * Expects: { department_name: string } + optional cover image
 * Returns: Success message or error
 */
async function createDepartment(request: HttpRequest, context: InvocationContext, decodedToken?: DecodedToken): Promise<HttpResponseInit> {


    if (request.method === 'POST') {
        try {
            let requestData: Partial<ICreateDepartment>;
            let imageFile: { buffer: Buffer; filename: string; mimeType: string } | null = null;

            // Check what type of request this is - JSON or file upload
            const contentType = request.headers.get("content-type") || "";
            
            if (contentType.includes("multipart/form-data")) {
                // Handle file upload request (form data with image)
                const processingResult = await processImageFromMultipart(
                    request,
                    'cover', // name of the file field
                    {
                        maxSizeBytes: 20 * 1024 * 1024, // 20MB max file size
                        outputQuality: 85, // compress to 85% quality
                        maxWidth: 1024,    // resize if larger than 1024px
                        maxHeight: 1024,
                        convertToJpeg: true // convert all images to JPEG format
                    },
                    context
                );

                // If image processing failed, return error
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
                // Handle regular JSON request (no image)
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

            // Check if a department with this name already exists
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

            // Use database transaction to ensure all operations succeed or fail together
            await prisma.$transaction(async tx => {
                // First, create the department in the database
                const department = await tx.department.create({
                    data: { department_name }
                })

                let coverUrl: string | null = null;
                
                // If user uploaded an image, process and upload it
                if (imageFile) {
                    try {
                        // Upload the processed image to cloud storage
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

                // If we successfully uploaded an image, update the department record with the image URL
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
                status: 201,
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

// Wrap function with authentication - only ADMINs can create departments
const CREATE_DEPARTMENT = withAuth(createDepartment, ['ADMIN']);

app.http('create-department', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: CREATE_DEPARTMENT
});