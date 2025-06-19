import { ID, ImageGravity } from "appwrite";
import { storage, appwriteConfig } from "./config";

export interface UploadResult {
  success: boolean;
  fileId?: string;
  imageUrl?: string;
  error?: string;
}

class AppwriteImageService {
  /**
   * Upload an image file to Appwrite storage
   * @param file - The image file to upload
   * @param user_id - Optional param for now so we can save the image using the user's ID
   * @param fileName - Optional custom filename (will generate unique ID if not provided)
   * @returns Promise with upload result
   */
  async uploadImage(file: File, user_id?: string, fileName?: string): Promise<UploadResult> {
    try {
      // Validate file type
      const allowedTypes: string[] = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        return {
          success: false,
          error: 'Invalid file type. Please upload a valid image file.'
        };
      }

      // Validate file size (max 5MB)
      const maxSize: number = 5 * 1024 * 1024; 
      if (file.size > maxSize) {
        return {
          success: false,
          error: 'File size too large. Please upload an image smaller than 5MB.'
        };
      }

      // Generate unique file ID if no filename or user_id provided
      const fileId: string = user_id || user_id + ":" + fileName || ID.unique();

      // Upload file to Appwrite storage
      const uploadedFile = await storage.createFile(
        appwriteConfig.userProfilePicBucketId,
        fileId,
        file
      );

      // Generate the image URL for preview/display
      const imageUrl: string = this.getImageUrl(uploadedFile.$id);

      return {
        success: true,
        fileId: uploadedFile.$id,
        imageUrl
      };

    } catch (error: any) {
      console.error('Error uploading image:', error);
      return {
        success: false,
        error: error.message || 'Failed to upload image'
      };
    }
  }

  /**
   * Get the URL for an uploaded image
   * @param fileId - The file ID from Appwrite
   * @param width - Optional width for image transformation
   * @param height - Optional height for image transformation
   * @param quality - Optional quality (1-100)
   * @returns Image URL string
   */
  getImageUrl(fileId: string, width?: number, height?: number, quality: number = 80): string {
    try {
      const imageUrl: string = storage.getFilePreview(
        appwriteConfig.userProfilePicBucketId,
        fileId,
        width,
        height,
        ImageGravity.Center,
        quality
      );
      
      return imageUrl.toString();
    } catch (error: unknown) {
      console.error('Error generating image URL:', error);
      return '';
    }
  }

  /**
   * Delete an image from Appwrite storage
   * @param fileId - The file ID to delete
   * @returns Promise with deletion result
   */
  async deleteImage(fileId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await storage.deleteFile(appwriteConfig.userProfilePicBucketId, fileId);
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting image:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete image'
      };
    }
  }

  /**
   * Replace an existing profile image with a new one
   * @param newFile - The new image file
   * @param oldFileId - The old file ID to delete (optional)
   * @returns Promise with upload result
   */
  async replaceProfileImage(newFile: File, oldFileId?: string): Promise<UploadResult> {
    try {
      // Upload new image first
      const uploadResult: UploadResult = await this.uploadImage(newFile);
      
      if (!uploadResult.success) {
        return uploadResult;
      }

      // If upload was successful and we have an old file, delete it
      if (oldFileId) {
        // Don't await this - we don't want to fail if old image deletion fails
        this.deleteImage(oldFileId).catch(error => 
          console.warn('Failed to delete old profile image:', error)
        );
      }

      return uploadResult;
    } catch (error: any) {
      console.error('Error replacing profile image:', error);
      return {
        success: false,
        error: error.message || 'Failed to replace profile image'
      };
    }
  }

  /**
   * Extract file ID from an Appwrite image URL
   * @param imageUrl - Full image URL from Appwrite
   * @returns File ID or null if not found
   */
  extractFileIdFromUrl(imageUrl: string): string | null {
    try {
      // Appwrite URLs typically have this format:
      // https://cloud.appwrite.io/v1/storage/buckets/[bucket-id]/files/[file-id]/preview
      const urlParts: string[] = imageUrl.split('/');
      const previewIndex: number = urlParts.findIndex(part => part === 'preview');
      
      if (previewIndex > 0) {
        return urlParts[previewIndex - 1];
      }
      
      return null;
    } catch (error: unknown) {
      console.error('Error extracting file ID from URL:', error);
      return null;
    }
  }
}

export const imageService = new AppwriteImageService();