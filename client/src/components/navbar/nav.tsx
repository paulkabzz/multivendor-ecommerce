import { categories } from "../../utils/categories"
import { Hamburger } from "../common/hamburger/hamburger";


export const Nav = () => {

  const capitalise = (value: string): string => {
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  }

  categories.forEach(i => {
    console.log(capitalise(i.replace(/_/g, " ")));
  })

  return (
    <header className='sticky top-0 right-0 bg-gray-400 w-full mt-[3vh] px-[100px] py-[.5rem] flex flex-col'>
        <div className="flex items-center justify-between">
        </div>
    </header>
  )
}
