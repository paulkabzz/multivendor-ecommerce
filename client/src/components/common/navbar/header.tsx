import { categories } from "../../../utils/categories";
import type { INavLink } from "../../../utils/types";
import { CategoryButton } from "../buttons/category-button";

export const Header: React.FC = (): React.ReactElement => {
  return (
    <>
      <header className="absolute top-0 right-0 w-full h-[50px] bg-[#fff] flex justify-between items-center px-[200px] overflow-y-auto z-[100] ">
        {categories.slice(0, 10).map((category: INavLink, key: number) => (
            <CategoryButton
              key={key}
              text={category.text}
              href={category.href}
              className={`font-[600] text-[12px] py-2 px-4 rounded-[100px] hover:text-[#fff] hover:bg-[#131313] ` + (key === 0 ? 'text-[#fff] bg-[#131313]' : 'text-[#131313] ')}
            />
        ))}
      </header>
    </>
  );
};
