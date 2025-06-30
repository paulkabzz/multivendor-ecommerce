import { Client, Storage, Models } from "node-appwrite";
import { IAppwriteConfig, IUploadResult } from "./types";

export type AvatarEntityType = 'user' | 'vendor' | 'product' | string;

export interface AvatarUploadResult extends IUploadResult {
  oldAvatarDeleted?: boolean;
}

export interface AvatarConfig {
  entityType: AvatarEntityType;
  entityId: string;
  bucketId: string;
}

class AppwriteAvatarService {
  private client: Client;
  private storage: Storage;
  private config: IAppwriteConfig;

  constructor(config: IAppwriteConfig) {
    this.config = config;
    this.client = new Client();
    this.client.setEndpoint(config.endpoint).setProject(config.projectId).setKey(config.apiKey);
    this.storage = new Storage(this.client);
  }

  private generateAvatarFileId(entityType: AvatarEntityType, entityId: string): string {
    let hash: number = 0;
    for (let i = 0; i < entityId.length; i++) {
      const char = entityId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash &= hash;
    }

    const hashStr: string = Math.abs(hash).toString(36);
    const timestamp: string = Date.now().toString(36).slice(-6);
    const fileId: string = `${entityType}_${hashStr}_${timestamp}`;

    // appwrite's file length limit is 36 chars
    return fileId.length <= 36 ? fileId : `${entityType}_${hashStr}`.slice(0, 36);
  }

  private async getExistingAvatarFileId(entityType: AvatarEntityType, entityId: string, bucketId: string): Promise<string | null> {
    try {
      const files: Models.FileList = await this.storage.listFiles(bucketId);
      
      let hash: number = 0;
      for (let i = 0; i < entityId.length; i++) {
        const char = entityId.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash &= hash;
      }
      const hashStr: string = Math.abs(hash).toString(36);
      
      const entityFiles: Models.File[] = files.files.filter((file) => {
          const expectedPrefix = `${entityType}_${hashStr}`;
          return file.$id.includes(expectedPrefix) || 
                 file.name?.includes(`${entityType}_${entityId}`) ||
                 file.name?.includes(entityId);
        }
      );

      return entityFiles.length > 0 ? entityFiles[0].$id : null;
    } catch (error) {
      console.error(`Error finding existing ${entityType} avatar:`, error);
      return null;
    }
  }

