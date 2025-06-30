import { Client, Storage, Models } from "node-appwrite";
import { IAppwriteConfig, IUploadResult } from "./types";

export interface ProductImageUploadResult extends IUploadResult {
  imageIndex?: number;
}

export interface ProductImagesUploadResult {
  success: boolean;
  uploadedImages: ProductImageUploadResult[];
  failedImages: ProductImageUploadResult[];
  totalUploaded: number;
  totalFailed: number;
  error?: string;
}

export interface ProductImageFile {
  fileBuffer: Buffer;
  fileName: string;
  mimeType: string;
}

export interface ProductImagesConfig {
  productId: string;
  bucketId: string;
  maxImagesPerProduct?: number;
  replaceExisting?: boolean;
}

class AppwriteProductImagesService {
  private client: Client;
  private storage: Storage;
  private config: IAppwriteConfig;

  constructor(config: IAppwriteConfig) {
    this.config = config;
    this.client = new Client();
    this.client.setEndpoint(config.endpoint).setProject(config.projectId).setKey(config.apiKey);
    this.storage = new Storage(this.client);
  }

  private generateProductImageFileId(productId: string, imageIndex: number): string {
    let hash: number = 0;
    for (let i = 0; i < productId.length; i++) {
      const char = productId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash &= hash;
    }

    const hashStr: string = Math.abs(hash).toString(36);
    const timestamp: string = Date.now().toString(36).slice(-6);
    const fileId: string = `product_${hashStr}_${imageIndex}_${timestamp}`;

    // Appwrite's file length limit is 36 chars
    return fileId.length <= 36 ? fileId : `product_${hashStr}_${imageIndex}`.slice(0, 36);
  }

  private async getExistingProductImages(productId: string, bucketId: string): Promise<Models.File[]> {
    try {
      const files: Models.FileList = await this.storage.listFiles(bucketId);
      
      let hash: number = 0;
      for (let i = 0; i < productId.length; i++) {
        const char = productId.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash &= hash;
      }
      const hashStr: string = Math.abs(hash).toString(36);
      
      const productFiles: Models.File[] = files.files.filter((file) => {
        const expectedPrefix = `product_${hashStr}`;
        return file.$id.includes(expectedPrefix) || 
               file.name?.includes(`product_${productId}`) ||
               file.name?.includes(productId);
      });

      return productFiles;
    } catch (error) {
      console.error(`Error finding existing product images:`, error);
      return [];
    }
  }

  private async deleteExistingProductImages(productId: string, bucketId: string): Promise<void> {
    try {
      const existingImages = await this.getExistingProductImages(productId, bucketId);
      
      for (const image of existingImages) {
        try {
          await this.storage.deleteFile(bucketId, image.$id);
          console.log(`Deleted existing product image: ${image.$id}`);
        } catch (error) {
          console.warn(`Could not delete existing product image ${image.$id}:`, error);
        }
      }
    } catch (error) {
      console.error(`Error deleting existing product images:`, error);
    }
  }

  private validateImageFile(fileBuffer: Buffer, fileName: string, mimeType: string): { valid: boolean; error?: string } {
    const allowedTypes: string[] = [
      "image/jpeg",
      "image/jpg", 
      "image/png",
      "image/webp",
      "image/svg+xml",
    ];
    
    if (!allowedTypes.includes(mimeType)) {
      return {
        valid: false,
        error: `Invalid file type for ${fileName}. Please upload a valid image file (JPEG, PNG, WEBP, or SVG). Provided mime type: ${mimeType}`,
      };
    }

    const maxSize: number = 20 * 1024 * 1024; // 20MB max file size
    if (fileBuffer.length > maxSize) {
      return {
        valid: false,
        error: `File ${fileName} is too large. Please upload an image smaller than 20MB.`,
      };
    }

    return { valid: true };
  }

  private normalizeFileName(fileName: string, mimeType: string): string {
    let normalizedFileName: string = fileName;
    
    if (fileName.toLowerCase().endsWith('.jpeg')) {
      normalizedFileName = fileName.replace(/\.jpeg$/i, '.jpg');
    }
    
    if (!normalizedFileName.includes('.')) {
      const extension: '.jpg' | '.png' | '.webp' | '.svg' = 
        mimeType === 'image/jpeg' ? '.jpg' : 
        mimeType === 'image/png' ? '.png' :
        mimeType === 'image/webp' ? '.webp' :
        mimeType === 'image/svg+xml' ? '.svg' : '.jpg';

      normalizedFileName = `${normalizedFileName}${extension}`;
    }

    return normalizedFileName;
  }

