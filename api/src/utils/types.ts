export interface IUser {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  role?: 'CUSTOMER' | 'VENDOR' | 'ADMIN';
  password: string;
  avatar_url?: string | null;
}

export interface IVendor {
    user_id: string;
    store_name: string;
    bio: string | null;
    avatar_url: string | null;
    vendor_id: string;
}

// Auth interfaces
export interface ILoginRequest {
  email: string;
  password: string;
}

export interface ILoginResponse {
  success: boolean;
  message: string;
  user?: {
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
    is_verified: boolean;
    avatar_url: string | null;
    phone: string | null;
    vendor?: IVendor;
  };
  token?: string;
  emailSent?: boolean;
}

export interface IVerificationRequest {
  token: string;
}

export interface IVerificationResponse {
  success: boolean;
  message: string;
  emailSent?: boolean;
}


// updating interfaces
export interface IUpdateUserRequest {
  user_id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  is_verified?: boolean;
}

// Admin interfaces
export interface ICreateDepartment {
  department_name: string;
  user_id: string;
  image: File;
}

export interface ICreateCategory {
  department_id: string;
  category_name: string[];
  user_id: string;
}

export interface ICreateSubCategory {
  category_id: string;
  subcategory_name: string[];
  user_id: string;
}

export interface ICreateProduct {
  // user_id: string;
  vendor_id: string;
  image_url: string[];
  price: number;
  is_available?: boolean;
  description?: string;
  name: string;
  condition?: string;
  subcategory_id?: string;
}

export interface ICreateStore {
  user_id: string;
  store_name: string;
  bio?: string | null;
  avatar_url?: string | null;
}


// Appwrite related interfaces
export interface IAppwriteConfig {
  endpoint: string;
  projectId: string;
  apiKey: string;
  userAvatarBucketId: string;
}

export interface IUploadResult {
  success: boolean;
  fileId?: string;
  imageUrl?: string;
  error?: string;
}

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