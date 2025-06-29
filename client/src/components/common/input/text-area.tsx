import type { IInput } from "@utils/types";

export const TextArea: React.FC<Partial<IInput>> = ({
  placeholder,
  disabled,
  className,
  width,
  height,
  action,
  id,
  name,
  value,
  defaultValue,
}): React.ReactElement => {
  return (
    <div
      className={
        className +
        ` ${width ? `!w-[${width}px] ` : "w-[450px]"} ${height ? ` !h-[${height}px] ` : ""} bg-[#dddd] text-[#131313] flex justify-center gap-3 py-2 px-4 rounded-3xl`
      }
    >
      <textarea
        defaultValue={defaultValue}
        disabled={disabled}
        name={name}
        value={value}
        id={id}
        onChange={action}
        className={
          " bg-transparent h-full outline-none w-full placeholder:text-[12px] placeholder:text-[#8e8e8e] placeholder:font-[400] text-[12px]"
        }
        placeholder={placeholder}
      />
    </div>
  );
};