  public async uploadProductImages(
    imageFiles: ProductImageFile[], 
    config: ProductImagesConfig
  ): Promise<ProductImagesUploadResult> {
    const { productId, bucketId, maxImagesPerProduct = 10, replaceExisting = false } = config;

    if (!productId || !productId.trim()) {
      return {
        success: false,
        uploadedImages: [],
        failedImages: [],
        totalUploaded: 0,
        totalFailed: 0,
        error: "Product ID is required for image upload",
      };
    }

    if (!imageFiles || imageFiles.length === 0) {
      return {
        success: false,
        uploadedImages: [],
        failedImages: [],
        totalUploaded: 0,
        totalFailed: 0,
        error: "No image files provided",
      };
    }

    if (imageFiles.length > maxImagesPerProduct) {
      return {
        success: false,
        uploadedImages: [],
        failedImages: [],
        totalUploaded: 0,
        totalFailed: 0,
        error: `Too many images. Maximum allowed: ${maxImagesPerProduct}, provided: ${imageFiles.length}`,
      };
    }

    // Delete existing images if replaceExisting is true
    if (replaceExisting) {
      await this.deleteExistingProductImages(productId, bucketId);
    }

    const uploadedImages: ProductImageUploadResult[] = [];
    const failedImages: ProductImageUploadResult[] = [];

    for (let i = 0; i < imageFiles.length; i++) {
      const { fileBuffer, fileName, mimeType } = imageFiles[i];

      try {

        const validation = this.validateImageFile(fileBuffer, fileName, mimeType);
        if (!validation.valid) {
          failedImages.push({
            success: false,
            error: validation.error,
            imageIndex: i,
          });
          continue;
        }

        const normalizedFileName = this.normalizeFileName(fileName, mimeType);
        const fileId = this.generateProductImageFileId(productId, i);

        let uploadedFile;
        
        try {
          uploadedFile = await this.storage.createFile(
            bucketId,
            fileId,
            new File([fileBuffer], normalizedFileName, { type: mimeType }),
          );
        } catch (error: any) {
          if (error.message?.includes('InputFile') || error.message?.includes('file parameter')) {
            try {
              const fileObject = new File([fileBuffer], normalizedFileName, { type: mimeType });
              uploadedFile = await this.storage.createFile(bucketId, fileId, fileObject);
            } catch (blobError) {
              const fileData = {
                name: normalizedFileName,
                type: mimeType,
                size: fileBuffer.length,
                buffer: fileBuffer
              };
              
              uploadedFile = await this.storage.createFile(bucketId, fileId, fileData as any);
            }
          } else {
            throw error;
          }
        }

        const imageUrl = this.getProductImageUrl(bucketId, uploadedFile.$id);

        uploadedImages.push({
          success: true,
          fileId: uploadedFile.$id,
          imageUrl,
          imageIndex: i,
        });

      } catch (error: any) {
        console.error(`Error uploading product image ${i}:`, error);

        let errorMessage = `Failed to upload image ${fileName}`;

        if (error.message?.includes("fileId")) {
          errorMessage = `Invalid file identifier for ${fileName}. Please try again.`;
        } else if (error.message?.includes("size")) {
          errorMessage = `File ${fileName} is too large. Please choose a smaller image.`;
        } else if (error.message?.includes("type") || error.message?.includes("extension")) {
          errorMessage = `Invalid file type for ${fileName}. Please upload a valid image.`;
        } else if (error.message?.includes("transformations_blocked")) {
          errorMessage = `Image processing failed for ${fileName}. Please try uploading a smaller image.`;
        } else if (error.message) {
          errorMessage = error.message;
        }

        failedImages.push({
          success: false,
          error: errorMessage,
          imageIndex: i,
        });
      }
    }

    const totalUploaded = uploadedImages.length;
    const totalFailed = failedImages.length;
    const success = totalUploaded > 0;

    return {
      success,
      uploadedImages,
      failedImages,
      totalUploaded,
      totalFailed,
      error: !success ? "All image uploads failed" : undefined,
    };
  }

