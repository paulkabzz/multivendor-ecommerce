export interface INavLink {
  text: string;
  href: string;
  icon?: string;
};

export interface IInput {
  placeholder?: string;
  type: string;
  icon?: string;
  className?: string;
  collapsible?: boolean;
  width?: number;
  height?: number;
  action?:  any;
  name?: string;
  value?: string;
  id?: string;
};

export interface IShoppingCard {
  product_id?: string;
  name: string;
  price: number;
  img_url: string;
  decsription?: string;
  vendor?: string;
};

export interface IButton {
  text: string;
  disabled?: boolean;
  width?: number;
  height?: number;
  action?: any;
  className?: string;
  type?: "submit" | "reset" | "button" | undefined;
};

export interface IUser {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role?: 'CUSTOMER' | 'VENDOR' | 'ADMIN';
  password: string;
};

export interface UserState {
  user: {
    user_id?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    role?: string;
    is_verified?: boolean;
  } | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
};