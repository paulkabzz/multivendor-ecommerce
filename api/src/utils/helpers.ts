import sharp from 'sharp';
import convert  from 'heic-convert';
import * as multipart from 'parse-multipart-data';
import { HttpRequest } from '@azure/functions';

export interface ProcessedImageFile {
  buffer: Buffer;
  filename: string;
  mimeType: string;
}

export interface ImageProcessingOptions {
  maxSizeBytes?: number;
  outputQuality?: number;
  maxWidth?: number;
  maxHeight?: number;
  convertToJpeg?: boolean;
}

export interface ImageProcessingResult {
  success: boolean;
  imageFile?: ProcessedImageFile;
  error?: string;
  formData?: Record<string, string>;
}

const DEFAULT_OPTIONS: Required<ImageProcessingOptions> = {
  maxSizeBytes: 20 * 1024 * 1024, // 20MB
  outputQuality: 85,
  maxWidth: 1024,
  maxHeight: 1024,
  convertToJpeg: true
};

/**
 * Processes multipart form data and extracts image files with optional conversion and resizing
 * @param request - The incoming request object
 * @param imageFieldName - The name of the form field containing the image (e.g., 'avatar', 'profile_pic')
 * @param options - Processing options for the image
 * @param context - Optional context object for logging
 * @returns Promise<ImageProcessingResult>
 */
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

    // Extract boundary
    const boundary = contentType.split("boundary=")[1];
    if (!boundary) {
      return {
        success: false,
        error: "Invalid multipart boundary"
      };
    }

    // Parse multipart data
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

/**
 * Processes a single image buffer with conversion and resizing
 * @param part - Multipart data part containing the image
 * @param options - Processing options
 * @param context - Optional context for logging
 * @returns Promise<ImageProcessingResult>
 */
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

/**
 * Processes HEIC images by converting them to JPEG
 */
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

    // Further process with Sharp
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

/**
 * Processes regular images (JPEG, PNG, WebP) with resizing
 */
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

/**
 * Simple wrapper for processing just JSON data (no images)
 * @param request - The incoming request
 * @returns Promise<any> - Parsed JSON data
 */
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

export const isValidAppwriteImageUrl = (url: string, userId: string): boolean => {
    try {
        // This'll check if URL contains the expected pattern for the Appwrite instance
        const urlPattern = /\/storage\/buckets\/[^\/]+\/files\/[^\/]+\/(preview|view)/;
        const isValidPattern = urlPattern.test(url);
        
        return isValidPattern;
    } catch (error) {
        console.error('Error validating image URL:', error);
        return false;
    }
}