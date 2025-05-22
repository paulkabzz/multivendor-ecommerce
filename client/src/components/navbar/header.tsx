import { categories } from "../../utils/categories";
import type { INavLink } from "../../utils/types";
import { CategoryButton } from "../common/buttons/category-button";

export const Header = () => {
    return (
        <>
            <header className="absolute top-0 right-0 w-full h-[3vh] bg-white flex justify-between items-center px-[100px]">
                {
                    categories.slice(0, 6).map((category: INavLink, key: number) => (
                        <>
                            <CategoryButton key={key} text={category.text} href={category.href} />
                        </>
                    ))
                }
            </header>
        </>
    );
}