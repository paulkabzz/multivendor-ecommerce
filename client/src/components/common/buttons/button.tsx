import type { IButton } from "@utils/types";

export const Button: React.FC<IButton> = ({ text, disabled=false, action, className="", width, height, type}) => {
  return (
    <button disabled={disabled} type={type} onClick={action} className={className + " text-[14px] bg-[#131313] text-white rounded-3xl py-2 h-[40px] hover:opacity-90"} style={{width: width, height: height}}>
        { text }
    </button>
  );
};