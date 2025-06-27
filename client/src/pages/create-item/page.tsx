import PreviewImage from "@/src/components/store/preview-image";

const CreateItem: React.FC = (): React.ReactElement => {


  return (
    <div className="flex w-full justify-between px-[200px]">{
        new Array(7).fill("").map((_, j) => (
                <PreviewImage key={j} />
        ))
    }</div>
  )
}

export default CreateItem;