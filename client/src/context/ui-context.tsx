import React, { createContext, useContext, useState } from 'react';
import { BASE_URL } from '@/src/utils/url';

interface Department {
  department_id: string;
  department_name: string;
}

interface Category {
  category_id: string;
  category_name: string;
}

interface Subcategory {
    subcategory_id: string;
    subcategory_name: string;
}

interface Brand {
  brand_id: string;
  brand_name: string;
}

interface Size {
  size_id: string;
  size_name: string;
}

interface CreateDepartmentData {
  department_name: string;
  cover?: File;
}

interface CreateSubcategoryData {
  category_id: string;
  subcategory_name: string[];
}

interface UIContextType {
  // Department state
  isCreateDepartmentLoading: boolean;
  createDepartmentError: string | null;
  
  // Category state
  createCategoryError: string | null;
  
  // Subcategory state
  isCreateSubcategoryLoading: boolean;
  createSubcategoryError: string | null;
  
  // Methods
  createDepartment: (data: CreateDepartmentData) => Promise<void>;
  createSubcategory: (data: CreateSubcategoryData) => Promise<void>;
  resetCreateDepartmentError: () => void;
  resetCreateCategoryError: () => void;
  resetCreateSubcategoryError: () => void;
  
  // Data fetching
  departments: Department[];
  categories: Category[];
  subcategories: Subcategory[];
  sizes: Size[];
  brands: Brand[];
  loadingDepartments: boolean;
  fetchDepartments: () => Promise<void>;
  fetchCategories: (departmentId: string) => Promise<void>;
  fetchSubcategories: (departmentId: string, subscategoryId: string) => Promise<void>;
  fetchSizes: () => Promise<void>;
  fetchBrands: () => Promise<void>;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

interface UIProviderProps {
  children: React.ReactNode;
}

export const UIProvider: React.FC<UIProviderProps> = ({ children }) => {
  
  // Department state
  const [isCreateDepartmentLoading, setIsCreateDepartmentLoading] = useState(false);
  const [createDepartmentError, setCreateDepartmentError] = useState<string | null>(null);
  
  // Category state
  const [createCategoryError, setCreateCategoryError] = useState<string | null>(null);
  
  // Subcategory state
  const [isCreateSubcategoryLoading, setIsCreateSubcategoryLoading] = useState(false);
  const [createSubcategoryError, setCreateSubcategoryError] = useState<string | null>(null);
  
  // Data state
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState<boolean>(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);

  // Create Department
  const createDepartment = async (data: CreateDepartmentData) => {
 
    setIsCreateDepartmentLoading(true);
    setCreateDepartmentError(null);

    try {
      const formData = new FormData();
      formData.append('department_name', data.department_name);
      
      if (data.cover) {
        formData.append('cover', data.cover);
      }

      const response = await fetch(`${BASE_URL}/create-department`, {
        method: 'POST',
        headers: {
        },
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to create department');
      }

      // Refresh departments list
      await fetchDepartments();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setCreateDepartmentError(errorMessage);
      throw error;
    } finally {
      setIsCreateDepartmentLoading(false);
    }
  };



  // i'll implement later
  const createSubcategory = async (data: CreateSubcategoryData) => {


    setIsCreateSubcategoryLoading(true);
    setCreateSubcategoryError(null);

    try {
      // api call
      console.log('Creating subcategory:', data);

      const response = await fetch(`${BASE_URL}/create-subcategory`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category_id: data.category_id,
          subcategory_name: data.subcategory_name
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to create subcategory");
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setCreateSubcategoryError(errorMessage);
      throw error;
    } finally {
      setIsCreateSubcategoryLoading(false);
    }
  };

  // Fetch Departments
  const fetchDepartments = async () => {

    setLoadingDepartments(true);
    try {
      const response = await fetch(`${BASE_URL}/get-departments`, {
      });
      const data = await response.json();
      
      if (data.success) {
        setDepartments(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    } finally {
      setLoadingDepartments(false);
    }
  };

  // Fetch Categories
  const fetchCategories = async (departmentId: string) => {

    try {
      const response = await fetch(
        `${BASE_URL}/get-departments?departmentId=${departmentId}&include-categories=true`,
      );
      const data = await response.json();
      
      if (data.success) {
        setCategories(data.data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };
  
  const fetchSubcategories = async (departmentId: string, categoryId: string) => {
    try {
        const response = await fetch(`${BASE_URL}/get-subcategories?categoryId=${categoryId}&departmentId=${departmentId}`);
        const data = await response.json();

        if (!data.success) throw new Error(data.message || "Error fetching subcategories.");

        if (data.success) {
            setSubcategories(data.body || []);
        }
        
    } catch (error) {
        console.error('Error fetching categories:', error);
    }
  }

  const fetchBrands = async () => {
    try {
      const response = await fetch(`${BASE_URL}/get-brands`);

      const data = await response.json();

      if (!data.success) throw new Error(data.message || "Error fetching brands");
      
      setBrands(data.brands);

    } catch (error) {
      console.error(error);
    }
  }

  const fetchSizes = async () => {
    try {
      const response = await fetch(`${BASE_URL}/get-sizes`);

      const data = await response.json();

      if (!data.success) throw new Error(data.message || "Error fetching brands");

      setSizes(data.sizes);

    } catch (error) {
      console.error(error);
    }
  }
  // Reset error functions
  const resetCreateDepartmentError = () => setCreateDepartmentError(null);
  const resetCreateCategoryError = () => setCreateCategoryError(null);
  const resetCreateSubcategoryError = () => setCreateSubcategoryError(null);

  const value: UIContextType = {
    // Department
    isCreateDepartmentLoading,
    createDepartmentError,
    createDepartment,
    resetCreateDepartmentError,
    
    // Category
    createCategoryError,
    resetCreateCategoryError,
    
    // Subcategory
    isCreateSubcategoryLoading,
    createSubcategoryError,
    createSubcategory,
    resetCreateSubcategoryError,
    
    // Data
    departments,
    categories,
    subcategories,
    sizes,
    brands,
    loadingDepartments,
    fetchDepartments,
    fetchCategories,
    fetchSubcategories,
    fetchBrands,
    fetchSizes
  };

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = (): UIContextType => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within an UIProvider');
  }
  return context;
};