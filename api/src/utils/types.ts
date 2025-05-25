export interface IUser {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role?: 'CUSTOMER' | 'VENDOR' | 'ADMIN';
  password: string;
}

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
  };
  token?: string;
}