  public async uploadAvatar(fileBuffer: Buffer,fileName: string,mimeType: string,avatarConfig: AvatarConfig): Promise<AvatarUploadResult> {
    try {
      const { entityType, entityId, bucketId } = avatarConfig;

      if (!entityId || !entityId.trim()) {
        return {
          success: false,
          error: `${entityType} ID is required for avatar upload`,
        };
      }

      const allowedTypes: string[] = [
        "image/jpeg",
        "image/jpg", 
        "image/png",
        "image/webp",
        "image/svg+xml",
      ];
      
      if (!allowedTypes.includes(mimeType)) {
        return {
          success: false,
          error: "Invalid file type. Please upload a valid image file (JPEG, PNG, WEBP, or SVG). Provided mime type: " + mimeType,
        };
      }

      let normalizedFileName: string = fileName;
      if (fileName.toLowerCase().endsWith('.jpeg')) {
        normalizedFileName = fileName.replace(/\.jpeg$/i, '.jpg');
      }
      
      if (!normalizedFileName.includes('.')) {
        const extension: '.jpg' | '.png' | '.webp' | '.svg'  = 
          mimeType === 'image/jpeg' ? '.jpg' : 
          mimeType === 'image/png' ? '.png' :
          mimeType === 'image/webp' ? '.webp' :
          mimeType === 'image/svg+xml' ? '.svg' : '.jpg';

        normalizedFileName = `${normalizedFileName}${extension}`;
      }

      const maxSize: number = 20 * 1024 * 1024; // max file size will be 20mb (a bit generous, but modern images are big)
      if (fileBuffer.length > maxSize) {
        return {
          success: false,
          error: "File size too large. Please upload an image smaller than 5MB.",
        };
      }

      let oldAvatarDeleted: boolean = false;
      const existingFileId: string | null = await this.getExistingAvatarFileId(
        entityType, 
        entityId, 
        bucketId
      );

      if (existingFileId) {
        try {
          await this.storage.deleteFile(bucketId, existingFileId);
          oldAvatarDeleted = true;
          console.log(`Deleted existing ${entityType} avatar for ID: ${entityId}`);
        } catch (error: unknown) {
          console.warn(`Could not delete existing ${entityType} avatar:`, error);
        }
      }

      const fileId: string = this.generateAvatarFileId(entityType, entityId);
      
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
            const fileObject: File = new File([fileBuffer], normalizedFileName, { type: mimeType });
            uploadedFile = await this.storage.createFile(bucketId, fileId, fileObject);
          } catch (blobError: unknown) {
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

      const imageUrl: string = this.getAvatarUrl(bucketId, uploadedFile.$id);

      return {
        success: true,
        fileId: uploadedFile.$id,
        imageUrl,
        oldAvatarDeleted,
      };

    } catch (error: any) {
      console.error(`Error uploading ${avatarConfig.entityType} avatar:`, error);

      let errorMessage: string = `Failed to upload ${avatarConfig.entityType} avatar`;

      if (error.message?.includes("fileId")) {
        errorMessage = "Invalid file identifier. Please try again.";
      } else if (error.message?.includes("size")) {
        errorMessage = "File size too large. Please choose a smaller image.";
      } else if (error.message?.includes("type") || error.message?.includes("extension")) {
        errorMessage = "Invalid file type or extension. Please upload a valid image with .jpg, .png, '.heic, .webp, or .svg extension.";
      } else if (error.message?.includes("transformations_blocked")) {
        errorMessage = "Image processing failed. Please try upgrading your Appwrite plan or uploading a smaller image.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  public async getAvatarUrlForEntity(entityType: AvatarEntityType, entityId: string, bucketId: string): Promise<string> {
    try {
      const fileId: string | null = await this.getExistingAvatarFileId(entityType, entityId, bucketId);
      
      if (!fileId) {
        return "";
      }

      return this.getAvatarUrl(bucketId, fileId);
    } catch (error: unknown) {
      console.error(`Error generating ${entityType} avatar URL:`, error);
      return "";
    }
  }

  public getAvatarUrl(bucketId: string, fileId: string, width?: number, height?: number, quality: number = 80): string {
    try {
      if (!width && !height) {
        const baseUrl: string = `${this.config.endpoint}/storage/buckets/${bucketId}/files/${fileId}/view?project=${this.config.projectId}`;
        return baseUrl;
      }

      try {
        const previewUrl: string = `${this.config.endpoint}/storage/buckets/${bucketId}/files/${fileId}/preview?project=${this.config.projectId}&width=${width}&height=${height}&gravity=center&quality=${quality}`;
        return previewUrl;
      } catch (transformError) {
        console.warn("Image transformations not available, falling back to direct view:", transformError);
        const baseUrl: string = `${this.config.endpoint}/storage/buckets/${bucketId}/files/${fileId}/view?project=${this.config.projectId}`;
        return baseUrl;
      }
    } catch (error: unknown) {
      console.error("Error generating image URL:", error);
      return "";
    }
  }

  public async deleteAvatar(avatarConfig: AvatarConfig): Promise<{ success: boolean; error?: string }> {
    try {
      const { entityType, entityId, bucketId } = avatarConfig;

      if (!entityId || !entityId.trim()) {
        return {
          success: false,
          error: `${entityType} ID is required`,
        };
      }

      const fileId: string | null = await this.getExistingAvatarFileId(entityType, entityId, bucketId);

      if (!fileId) {
        return {
          success: false,
          error: `No avatar found for this ${entityType}`,
        };
      }

      await this.storage.deleteFile(bucketId, fileId);
      return { success: true };

    } catch (error: any) {
      console.error(`Error deleting ${avatarConfig.entityType} avatar:`, error);
      return {
        success: false,
        error: error.message || `Failed to delete ${avatarConfig.entityType} avatar`,
      };
    }
  }

  public async hasAvatar(entityType: AvatarEntityType, entityId: string, bucketId: string): Promise<boolean> {
    try {
      const fileId: string | null = await this.getExistingAvatarFileId(entityType, entityId, bucketId);
      return !!fileId;
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
};

const avatarService: AppwriteAvatarService = new AppwriteAvatarService(appwriteConfig);

class Avatar {
  static async uploadUserAvatar(fileBuffer: Buffer, fileName: string, mimeType: string, userId: string): Promise<AvatarUploadResult> {
    return avatarService.uploadAvatar(fileBuffer, fileName, mimeType, {
      entityType: 'user',
      entityId: userId,
      bucketId: appwriteConfig.userAvatarBucketId,
    });
  }

  static async uploadVendorAvatar(fileBuffer: Buffer, fileName: string, mimeType: string, vendorId: string, vendorBucketId: string): Promise<AvatarUploadResult> {
    return avatarService.uploadAvatar(fileBuffer, fileName, mimeType, {
      entityType: 'vendor',
      entityId: vendorId,
      bucketId: vendorBucketId,
    });
  }

  static async uploadDepartmentCover(fileBuffer: Buffer, fileName: string, mimeType: string, departmentId: string, departmentBucketId: string): Promise<AvatarUploadResult> {
    return avatarService.uploadAvatar(fileBuffer, fileName, mimeType, {
      entityType: 'department',
      entityId: departmentId,
      bucketId: departmentBucketId
    });
  }

  static async getUserAvatarUrl(userId: string): Promise<string> {
    return avatarService.getAvatarUrlForEntity('user', userId, appwriteConfig.userAvatarBucketId);
  }

  static async getVendorAvatarUrl(vendorId: string, vendorBucketId: string): Promise<string> {
    return avatarService.getAvatarUrlForEntity('vendor', vendorId, vendorBucketId);
  }

  static async getDepartmentCover(departmentId: string, departmentBucketId: string): Promise<string> {
    return avatarService.getAvatarUrlForEntity('department', departmentId, departmentBucketId);
  }

  static async deleteUserAvatar(userId: string): Promise<{ success: boolean; error?: string }> {
    return avatarService.deleteAvatar({
      entityType: 'user',
      entityId: userId,
      bucketId: appwriteConfig.userAvatarBucketId,
    });
  }

  static async deleteVendorAvatar(vendorId: string, vendorBucketId: string): Promise<{ success: boolean; error?: string }> {
    return avatarService.deleteAvatar({
      entityType: 'vendor',
      entityId: vendorId,
      bucketId: vendorBucketId,
    });
  }

  static async deleteDepartmentCover(departmentId: string, departmentBucketId: string): Promise<{success: boolean; error?: string}> {
    return avatarService.deleteAvatar({
      entityType: 'department',
      entityId: departmentId,
      bucketId: departmentBucketId
    })
  }
}

export { Avatar };