import type { INavLink } from "@utils/types";
import { Link } from "react-router";

export const CategoryButton: React.FC<INavLink & { className?: string }> = ({
  text,
  href,
  className,
}): React.ReactElement => {
  return (
    <Link to={href} className={className}>
      {" "}
      {text}{" "}
    </Link>
  );
};
