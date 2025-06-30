import sharp from 'sharp';
import convert  from 'heic-convert';
import * as multipart from 'parse-multipart-data';
import { HttpRequest, InvocationContext } from '@azure/functions';
import { ImageProcessingOptions, ImageProcessingResult, ProcessedImageFile } from './types';


const DEFAULT_OPTIONS: Required<ImageProcessingOptions> = {
  maxSizeBytes: 20 * 1024 * 1024, // 20MB
  outputQuality: 85,
  maxWidth: 1024,
  maxHeight: 1024,
  convertToJpeg: true,
  maxImages: 6
};

export async function processImageFromMultipart(
  request: HttpRequest,
  imageFieldName: string = 'avatar',
  options: ImageProcessingOptions = {},
  context?: { log: (message: string) => void; error: (message: string, error?: unknown) => void }
): Promise<ImageProcessingResult> {
  try {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const contentType = request.headers.get("content-type") || "";
    
    if (!contentType.includes("multipart/form-data")) {
      return {
        success: false,
        error: "Content-Type must be multipart/form-data for image uploads"
      };
    }

    const boundary = contentType.split("boundary=")[1];
    if (!boundary) {
      return {
        success: false,
        error: "Invalid multipart boundary"
      };
    }

    const body = await request.arrayBuffer();
    const parts = multipart.parse(Buffer.from(body), boundary);
    
    let imageFile: ProcessedImageFile | null = null;
    const formData: Record<string, string> = {};
    
    for (const part of parts) {
      const name = part.name;
      
      if (name === imageFieldName && part.data && part.data.length > 0) {
        const result = await processImageBuffer(part, opts, context);
        if (!result.success) {
          return result;
        }
        imageFile = result.imageFile!;
      } else if (part.data && typeof name === "string" && name) {
        // Extract other form fields
        const value = part.data.toString('utf8');
        if (value && value.trim()) {
          formData[name] = value;
        }
      }
    }

    return {
      success: true,
      imageFile: imageFile || undefined,
      formData
    };

  } catch (error) {
    context?.error("Error processing multipart image data:", error);
    return {
      success: false,
      error: "Failed to process multipart data"
    };
  }
}

async function processImageBuffer(
  part: { data: Buffer; type?: string; filename?: string },
  options: Required<ImageProcessingOptions>,
  context?: { log: (message: string) => void; error: (message: string, error?: unknown) => void }
): Promise<ImageProcessingResult> {
  try {
    let processedBuffer = part.data;
    let processedMimeType = part.type || "image/jpeg";
    let processedFilename = part.filename || `image_${Date.now()}.jpg`;

    // Check file size first
    if (processedBuffer.length > options.maxSizeBytes) {
      return {
        success: false,
        error: `File size cannot exceed ${Math.round(options.maxSizeBytes / (1024 * 1024))}MB`
      };
    }

    // Check if the uploaded file is HEIC/HEIF
    const isHeic = processedMimeType.toLowerCase().includes('heic') || 
                  processedMimeType.toLowerCase().includes('heif') ||
                  processedFilename.toLowerCase().endsWith('.heic') ||
                  processedFilename.toLowerCase().endsWith('.heif') ||
                  processedMimeType === 'image/heif';

    if (isHeic) {
      const heicResult = await processHeicImage(processedBuffer, processedFilename, options, context);
      if (!heicResult.success) {
        return heicResult;
      }
      processedBuffer = heicResult.buffer!;
      processedMimeType = heicResult.mimeType!;
      processedFilename = heicResult.filename!;
    } else {
      // Process regular images
      const regularResult = await processRegularImage(processedBuffer, processedFilename, processedMimeType, options, context);
      if (!regularResult.success) {
        return regularResult;
      }
      processedBuffer = regularResult.buffer!;
      processedMimeType = regularResult.mimeType!;
      processedFilename = regularResult.filename!;
    }

    return {
      success: true,
      imageFile: {
        buffer: processedBuffer,
        filename: processedFilename,
        mimeType: processedMimeType
      }
    };

  } catch (error) {
    context?.error("Error processing image buffer:", error);
    return {
      success: false,
      error: "Failed to process image"
    };
  }
}