  public getProductImageUrl(bucketId: string, fileId: string, width?: number, height?: number, quality: number = 80): string {
    try {
      if (!width && !height) {
        return `${this.config.endpoint}/storage/buckets/${bucketId}/files/${fileId}/view?project=${this.config.projectId}`;
      }

      try {
        return `${this.config.endpoint}/storage/buckets/${bucketId}/files/${fileId}/preview?project=${this.config.projectId}&width=${width}&height=${height}&gravity=center&quality=${quality}`;
      } catch (transformError) {
        console.warn("Image transformations not available, falling back to direct view:", transformError);
        return `${this.config.endpoint}/storage/buckets/${bucketId}/files/${fileId}/view?project=${this.config.projectId}`;
      }
    } catch (error) {
      console.error("Error generating product image URL:", error);
      return "";
    }
  }

  public async getProductImageUrls(productId: string, bucketId: string): Promise<string[]> {
    try {
      const existingImages = await this.getExistingProductImages(productId, bucketId);
      return existingImages.map(image => this.getProductImageUrl(bucketId, image.$id));
    } catch (error) {
      console.error("Error getting product image URLs:", error);
      return [];
    }
  }

  public async deleteProductImages(productId: string, bucketId: string): Promise<{ success: boolean; deletedCount: number; error?: string }> {
    try {
      if (!productId || !productId.trim()) {
        return {
          success: false,
          deletedCount: 0,
          error: "Product ID is required",
        };
      }

      const existingImages = await this.getExistingProductImages(productId, bucketId);

      if (existingImages.length === 0) {
        return {
          success: false,
          deletedCount: 0,
          error: "No images found for this product",
        };
      }

      let deletedCount = 0;
      const errors: string[] = [];

      for (const image of existingImages) {
        try {
          await this.storage.deleteFile(bucketId, image.$id);
          deletedCount++;
        } catch (error: any) {
          errors.push(`Failed to delete image ${image.$id}: ${error.message}`);
        }
      }

      return {
        success: deletedCount > 0,
        deletedCount,
        error: errors.length > 0 ? errors.join("; ") : undefined,
      };

    } catch (error: any) {
      console.error("Error deleting product images:", error);
      return {
        success: false,
        deletedCount: 0,
        error: error.message || "Failed to delete product images",
      };
    }
  }

  public async hasProductImages(productId: string, bucketId: string): Promise<boolean> {
    try {
      const existingImages = await this.getExistingProductImages(productId, bucketId);
      return existingImages.length > 0;
    } catch {
      return false;
    }
  }
}

const appwriteConfig: IAppwriteConfig = {
  endpoint: process.env.APPWRITE_ENDPOINT || "" as string,
  projectId: process.env.APPWRITE_PROJECT_ID || "" as string,
  apiKey: process.env.APPWRITE_API_KEY || "" as string,
  userAvatarBucketId: process.env.APPWRITE_USER_AVATAR_BUCKET_ID || "" as string,
  productImagesBucketId: process.env.APPWRITE_PRODUCTS_BUCKET_ID || "" as string,
};

const productImagesService = new AppwriteProductImagesService(appwriteConfig);

class ProductImages {
  static async uploadProductImages(
    imageFiles: ProductImageFile[], 
    productId: string, 
    bucketId?: string,
    maxImagesPerProduct?: number,
    replaceExisting?: boolean
  ): Promise<ProductImagesUploadResult> {
    return productImagesService.uploadProductImages(imageFiles, {
      productId,
      bucketId: bucketId || (appwriteConfig.productImagesBucketId ?? ""),
      maxImagesPerProduct,
      replaceExisting,
    });
  }

  static async getProductImageUrls(productId: string, bucketId?: string): Promise<string[]> {
    return productImagesService.getProductImageUrls(
      productId, 
      bucketId || (appwriteConfig.productImagesBucketId ?? "")
    );
  }

  static async deleteProductImages(productId: string, bucketId?: string): Promise<{ success: boolean; deletedCount: number; error?: string }> {
    return productImagesService.deleteProductImages(
      productId, 
      bucketId || (appwriteConfig.productImagesBucketId ?? "")
    );
  }

  static async hasProductImages(productId: string, bucketId?: string): Promise<boolean> {
    return productImagesService.hasProductImages(
      productId, 
      bucketId || (appwriteConfig.productImagesBucketId ?? "")
    );
  }

  static getProductImageUrl(bucketId: string, fileId: string, width?: number, height?: number, quality?: number): string {
    return productImagesService.getProductImageUrl(bucketId, fileId, width, height, quality);
  }
}

export { ProductImages, AppwriteProductImagesService as ProductImagesService };
