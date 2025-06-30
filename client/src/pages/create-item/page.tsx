import { Button } from "@/src/components/common/buttons/button";
import { Input } from "@/src/components/common/input/input";
import { SearchableSelect } from "@/src/components/common/input/select";
import { TextArea } from "@/src/components/common/input/text-area";
import PreviewImage from "@/src/components/store/preview-image";
import { useUI } from "@/src/context/ui-context";
import { formatString } from "@/src/utils/helpers";
import { useEffect, useState } from "react";

const CreateItem: React.FC = (): React.ReactElement => {
  const { departments, fetchDepartments, categories, fetchCategories, subcategories, fetchSubcategories, fetchBrands, fetchSizes, sizes, brands } = useUI();


  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | undefined>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>('');

  useEffect(() => {
    fetchDepartments();
    fetchBrands();
    fetchSizes();
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

  const brandOptions = brands.map(b => ({
    label: b.brand_name,
    value: b.brand_name
  }));

  const sizeOptions = sizes.map(s => ({
    label: formatString(s.size_name),
    value: s.size_id
  }));

  const conditions = ['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'BAD'];

  const conditionOptions = conditions.map(c => ({
    label: formatString(c),
    value: c
  }));


  console.log(subcategoryOptions)

  return (
    <form className="w-full 800px:px-[200px] mt-10">
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

      <div className="mt-10 flex justify-between">
        <div className="flex flex-col gap-5">
          <label htmlFor="">
            <p className="text-[12px] mb-2 font-bold">
              Product Title <span className="text-[#ff0000]">*</span>
            </p>
            <Input
              type="text"
              className="!bg-primary-light !text-primary-dark w-[600px]"
              placeholder="Product name..."
            />
          </label>
          <label htmlFor="">
              <p className="text-[12px] mb-2 font-bold">
                Select Department <span className="text-[#ff0000]">*</span>
              </p>
              <SearchableSelect width={600} bgLight={true} options={options}
                value={selectedDepartmentId} 
                onChange={(e) => setSelectedDepartmentId(e)} 
              />
          </label>
          <label htmlFor="">
            <p className="text-[12px] mb-2 font-bold">
              Select Category <span className="text-[#ff0000]">*</span>
            </p>
            <SearchableSelect width={600} bgLight={true} onChange={e => setSelectedCategoryId(e)} options={categoryOptions} disabled={!selectedDepartmentId}/>
          </label>
          <label htmlFor="">
            <p className="text-[12px] mb-2 font-bold">
              Select Category <span className="text-[#ff0000]">*</span>
            </p>
            <SearchableSelect width={600} onChange={e => setSelectedCategoryId(e)} bgLight={true} options={subcategoryOptions} disabled={!selectedCategoryId}/>
          </label>

          <label htmlFor="">
            <p className="text-[12px] mb-2 font-bold">
              Condtion <span className="text-[#ff0000]">*</span>
            </p>
            <SearchableSelect width={600}  bgLight={true} options={conditionOptions}/>
          </label>


          <label htmlFor="">
            <p className="text-[12px] mb-2 font-bold font-bold">
              Price <span className="text-[#ff0000]">*</span>
            </p>
            <Input type="text" className="!bg-primary-light !text-primary-dark" width={600}/>
          </label>
        </div>

        <div className="flex flex-col gap-5">
          <label htmlFor="">
            <p className="text-[12px] mb-2 font-bold">
              Brand
            </p>
            <SearchableSelect options={brandOptions} bgLight={true} width={600} placeholder="Select a brand" />
          </label>
          <label htmlFor="">
            <p className="text-[12px] mb-2 font-bold">
              Size
            </p>
            <SearchableSelect options={sizeOptions} bgLight={true} width={600} placeholder="Select a size" />
          </label>
          <label htmlFor="">
              <p className="text-[12px] mb-2 font-bold">
                Product Description <span className="text-[#ff0000]">*</span>
              </p>
              <TextArea className="w-[600px]"  placeholder="Share your product's story..." />
          </label>

          <Button text="List Item" className="mt-5 !text-[12px] font-bold" />
          </div>
      </div>

    </form>
  );
};

export default CreateItem;
