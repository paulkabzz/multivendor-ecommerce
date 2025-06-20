import { ImageGravity } from "appwrite";
import { storage, appwriteConfig } from "./config";

export interface UploadResult {
  success: boolean;
  fileId?: string;
  imageUrl?: string;
  error?: string;
}

export interface ProfileImageUploadResult extends UploadResult {
  oldImageDeleted?: boolean;
}

class AppwriteImageService {

  private generateProfileFileId(userId: string): string {
    let hash: number = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }

    const hashStr: string = Math.abs(hash).toString(36);

    const timestamp: string = Date.now().toString(36).slice(-6);
    const fileId: string = `prof_${hashStr}_${timestamp}`;

    return fileId.length <= 36 ? fileId : `prof_${hashStr}`.slice(0, 36);
  }

  private async getExistingProfileFileId(
    userId: string,
  ): Promise<string | null> {
    try {
      const files = await storage.listFiles(
        appwriteConfig.userProfilePicBucketId,
      );

      
      const userFiles = files.files.filter(
        (file) =>
          file.name?.includes(`user_${userId}`) || file.$id.startsWith("prof_"),
      );

      return userFiles.length > 0 ? userFiles[0].$id : null;
    } catch (error) {
      console.error("Error finding existing profile image:", error);
      return null;
    }
  }

  /**
   * Upload a profile image for a specific user with authorization
   * @param file - The image file to upload
   * @param userId - The user ID (required for profile images)
   * @param _authToken - JWT token for authorization (for future use)
   * @returns Promise with upload result
   */
  public async uploadProfileImage(
    file: File,
    userId: string,
    _authToken?: string,
  ): Promise<ProfileImageUploadResult> {
    try {
      // Validate inputs
      if (!userId || !userId.trim()) {
        return {
          success: false,
          error: "User ID is required for profile image upload",
        };
      }

      // Validate file type
      const allowedTypes: string[] = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/svg+xml",
      ];
      if (!allowedTypes.includes(file.type)) {
        return {
          success: false,
          error:
            "Invalid file type. Please upload a valid image file (JPEG, PNG, WEBP, or SVG).",
        };
      }

      // Validate file size (max 5MB)
      const maxSize: number = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        return {
          success: false,
          error:
            "File size too large. Please upload an image smaller than 5MB.",
        };
      }

      // Check for existing profile image and delete it
      let oldImageDeleted = false;
      const existingFileId = await this.getExistingProfileFileId(userId);

      if (existingFileId) {
        try {
          await storage.deleteFile(
            appwriteConfig.userProfilePicBucketId,
            existingFileId,
          );
          oldImageDeleted = true;
          console.log(`Deleted existing profile image for user: ${userId}`);
        } catch (error: any) {
          console.warn("Could not delete existing profile image:", error);
        }
      }

      // Generate a valid fileId
      const fileId = this.generateProfileFileId(userId);

      // Create file with metadata to associate it with the user
      const uploadedFile = await storage.createFile(
        appwriteConfig.userProfilePicBucketId,
        fileId,
        file,
      );

      // Generate the image URL for preview/display - NO TRANSFORMATIONS
      const imageUrl: string = this.getImageUrl(uploadedFile.$id);

      return {
        success: true,
        fileId: uploadedFile.$id,
        imageUrl,
        oldImageDeleted,
      };
    } catch (error: any) {
      console.error("Error uploading profile image:", error);

      // Provide more specific error messages
      let errorMessage = "Failed to upload profile image";

      if (error.message?.includes("fileId")) {
        errorMessage = "Invalid file identifier. Please try again.";
      } else if (error.message?.includes("size")) {
        errorMessage = "File size too large. Please choose a smaller image.";
      } else if (error.message?.includes("type")) {
        errorMessage = "Invalid file type. Please upload a valid image.";
      } else if (error.message?.includes("transformations_blocked")) {
        errorMessage =
          "Image processing failed. Please try uploading a smaller image.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Verify user authorization for image operations
   * @param userId - The user ID attempting the operation
   * @param targetUserId - The user ID of the image being accessed
   * @param _authToken - JWT token for authorization (for future use)
   * @returns boolean indicating if operation is authorized
   */
  private async verifyImageAuthorisation(
    userId: string,
    targetUserId: string,
    _authToken?: string,
  ): Promise<boolean> {
    // Basic check: users can only access their own images
    if (userId !== targetUserId) {
      return false;
    }

    // Additional server-side verification could be added here
    // For now, we rely on the frontend token and user ID matching
    return true;
  }

  /**
   * Get the URL for a user's profile image
   * @param userId - The user ID
   * @param _requestingUserId - The user ID making the request (for future authorization)
   * @param width - Optional width for image transformation (DISABLED for free plan)
   * @param height - Optional height for image transformation (DISABLED for free plan)
   * @param quality - Optional quality (1-100) (DISABLED for free plan)
   * @returns Image URL string or empty string if not found
   */
  public async getProfileImageUrl(
    userId: string,
    _requestingUserId?: string,
    _width?: number,
    _height?: number,
    _quality: number = 80,
  ): Promise<string> {
    try {
      const fileId = await this.getExistingProfileFileId(userId);

      if (!fileId) {
        return "";
      }

      return this.getImageUrl(fileId);
    } catch (error: unknown) {
      console.error("Error generating profile image URL:", error);
      return "";
    }
  }

  /**
   * Get the URL for an uploaded image - Modified to handle plan limitations
   * @param fileId - The file ID from Appwrite
   * @param width - Optional width for image transformation (ignored on free plan)
   * @param height - Optional height for image transformation (ignored on free plan)
   * @param quality - Optional quality (1-100) (ignored on free plan)
   * @returns Image URL string
   */
  public getImageUrl(
    fileId: string,
    width?: number,
    height?: number,
    quality: number = 80,
  ): string {
    try {
      if (!width && !height) {
        const baseUrl = storage.getFileView(
          appwriteConfig.userProfilePicBucketId,
          fileId,
        );
        return baseUrl.toString();
      }

      try {
        const imageUrl: string = storage.getFilePreview(
          appwriteConfig.userProfilePicBucketId,
          fileId,
          width,
          height,
          ImageGravity.Center,
          quality,
        );
        return imageUrl.toString();
      } catch (transformError) {
        console.warn(
          "Image transformations not available, falling back to direct view:",
          transformError,
        );
        const baseUrl: string = storage.getFileView(
          appwriteConfig.userProfilePicBucketId,
          fileId,
        );
        return baseUrl.toString();
      }
    } catch (error: unknown) {
      console.error("Error generating image URL:", error);
      return "";
    }
  }

  /**
   * Get the direct file view URL (no transformations)
   * @param fileId - The file ID from Appwrite
   * @returns Direct file URL string
   */
  public getDirectImageUrl(fileId: string): string {
    try {
      const imageUrl = storage.getFileView(
        appwriteConfig.userProfilePicBucketId,
        fileId,
      );
      return imageUrl.toString();
    } catch (error: unknown) {
      console.error("Error generating direct image URL:", error);
      return "";
    }
  }

  /**
   * Delete a user's profile image with authorization
   * @param userId - The user ID whose profile image to delete
   * @param requestingUserId - The user ID making the request
   * @param authToken - JWT token for authorization
   * @returns Promise with deletion result
   */
  public async deleteProfileImage(
    userId: string,
    requestingUserId: string,
    authToken?: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!userId || !userId.trim()) {
        return {
          success: false,
          error: "User ID is required",
        };
      }

      const isAuthorised: boolean = await this.verifyImageAuthorisation(
        userId,
        requestingUserId,
        authToken,
      );
      if (!isAuthorised) {
        return {
          success: false,
          error: "Not authorized to delete this image",
        };
      }

      const fileId: string | null = await this.getExistingProfileFileId(userId);

      if (!fileId) {
        return {
          success: false,
          error: "No profile image found for this user",
        };
      }

      await storage.deleteFile(appwriteConfig.userProfilePicBucketId, fileId);
      return { success: true };
    } catch (error: any) {
      console.error("Error deleting profile image:", error);
      return {
        success: false,
        error: error.message || "Failed to delete profile image",
      };
    }
  }

  /**
   * Check if a user has a profile image
   * @param userId - The user ID to check
   * @returns Promise<boolean> - true if user has a profile image
   */
  public async hasProfileImage(userId: string): Promise<boolean> {
    try {
      const fileId: string | null = await this.getExistingProfileFileId(userId);
      return !!fileId;
    } catch {
      return false;
    }
  }

  /**
   * Get profile image metadata
   * @param userId - The user ID
   * @param requestingUserId - The user ID making the request
   * @returns Promise with image metadata or null
   */
  public async getProfileImageMetadata(
    userId: string,
    requestingUserId?: string,
  ): Promise<any | null> {
    try {
      if (requestingUserId && userId !== requestingUserId) {
        return null;
      }

      const fileId = await this.getExistingProfileFileId(userId);

      if (!fileId) {
        return null;
      }

      const file = await storage.getFile(
        appwriteConfig.userProfilePicBucketId,
        fileId,
      );
      return file;
    } catch (error) {
      console.error("Error getting profile image metadata:", error);
      return null;
    }
  }

  /**
   * Extract file ID from an Appwrite image URL
   * @param imageUrl - Full image URL from Appwrite
   * @returns File ID or null if not found
   */
  public extractFileIdFromUrl(imageUrl: string): string | null {
    try {
      const urlParts: string[] = imageUrl.split("/");
      const previewIndex: number = urlParts.findIndex(
        (part) => part === "preview" || part === "view",
      );

      if (previewIndex > 0) {
        return urlParts[previewIndex - 1];
      }

      return null;
    } catch (error: unknown) {
      console.error("Error extracting file ID from URL:", error);
      return null;
    }
  }

  /**
   * Extract user ID from a profile image file name or metadata
   * This method would need to be adapted based on how you store user association
   */
  public async extractUserIdFromFile(fileId: string): Promise<string | null> {
    try {
      const file = await storage.getFile(
        appwriteConfig.userProfilePicBucketId,
        fileId,
      );

      if (
        file.name &&
        file.name.includes("user_") &&
        file.name.includes("_profile_image")
      ) {
        const match = file.name.match(/user_([^_]+)_profile_image/);
        return match ? match[1] : null;
      }

      return null;
    } catch (error: unknown) {
      console.error("Error extracting user ID from file:", error);
      return null;
    }
  }
}

export const imageService = new AppwriteImageService();

// Additional helper function for handling upload errors gracefully
export const handleImageUploadError = (error: any): string => {
  if (error?.message?.includes("transformations_blocked")) {
    return "Image processing is not available on the current plan. The image was uploaded successfully but may appear at full size.";
  }

  if (error?.message?.includes("403")) {
    return "Upload failed due to plan limitations. Please try uploading a smaller image or contact support.";
  }

  if (error?.message?.includes("size")) {
    return "File size too large. Please upload an image smaller than 5MB.";
  }

  if (error?.message?.includes("type")) {
    return "Invalid file type. Please upload a valid image file.";
  }

  return error?.message || "Failed to upload image. Please try again.";
};