async function processHeicImage(
  buffer: Buffer,
  filename: string,
  options: Required<ImageProcessingOptions>,
  context?: { log: (message: string) => void; error: (message: string, error?: unknown) => void }
): Promise<{ success: boolean; buffer?: Buffer; mimeType?: string; filename?: string; error?: string }> {
  try {
    context?.log(`Converting HEIC image to JPEG: ${filename}`);
    
    // Convert HEIC to JPEG using heic-convert
    const jpegBuffer = await convert({
      buffer: buffer,
      format: 'JPEG',
      quality: 0.8
    });

    const processedBuffer = await sharp(Buffer.from(jpegBuffer))
      .jpeg({ 
        quality: options.outputQuality,
        progressive: true 
      })
      .resize(options.maxWidth, options.maxHeight, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .toBuffer();

    const nameWithoutExt = filename.replace(/\.(heic|heif)$/i, '');
    const newFilename = `${nameWithoutExt}.jpg`;
    
    context?.log(`Successfully converted HEIC to JPEG: ${newFilename}, size: ${processedBuffer.length} bytes`);
    
    return {
      success: true,
      buffer: processedBuffer,
      mimeType: "image/jpeg",
      filename: newFilename
    };

  } catch (conversionError) {
    context?.error("Error converting HEIC to JPEG:", conversionError);
    return {
      success: false,
      error: "Failed to convert HEIC image. Please try uploading a JPEG or PNG file instead."
    };
  }
}

async function processRegularImage(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  options: Required<ImageProcessingOptions>,
  context?: { log: (message: string) => void; error: (message: string, error?: unknown) => void }
): Promise<{ success: boolean; buffer?: Buffer; mimeType?: string; filename?: string; error?: string }> {
  try {
    const imageInfo = await sharp(buffer).metadata();
    
    if (imageInfo.format && ['jpeg', 'jpg', 'png', 'webp'].includes(imageInfo.format)) {
      let processedBuffer: Buffer;
      let processedMimeType = mimeType;
      let processedFilename = filename;

      if (options.convertToJpeg) {
        // Convert to JPEG
        processedBuffer = await sharp(buffer)
          .resize(options.maxWidth, options.maxHeight, { 
            fit: 'inside',
            withoutEnlargement: true 
          })
          .jpeg({ quality: options.outputQuality })
          .toBuffer();
        
        processedMimeType = "image/jpeg";

        // Update filename extension if needed
        if (!processedFilename.toLowerCase().endsWith('.jpg') && !processedFilename.toLowerCase().endsWith('.jpeg')) {
          const nameWithoutExt = processedFilename.replace(/\.(png|webp|gif|bmp)$/i, '');
          processedFilename = `${nameWithoutExt}.jpg`;
        }
      } else {
        // Keep original format but resize
        let sharpInstance = sharp(buffer).resize(options.maxWidth, options.maxHeight, { 
          fit: 'inside',
          withoutEnlargement: true 
        });

        // Apply format-specific options
        switch (imageInfo.format) {
          case 'jpeg':
          case 'jpg':
            sharpInstance = sharpInstance.jpeg({ quality: options.outputQuality });
            break;
          case 'png':
            sharpInstance = sharpInstance.png({ quality: options.outputQuality });
            break;
          case 'webp':
            sharpInstance = sharpInstance.webp({ quality: options.outputQuality });
            break;
        }

        processedBuffer = await sharpInstance.toBuffer();
      }

      return {
        success: true,
        buffer: processedBuffer,
        mimeType: processedMimeType,
        filename: processedFilename
      };
    } else {
      return {
        success: false,
        error: "Unsupported image format. Please upload JPEG, PNG, or WebP images."
      };
    }

  } catch (imageProcessError) {
    context?.error("Image processing failed:", imageProcessError);
    return {
      success: false,
      error: "Failed to process image"
    };
  }
}


export async function parseJsonRequest(request: HttpRequest): Promise<any> {
  try {
    return await request.json();
  } catch (error) {
    throw new Error("Invalid JSON data");
  }
}


export const isValidUCTEmail = (email: string): boolean => {
    return /^[a-zA-Z]{6}[0-9]{3}@myuct\.ac\.za$/.test(email.trim().toLowerCase());
}

export const isStrongPassword = (password: string): boolean => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9])(?=.{8,}).*$/.test(password) && password.length >= 8;
}

export const headers = { 
    'Content-Type': 'application/json',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
} as const;





// Mulltiple images
export async function processImagesFromMultipart(
    request: HttpRequest,
    imageFieldName: string,
    options: ImageProcessingOptions,
    context: InvocationContext
): Promise<ImageProcessingResult> {
    try {
        const formData = await request.formData();
        const imageFiles: { buffer: Buffer; filename: string; mimeType: string }[] = [];
        const textData: Record<string, string> = {};

        // Process text fields
        for (const [key, value] of formData.entries()) {
            if (key === imageFieldName) continue; // Skip image fields for now
            if (typeof value === 'string') {
                textData[key] = value;
            }
        }

        // Process image fields
        const imageEntries = formData.getAll(imageFieldName);
        
        if (options.maxImages && imageEntries.length > options.maxImages) {
            return {
                success: false,
                error: `Too many images. Maximum allowed: ${options.maxImages}`
            };
        }

        for (const entry of imageEntries) {
            if (entry instanceof File) {
                // Validate file size
              if (options.maxSizeBytes)
                if (entry.size > options.maxSizeBytes) {
                    return {
                        success: false,
                        error: `Image ${entry.name} is too large. Maximum size: ${options.maxSizeBytes / (1024 * 1024)}MB`
                    };
                }

                // Validate file type
                const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
                if (!allowedTypes.includes(entry.type)) {
                    return {
                        success: false,
                        error: `Invalid file type for ${entry.name}. Allowed types: JPEG, PNG, WEBP`
                    };
                }

                // Convert to buffer
                const arrayBuffer = await entry.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);

                // TODO: add resuzing logic
                const processedImage = {
                    buffer,
                    filename: entry.name,
                    mimeType: options.convertToJpeg ? 'image/jpeg' : entry.type
                };

                imageFiles.push(processedImage);
            }
        }

        return {
            success: true,
            imageFiles,
            formData: textData
        };

    } catch (error) {
        context.error('Error processing multipart form data:', error);
        return {
            success: false,
            error: 'Failed to process form data'
        };
    }
}