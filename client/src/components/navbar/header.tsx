import { categories } from "../../utils/categories";
import type { INavLink } from "../../utils/types";
import { CategoryButton } from "../common/buttons/category-button";

export const Header: React.FC = (): React.ReactElement => {
  return (
    <>
      <header className="absolute top-0 right-0 w-full h-[50px] bg-[#131313] flex justify-between items-center px-[100px] overflow-y-auto ">
        {categories.slice(0, 12).map((category: INavLink, key: number) => (
          <>
            <CategoryButton
              key={key}
              text={category.text}
              href={category.href}
              className="font-[600] text-[12px] text-[#fff]"
            />
          </>
        ))}
      </header>
    </>
  );
};
