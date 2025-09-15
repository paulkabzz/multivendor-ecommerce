export interface INavLink {
  text: string;
  href: string;
  icon?: string;
}

export interface IInput {
  placeholder?: string;
  type: string;
  icon?: string;
  className?: string;
  collapsible?: boolean;
  width?: number;
  height?: number;
  disabled?: boolean;
  action?: any;
  name?: string;
  value?: string;
  maxLength?: number;
  id?: string;
  defaultValue?: string | number;
}

export interface IShoppingCard {
  product_id?: string;
  name: string;
  price: number;
  img_url: string;
  decsription?: string;
  vendor?: string;
}

export interface IButton {
  text: string;
  disabled?: boolean;
  width?: number;
  height?: number;
  action?: any;
  className?: string;
  type?: "submit" | "reset" | "button" | undefined;
}

export interface IUser {
  user_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role?: "CUSTOMER" | "VENDOR" | "ADMIN";
  password: string;
  is_verified?: boolean;
  avatar_url?: string;
}

export interface UserState {
  user: {
    user_id?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    role?: string;
    is_verified?: boolean;
    avatar_url?: string;
  } | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface IUpdateUserRequest {}

export type Condition = 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR' | 'BAD';