interface TextAreaProps {
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  width?: number;
  height?: number;
  value?: string;
  defaultValue?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number;
  maxLength?: number;
  id?: string;
  name?: string;
}

export const TextArea: React.FC<Partial<TextAreaProps>> = ({
  placeholder,
  disabled,
  className,
  width,
  height,
  onChange,
  id,
  name,
  value,
  defaultValue,
}): React.ReactElement => {
  return (
    <div
      className={
        className +
        ` ${width ? `!w-[${width}px] ` : "w-[450px]"} ${height ? ` !h-[${height}px] ` : "min-h-[200px]"} bg-[#dddd] text-[#131313] flex justify-center gap-3 py-2 px-4 rounded-3xl`
      }
    >
      <textarea
        defaultValue={defaultValue}
        disabled={disabled}
        name={name}
        value={value}
        id={id}
        onChange={onChange}
        className={
          " bg-transparent min-h-[200px] h-full outline-none w-full placeholder:text-[12px] placeholder:text-[#8e8e8e] placeholder:font-[400] text-[12px]"
        }
        placeholder={placeholder}
      />
    </div>
  );
};
