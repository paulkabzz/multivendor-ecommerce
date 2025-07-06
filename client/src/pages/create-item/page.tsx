import React, { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { Button } from "@/src/components/common/buttons/button";
import { Input } from "@/src/components/common/input/input";
import { ComboBox } from "@/src/components/common/input/combo-box";
import { TextArea } from "@/src/components/common/input/text-area";
import PreviewImage from "@/src/components/store/preview-image";
import { useAuth } from "@/src/context/auth-context";
import { useStore } from "@/src/context/store-context";
import { 
  useDepartments, 
  useCategories, 
  useSubcategories, 
  useBrands, 
  useSizes 
} from "@/src/context/ui-context";
import { formatString } from "@/src/utils/helpers";
import { BASE_URL } from "@/src/utils/url";
import Loader from "@/src/components/common/loader/loader";

// Types
interface FormData {
  name: string;
  price: string;
  description: string;
  condition: string;
  department_id: string;
  subcategory_id: string;
  brand_id: string;
  size_id: string;
  vendor_id: string;
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

interface CreateProductData extends FormData {
  images: File[];
  is_available: boolean;
}

interface ApiResponse {
  success: boolean;
  message?: string;
}

const createProduct = async (data: CreateProductData, token: string): Promise<ApiResponse> => {
  const formData = new FormData();
  
  formData.append('name', data.name.trim());
  formData.append('vendor_id', data.vendor_id);
  formData.append('price', data.price);
  formData.append('description', data.description.trim());
  formData.append('condition', data.condition);
  formData.append('is_available', data.is_available.toString());
  formData.append('subcategory_id', data.subcategory_id);
  formData.append('size_id', data.size_id);
  formData.append('brand_id', data.brand_id);
  formData.append('department_id', data.department_id);

  data.images.forEach((image) => {
    formData.append('images', image);
  });

  const response = await fetch(`${BASE_URL}/create-product`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`
    },
    body: formData,
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || 'Failed to create product');
  }

  return result;
};

const CreateItem: React.FC = (): React.ReactElement => {
  const { token } = useAuth();
  const { store, refetchStore } = useStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [images, setImages] = useState<File[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const { 
    data: departments = [], 
    isLoading: departmentsLoading, 
    error: departmentsError 
  } = useDepartments();

  const { 
    data: categories = [], 
    isLoading: categoriesLoading,
    error: categoriesError 
  } = useCategories(selectedDepartmentId);

  const { 
    data: subcategories = [], 
    isLoading: subcategoriesLoading,
    error: subcategoriesError 
  } = useSubcategories(selectedDepartmentId, selectedCategoryId);

  const { 
    data: brands = [], 
    isLoading: brandsLoading,
    error: brandsError 
  } = useBrands();

  const { 
    data: sizes = [], 
    isLoading: sizesLoading,
    error: sizesError 
  } = useSizes();

  const createProductMutation = useMutation({
    mutationFn: (data: CreateProductData) => createProduct(data, token!),
    onSuccess: () => {

      setIsSuccess(true);
      
      setFormData({
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
      setImages([]);
      setSelectedDepartmentId('');
      setSelectedCategoryId('');
      setErrors({});

      // setTimeout(() => setIsSuccess(false), 3000);

      refetchStore();
      
      navigate(`/my-store/${store?.vendor_id}`);

      // Invalidate any relevant queries
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: Error) => {
      setErrors({ general: error.message });
    }
  });

  // Set vendor_id when store data is available
  useEffect(() => {
    if (store?.vendor_id) {
      setFormData(prev => ({ ...prev, vendor_id: store.vendor_id }));
    }
  }, [store?.vendor_id]);

  // Update form data when department changes
  useEffect(() => {
    if (selectedDepartmentId) {
      setFormData(prev => ({ ...prev, department_id: selectedDepartmentId }));
      // Reset category and subcategory when department changes
      setSelectedCategoryId('');
      setFormData(prev => ({ ...prev, subcategory_id: '' }));
    }
  }, [selectedDepartmentId]);

  // Reset subcategory when category changes
  useEffect(() => {
    if (selectedCategoryId) {
      setFormData(prev => ({ ...prev, subcategory_id: '' }));
    }
  }, [selectedCategoryId]);

  // Prepare options for selectors
  const departmentOptions = departments.map((dept: any) => ({
    value: dept.department_id,
    label: dept.department_name,
  }));

  const categoryOptions = categories.map(cat => ({
    label: cat.category_name,
    value: cat.category_id
  }));

  const subcategoryOptions = subcategories.map(sub => ({
    label: sub.subcategory_name,
    value: sub.subcategory_id
  }));

  const brandOptions = brands.map(brand => ({
    label: brand.brand_name,
    value: brand.brand_id
  }));

  const sizeOptions = sizes.map(size => ({
    label: formatString(size.size_name),
    value: size.size_id
  }));

  const conditions = ['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'BAD'] as const;
  const conditionOptions = conditions.map(condition => ({
    label: formatString(condition),
    value: condition
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

  // Form validation
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

    createProductMutation.mutate({
      ...formData,
      images,
      is_available: true
    });
  };

  const isLoading = createProductMutation.isPending;

  const hasDataError = departmentsError || categoriesError || subcategoriesError || brandsError || sizesError;
  
  if (hasDataError) {
    return (
      <div className="w-full 800px:px-[200px] mt-10">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error loading data. Please refresh the page and try again.
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
         <div className="w-full bg-white min-h-[100vh] fixed top-0 right-0 z-[100000] flex items-center justify-center">
                <Loader />
          </div>
    )
  }

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
              action={(e: React.ChangeEvent<HTMLInputElement>) => 
                handleInputChange('name', e.target.value)
              }
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
            <ComboBox 
              width={600} 
              bgLight={true} 
              options={departmentOptions}
              value={selectedDepartmentId} 
              onChange={(value) => setSelectedDepartmentId(value)}
              disabled={departmentsLoading}
              placeholder={departmentsLoading ? "Loading departments..." : "Select department"}
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
            <ComboBox 
              width={600} 
              bgLight={true} 
              onChange={(value) => setSelectedCategoryId(value)} 
              options={categoryOptions} 
              disabled={!selectedDepartmentId}
              isLoading={categoriesLoading}
              placeholder={
                !selectedDepartmentId 
                  ? "Select department first" 
                  : "Select category"
              }
            />
          </label>

          {/* Subcategory */}
          <label>
            <p className="text-[12px] mb-2 font-bold">
              Select Subcategory <span className="text-[#ff0000]">*</span>
            </p>
            <ComboBox 
              width={600} 
              onChange={(value) => handleInputChange('subcategory_id', value)} 
              bgLight={true} 
              options={subcategoryOptions} 
              disabled={!selectedCategoryId}
              isLoading={subcategoriesLoading}
              placeholder={
                !selectedCategoryId 
                  ? "Select category first" 
                  : "Select subcategory"
              }
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
            <ComboBox 
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
              action={(e: React.ChangeEvent<HTMLInputElement>) => 
                handleInputChange('price', e.target.value)
              }
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
            <ComboBox 
              options={brandOptions} 
              bgLight={true} 
              width={600} 
              placeholder={brandsLoading ? "Loading brands..." : "Select a brand"}
              value={formData.brand_id}
              onChange={(value) => handleInputChange('brand_id', value)}
              isLoading={brandsLoading}
            />
          </label>

          {/* Size */}
          <label>
            <p className="text-[12px] mb-2 font-bold">Size</p>
            <ComboBox 
              options={sizeOptions} 
              bgLight={true} 
              width={600} 
              placeholder={sizesLoading ? "Loading sizes..." : "Select a size"}
              value={formData.size_id}
              onChange={(value) => handleInputChange('size_id', value)}
              isLoading={sizesLoading}
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
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                handleInputChange('description', e.target.value)
              }
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