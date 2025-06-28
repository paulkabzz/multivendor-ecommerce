import { Input } from "@/src/components/common/input/input";
import { SearchableSelect } from "@/src/components/common/input/select";
import { TextArea } from "@/src/components/common/input/text-area";
import PreviewImage from "@/src/components/store/preview-image";
import { useUI } from "@/src/context/ui-context";
import { useEffect, useState } from "react";

const CreateItem: React.FC = (): React.ReactElement => {
  const { departments, fetchDepartments, categories, fetchCategories, subcategories, fetchSubcategories } = useUI();


  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | undefined>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>('');

  useEffect(() => {
    fetchDepartments();
  }, []);

  const options = departments.map((i) => ({
    value: i.department_id,
    label: i.department_name,
  }));

  useEffect(() => {
    if (selectedDepartmentId) {
      fetchCategories(selectedDepartmentId);
    }
  }, [selectedDepartmentId]);


  const categoryOptions = categories.map(c => ({
    label: c.category_name,
    value: c.category_id
  }));

  useEffect(() => {
    if (selectedCategoryId && selectedDepartmentId){
        fetchSubcategories(selectedDepartmentId, selectedCategoryId);
    }
  }, [selectedCategoryId]);

  const subcategoryOptions = subcategories.map(sc => ({
    label: sc.subcategory_name,
    value: sc.subcategory_id
  }));


  console.log(subcategoryOptions)

  return (
    <div className="w-full 800px:px-[200px] h-screen mt-10">
      <div className="w-full flex flex-col">
        <h2 className="font-bold mb-2">
          Create product (* means required field)
        </h2>
        <p className="text-[12px] text-[#777] mb-2">Add upp to 6 images</p>
        <div className="flex w-full justify-between">
          {new Array(7).fill("").map((_, j) => (
            <PreviewImage key={j} index={j} />
          ))}
        </div>
      </div>

      <div className="mt-10 flex">
        <div className="flex flex-col gap-5">
          <label htmlFor="">
            <p className="text-[12px] mb-2">
              Product Title <span className="text-[#ff0000]">*</span>
            </p>
            <Input
              type="text"
              className="!bg-primary-light !text-primary-dark"
              placeholder="Product name..."
            />
          </label>
          <label htmlFor="">
              <p className="text-[12px] mb-2">
                Select Department <span className="text-[#ff0000]">*</span>
              </p>
              <SearchableSelect bgLight={true} options={options}
                value={selectedDepartmentId} 
                onChange={(e) => setSelectedDepartmentId(e)} 
              />
          </label>
          <label htmlFor="">
            <p className="text-[12px] mb-2">
              Select Category <span className="text-[#ff0000]">*</span>
            </p>
            <SearchableSelect bgLight={true} onChange={e => setSelectedCategoryId(e)} options={categoryOptions} disabled={!selectedDepartmentId}/>
          </label>
          <label htmlFor="">
            <p className="text-[12px] mb-2">
              Select Category <span className="text-[#ff0000]">*</span>
            </p>
            <SearchableSelect onChange={e => setSelectedCategoryId(e)} bgLight={true} options={subcategoryOptions} disabled={!selectedCategoryId}/>
          </label>
        </div>

        <label htmlFor="">
          <p className="text-[12px] mb-2">
            Product Description <span className="text-[#ff0000]">*</span>
          </p>
          <TextArea placeholder="Share your product's story..." />
        </label>
      </div>

    </div>
  );
};

export default CreateItem;
