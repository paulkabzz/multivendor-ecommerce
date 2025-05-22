import type { INavLink } from "../../../utils/types";

export const CategoryButton = ({ text, href }: INavLink) => {
  return <a href={href}> {text} </a>;
};
