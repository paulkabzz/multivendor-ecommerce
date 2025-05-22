import type { INavLink } from "../../../utils/types";

export const CategoryButton: React.FC<INavLink & {className?: string}> = ({ text, href, className}) => {
  return <a href={href} className={className}> {text} </a>;
};
