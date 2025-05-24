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
}

export interface IShoppingCard {
  product_id?: string;
  name: string;
  price: number;
  img_url: string;
}