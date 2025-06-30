import { Button } from "@/src/components/common/buttons/button";
import { Input } from "@/src/components/common/input/input";
import { SearchableSelect } from "@/src/components/common/input/select";
import { TextArea } from "@/src/components/common/input/text-area";
import PreviewImage from "@/src/components/store/preview-image";
import { useAuth } from "@/src/context/auth-context";
import { useStore } from "@/src/context/store-context";
import { useUI } from "@/src/context/ui-context";
import { formatString } from "@/src/utils/helpers";
import { BASE_URL } from "@/src/utils/url";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

interface FormData {
  name: string;
  price: string;
  description: string;
  condition: string;
  department_id: string;
  subcategory_id: string;
  brand_id: string;
  size_id: string;
  vendor_id: string; // You'll need to get this from your auth context
}

interface FormErrors {
  name?: string;
  price?: string;
  description?: string;
  condition?: string;
  department_id?: string;
  subcategory_id?: string;
  images?: string;
  general?: string;
}

const CreateItem: React.FC = (): React.ReactElement => {
  const { token } = useAuth();
  const { store, refetchStore } = useStore();
  const navigate = useNavigate();
  const { 
    departments, 
    fetchDepartments, 
    categories, 
    fetchCategories, 
    subcategories, 
    fetchSubcategories, 
    fetchBrands, 
    fetchSizes, 
    sizes, 
    brands 
  } = useUI();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    price: '',
    description: '',
    condition: 'GOOD',
    department_id: '',
    subcategory_id: '',
    brand_id: '',
    size_id: '',
    vendor_id: store?.vendor_id ?? "" 
  });

  // UI state
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [images, setImages] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  useEffect(() => {
    fetchDepartments();
    fetchBrands();
    fetchSizes();
    // TODO: Get vendor_id from auth context
    // setFormData(prev => ({ ...prev, vendor_id: user.vendor_id }));
  }, []);

  const options = departments.map((i) => ({
    value: i.department_id,
    label: i.department_name,
  }));

  useEffect(() => {
    if (selectedDepartmentId) {
      fetchCategories(selectedDepartmentId);
      setFormData(prev => ({ ...prev, department_id: selectedDepartmentId }));
    }
  }, [selectedDepartmentId]);

  const categoryOptions = categories.map(c => ({
    label: c.category_name,
    value: c.category_id
  }));

  useEffect(() => {
    if (selectedCategoryId && selectedDepartmentId) {
      fetchSubcategories(selectedDepartmentId, selectedCategoryId);
    }
  }, [selectedCategoryId]);

  const subcategoryOptions = subcategories.map(sc => ({
    label: sc.subcategory_name,
    value: sc.subcategory_id
  }));

  const brandOptions = brands.map(b => ({
    label: b.brand_name,
    value: b.brand_id
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

  // Handle input changes
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Handle image changes
  const handleImageChange = (index: number, file: File | null) => {
    setImages(prev => {
      const newImages = [...prev];
      if (file) {
        newImages[index] = file;
      } else {
        newImages.splice(index, 1);
      }
      return newImages;
    });
    
    // Clear image error when user adds an image
    if (file && errors.images) {
      setErrors(prev => ({ ...prev, images: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      newErrors.name = "Product name must be at least 2 characters long";
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = "Price must be greater than 0";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Product description is required";
    }

    if (!formData.condition) {
      newErrors.condition = "Condition is required";
    }

    if (!formData.department_id) {
      newErrors.department_id = "Department is required";
    }

    if (!formData.subcategory_id) {
      newErrors.subcategory_id = "Subcategory is required";
    }

    if (images.length === 0) {
      newErrors.images = "At least one image is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const formDataToSend = new FormData();
      
      // Append form fields
      formDataToSend.append('name', formData.name.trim());
      formDataToSend.append('vendor_id', formData.vendor_id);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('description', formData.description.trim());
      formDataToSend.append('condition', formData.condition);
      formDataToSend.append('is_available', 'true');
      formDataToSend.append('subcategory_id', formData.subcategory_id);
      formDataToSend.append('size_id', formData.size_id);
      formDataToSend.append('brand_id', formData.brand_id);
      formDataToSend.append('department_id', formData.department_id);

      // Append images
      images.forEach((image) => {
        formDataToSend.append('images', image);
      });

      const response = await fetch(`${BASE_URL}/create-product`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`
        },
        body: formDataToSend,
        // Note: Don't set Content-Type header when using FormData - browser will set it automatically
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to create product');
      }

      // Success
      setIsSuccess(true);
      
      // Reset form
      setFormData({
        name: '',
        price: '',
        description: '',
        condition: 'GOOD',
        department_id: '',
        subcategory_id: '',
        brand_id: '',
        size_id: '',
        vendor_id: formData.vendor_id
      });
      setImages([]);
      setSelectedDepartmentId('');
      setSelectedCategoryId('');

      // Show success message for 3 seconds
      setTimeout(() => setIsSuccess(false), 3000);

      refetchStore();
      
      navigate(`/my-store/${store?.vendor_id}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="w-full 800px:px-[200px] mt-10" onSubmit={handleSubmit}>
      {/* Success Message */}
      {isSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          Product created successfully!
        </div>
      )}

      {/* General Error Message */}
      {errors.general && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {errors.general}
        </div>
      )}

      <div className="w-full flex flex-col">
        <h2 className="font-bold mb-2">
          Create product (* means required field)
        </h2>
        <p className="text-[12px] text-[#777] mb-2">Add up to 7 images</p>
        
        {/* Images Section */}
        <div className="flex w-full justify-between">
          {new Array(7).fill("").map((_, j) => (
            <PreviewImage 
              key={j} 
              index={j} 
              onImageChange={(file) => handleImageChange(j, file)} 
            />
          ))}
        </div>
        
        {errors.images && (
          <p className="text-red-500 text-[12px] mt-2">{errors.images}</p>
        )}
      </div>

      <div className="mt-10 flex justify-between">
        <div className="flex flex-col gap-5">
          {/* Product Title */}
          <label>
            <p className="text-[12px] mb-2 font-bold">
              Product Title <span className="text-[#ff0000]">*</span>
            </p>
            <Input
              type="text"
              className="!bg-primary-light !text-primary-dark w-[600px]"
              placeholder="Product name..."
              value={formData.name}
              action={(e:any) => handleInputChange('name', e.target.value)}
            />
            {errors.name && (
              <p className="text-red-500 text-[12px] mt-1">{errors.name}</p>
            )}
          </label>

          {/* Department */}
          <label>
            <p className="text-[12px] mb-2 font-bold">
              Select Department <span className="text-[#ff0000]">*</span>
            </p>
            <SearchableSelect 
              width={600} 
              bgLight={true} 
              options={options}
              value={selectedDepartmentId} 
              onChange={(value) => setSelectedDepartmentId(value)} 
            />
            {errors.department_id && (
              <p className="text-red-500 text-[12px] mt-1">{errors.department_id}</p>
            )}
          </label>

          {/* Category */}
          <label>
            <p className="text-[12px] mb-2 font-bold">
              Select Category <span className="text-[#ff0000]">*</span>
            </p>
            <SearchableSelect 
              width={600} 
              bgLight={true} 
              onChange={(value) => setSelectedCategoryId(value)} 
              options={categoryOptions} 
              disabled={!selectedDepartmentId}
            />
          </label>

          {/* Subcategory */}
          <label>
            <p className="text-[12px] mb-2 font-bold">
              Select Subcategory <span className="text-[#ff0000]">*</span>
            </p>
            <SearchableSelect 
              width={600} 
              onChange={(value) => handleInputChange('subcategory_id', value)} 
              bgLight={true} 
              options={subcategoryOptions} 
              disabled={!selectedCategoryId}
            />
            {errors.subcategory_id && (
              <p className="text-red-500 text-[12px] mt-1">{errors.subcategory_id}</p>
            )}
          </label>

          {/* Condition */}
          <label>
            <p className="text-[12px] mb-2 font-bold">
              Condition <span className="text-[#ff0000]">*</span>
            </p>
            <SearchableSelect 
              width={600} 
              bgLight={true} 
              options={conditionOptions}
              value={formData.condition}
              onChange={(value) => handleInputChange('condition', value)}
            />
            {errors.condition && (
              <p className="text-red-500 text-[12px] mt-1">{errors.condition}</p>
            )}
          </label>

          {/* Price */}
          <label>
            <p className="text-[12px] mb-2 font-bold">
              Price <span className="text-[#ff0000]">*</span>
            </p>
            <Input 
              type="number" 
              className="!bg-primary-light !text-primary-dark" 
              width={600}
              placeholder="0.00"
              value={formData.price}
              action={(e:any) => handleInputChange('price', e.target.value)}
            />
            {errors.price && (
              <p className="text-red-500 text-[12px] mt-1">{errors.price}</p>
            )}
          </label>
        </div>

        <div className="flex flex-col gap-5">
          {/* Brand */}
          <label>
            <p className="text-[12px] mb-2 font-bold">Brand</p>
            <SearchableSelect 
              options={brandOptions} 
              bgLight={true} 
              width={600} 
              placeholder="Select a brand"
              value={formData.brand_id}
              onChange={(value) => handleInputChange('brand_id', value)}
            />
          </label>

          {/* Size */}
          <label>
            <p className="text-[12px] mb-2 font-bold">Size</p>
            <SearchableSelect 
              options={sizeOptions} 
              bgLight={true} 
              width={600} 
              placeholder="Select a size"
              value={formData.size_id}
              onChange={(value) => handleInputChange('size_id', value)}
            />
          </label>

          {/* Description */}
          <label>
            <p className="text-[12px] mb-2 font-bold">
              Product Description <span className="text-[#ff0000]">*</span>
            </p>
            <TextArea 
              className="w-[600px]" 
              placeholder="Share your product's story..."
              value={formData.description}
              onChange={(e: any) => handleInputChange('description', e.target.value)}
            />
            {errors.description && (
              <p className="text-red-500 text-[12px] mt-1">{errors.description}</p>
            )}
          </label>

          {/* Submit Button */}
          <Button 
            text={isLoading ? "Creating Product..." : "List Item"} 
            className="mt-5 !text-[12px] font-bold" 
            type="submit"
            disabled={isLoading}
          />
        </div>
      </div>
    </form>
  );
};

export default CreateItem;