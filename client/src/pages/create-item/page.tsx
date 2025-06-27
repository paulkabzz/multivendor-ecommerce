import PreviewImage from "@/src/components/store/preview-image";

const CreateItem: React.FC = (): React.ReactElement => {

  return (
    <div className="w-full 800px:px-[200px] mt-10">
      <div className="w-full flex flex-col">
        <h2 className="font-bold mb-2">
          Create product (* means required field)
        </h2>
        <p className="text-[12px] text-[#777] mb-2">Add upp to 6 images</p>
        <div className="flex w-full justify-between">
            {
              new Array(7).fill("").map((_, j) => (
                      <PreviewImage key={j} index={j} />
              ))
            }
        </div>
      </div>
    </div>
 
  )
}

export default CreateItem;