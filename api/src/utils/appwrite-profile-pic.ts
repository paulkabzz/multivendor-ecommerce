import { Client, Storage, Models } from "node-appwrite";
import { IAppwriteConfig, IUploadResult } from "./types";


export interface ProfileImageUploadResult extends IUploadResult {
  oldImageDeleted?: boolean;
}

class AppwriteProfilePic {
  private client: Client;
  private storage: Storage;
  private config: IAppwriteConfig;

  constructor(config: IAppwriteConfig) {
    this.config = config;
    this.client = new Client();
    this.client.setEndpoint(config.endpoint).setProject(config.projectId).setKey(config.apiKey);
    this.storage = new Storage(this.client);
  }

  private generateProfileFileId(userId: string): string {
    let hash: number = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash &= hash;
    }

    const hashStr: string = Math.abs(hash).toString(36);
    const timestamp: string = Date.now().toString(36).slice(-6);
    const fileId: string = `prof_${hashStr}_${timestamp}`;

    return fileId.length <= 36 ? fileId : `prof_${hashStr}`.slice(0, 36);
  }

  private async getExistingProfileFileId(userId: string): Promise<string | null> {
    try {
      const files: Models.FileList = await this.storage.listFiles(this.config.userProfilePicBucketId);
      
      const userFiles: Models.File[] = files.files.filter(
        (file) =>
          file.name?.includes(`user_${userId}`) || 
          file.$id.startsWith("prof_") ||
          file.name?.includes(userId)
      );

      return userFiles.length > 0 ? userFiles[0].$id : null;
    } catch (error) {
      console.error("Error finding existing profile image:", error);
      return null;
    }
  }

  public async uploadProfileImage(fileBuffer: Buffer,  fileName: string,  mimeType: string,  userId: string): Promise<ProfileImageUploadResult> {
    try {
      if (!userId || !userId.trim()) {
        return {
          success: false,
          error: "User ID is required for profile image upload",
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
          error: "Invalid file type. Please upload a valid image file (JPEG, PNG, WEBP, or SVG).",
        };
      }

      // convert jpeg to jpg
      let normalizedFileName: string = fileName;
      if (fileName.toLowerCase().endsWith('.jpeg')) {
        normalizedFileName = fileName.replace(/\.jpeg$/i, '.jpg');
      }
      
      if (!normalizedFileName.includes('.')) {
        const extension: '.jpg' | '.png' | '.webp' | '.svg' = mimeType === 'image/jpeg' ? '.jpg' : 
                                                              mimeType === 'image/png' ? '.png' :
                                                              mimeType === 'image/webp' ? '.webp' :
                                                              mimeType === 'image/svg+xml' ? '.svg' : '.jpg';

        normalizedFileName = `${normalizedFileName}${extension}`;
      }

      const maxSize: number = 5 * 1024 * 1024;
      if (fileBuffer.length > maxSize) {
        return {
          success: false,
          error: "File size too large. Please upload an image smaller than 5MB.",
        };
      }

      let oldImageDeleted: boolean = false;
      const existingFileId: string | null = await this.getExistingProfileFileId(userId);

      if (existingFileId) {
        try {
          await this.storage.deleteFile(
            this.config.userProfilePicBucketId,
            existingFileId
          );
          oldImageDeleted = true;
          console.log(`Deleted existing profile image for user: ${userId}`);

        } catch (error: unknown) {
          console.warn("Could not delete existing profile image:", error);
        }
      }

      const fileId: string = this.generateProfileFileId(userId);
      
      let uploadedFile;
      
      try {
        uploadedFile = await this.storage.createFile(
          this.config.userProfilePicBucketId,
          fileId,
          new File([fileBuffer], normalizedFileName, { type: mimeType }),
        );
      } catch (error: any) {

        if (error.message?.includes('InputFile') || error.message?.includes('file parameter')) {
          try {

            const fileObject: File = new File([fileBuffer], normalizedFileName, { type: mimeType });

            uploadedFile = await this.storage.createFile(
              this.config.userProfilePicBucketId,
              fileId,
              fileObject
            );

          } catch (blobError: unknown) {

            const fileData = {
              name: normalizedFileName,
              type: mimeType,
              size: fileBuffer.length,
              buffer: fileBuffer
            };
            
            uploadedFile = await this.storage.createFile(
              this.config.userProfilePicBucketId,
              fileId,
              fileData as any
            );

          }
        } else {
          throw error;
        }
      }

      const imageUrl: string = this.getImageUrl(uploadedFile.$id);

      return {
        success: true,
        fileId: uploadedFile.$id,
        imageUrl,
        oldImageDeleted,
      };

    } catch (error: any) {
      console.error("Error uploading profile image:", error);

      let errorMessage: string = "Failed to upload profile image";

      if (error.message?.includes("fileId")) {
        errorMessage = "Invalid file identifier. Please try again.";
      } else if (error.message?.includes("size")) {
        errorMessage = "File size too large. Please choose a smaller image.";
      } else if (error.message?.includes("type") || error.message?.includes("extension")) {
        errorMessage = "Invalid file type or extension. Please upload a valid image with .jpg, .png, .webp, or .svg extension.";
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

  public async getProfileImageUrl(userId: string): Promise<string> {
    try {
      const fileId: string | null = await this.getExistingProfileFileId(userId);
      
      if (!fileId) {
        return "";
      }

      return this.getImageUrl(fileId);
    } catch (error: unknown) {
      console.error("Error generating profile image URL:", error);
      return "";
    }
  }

  public getImageUrl(fileId: string, width?: number, height?: number, quality: number = 80): string {
    try {

      if (!width && !height) {

        const baseUrl: string = `${this.config.endpoint}/storage/buckets/${this.config.userProfilePicBucketId}/files/${fileId}/view?project=${this.config.projectId}`;
        return baseUrl;
      }

      try {

        const previewUrl: string = `${this.config.endpoint}/storage/buckets/${this.config.userProfilePicBucketId}/files/${fileId}/preview?project=${this.config.projectId}&width=${width}&height=${height}&gravity=center&quality=${quality}`;
        return previewUrl;

      } catch (transformError) {

        console.warn("Image transformations not available, falling back to direct view:", transformError);
        const baseUrl: string = `${this.config.endpoint}/storage/buckets/${this.config.userProfilePicBucketId}/files/${fileId}/view?project=${this.config.projectId}`;
        return baseUrl;

      }
    } catch (error: unknown) {

      console.error("Error generating image URL:", error);
      return "";

    }
  }

  public async deleteProfileImage(userId: string): Promise<{ success: boolean; error?: string }> {

    try {
      if (!userId || !userId.trim()) {
        return {
          success: false,
          error: "User ID is required",
        };
      }

      const fileId: string | null = await this.getExistingProfileFileId(userId);

      if (!fileId) {
        return {
          success: false,
          error: "No profile image found for this user",
        };
      }

      await this.storage.deleteFile(this.config.userProfilePicBucketId, fileId);
      return { success: true };

    } catch (error: any) {

      console.error("Error deleting profile image:", error);
      return {
        success: false,
        error: error.message || "Failed to delete profile image",
      };

    }

  }

  public async hasProfileImage(userId: string): Promise<boolean> {
    try {
      const fileId: string | null = await this.getExistingProfileFileId(userId);
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
  userProfilePicBucketId: process.env.APPWRITE_USER_PROFILE_PIC_BUCKET_ID || "" as string,
};

export const backendImageService: AppwriteProfilePic = new AppwriteProfilePic(appwriteConfig);