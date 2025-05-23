import type { IInput } from "@utils/types";
import searchIcon from '@assets/icons/search.png'

export const Input: React.FC<IInput> = ({ placeholder, type, className, width, height}): React.ReactElement => {
  return (
    <div className={className +  ` ${width ? 'w-' + width : 'w-[450px]'} ${height ? 'h-' + height : 'h-[40px]'} bg-[#3b3b3b] text-[#fff] flex justify-center gap-3 py-2 px-4 rounded-3xl`}>
        <img src={searchIcon} alt="Search" />
        <input type={type} className={className + ' bg-transparent outline-none w-full h-full placeholder:text-[12px] placeholder:text-[#8e8e8e] placeholder:font-[400] text-[12px]'} placeholder={ placeholder }  />
    </div>
  );
}
