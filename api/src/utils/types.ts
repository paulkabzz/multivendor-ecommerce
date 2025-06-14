export interface IUser {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role?: 'CUSTOMER' | 'VENDOR' | 'ADMIN';
  password: string;
  profile_pic_url?: string;
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
    profile_pic_url?: string;
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