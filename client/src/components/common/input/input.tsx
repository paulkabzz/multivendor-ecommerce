import type { IInput } from "@utils/types";

export const Input: React.FC<IInput> = ({ placeholder, type, className, width, height, icon, action, id, name, value, defaultValue}): React.ReactElement => {
  return (
    <div className={className +  ` ${width ? `!w-[${width}px] ` : 'w-[450px]'} ${height ? ` !h-[${height}px] ` : 'h-[40px]'} bg-[#3b3b3b] text-[#fff] flex justify-center gap-3 py-2 px-4 rounded-3xl`}>
       {icon && <img src={icon} alt="Search" />}
        <input defaultValue={defaultValue} type={type} name={name} value={value} id={id} onChange={action} className={className + ' bg-transparent outline-none w-full h-full placeholder:text-[12px] placeholder:text-[#8e8e8e] placeholder:font-[400] text-[12px]'} placeholder={ placeholder }  />
    </div>
  );
}
