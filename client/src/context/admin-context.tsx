import React, { createContext, useContext, useState } from 'react';
import { BASE_URL } from '@/src/utils/url';
import { useAuth } from '@src/context/auth-context';

interface Department {
  department_id: string;
  department_name: string;
}

interface Category {
  category_id: string;
  category_name: string;
}

interface CreateDepartmentData {
  department_name: string;
  cover?: File;
}

interface CreateCategoryData {
  department_id: string;
  category_name: string[];
}

interface CreateSubcategoryData {
  category_id: string;
  subcategory_name: string[];
}

interface AdminContextType {
  // Department state
  isCreateDepartmentLoading: boolean;
  createDepartmentError: string | null;
  
  // Category state
  isCreateCategoryLoading: boolean;
  createCategoryError: string | null;
  
  // Subcategory state
  isCreateSubcategoryLoading: boolean;
  createSubcategoryError: string | null;
  
  // Methods
  createDepartment: (data: CreateDepartmentData) => Promise<void>;
  createCategory: (data: CreateCategoryData) => Promise<void>;
  createSubcategory: (data: CreateSubcategoryData) => Promise<void>;
  resetCreateDepartmentError: () => void;
  resetCreateCategoryError: () => void;
  resetCreateSubcategoryError: () => void;
  
  // Data fetching
  departments: Department[];
  categories: Category[];
  loadingDepartments: boolean;
  fetchDepartments: () => Promise<void>;
  fetchCategories: (departmentId: string) => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

interface AdminProviderProps {
  children: React.ReactNode;
}

export const AdminProvider: React.FC<AdminProviderProps> = ({ children }) => {
  const { user, token } = useAuth();
  
  // Department state
  const [isCreateDepartmentLoading, setIsCreateDepartmentLoading] = useState(false);
  const [createDepartmentError, setCreateDepartmentError] = useState<string | null>(null);
  
  // Category state
  const [isCreateCategoryLoading, setIsCreateCategoryLoading] = useState(false);
  const [createCategoryError, setCreateCategoryError] = useState<string | null>(null);
  
  // Subcategory state
  const [isCreateSubcategoryLoading, setIsCreateSubcategoryLoading] = useState(false);
  const [createSubcategoryError, setCreateSubcategoryError] = useState<string | null>(null);
  
  // Data state
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  // Create Department
  const createDepartment = async (data: CreateDepartmentData) => {
    if (!user?.user_id || !token) {
      throw new Error('User not authenticated');
    }

    setIsCreateDepartmentLoading(true);
    setCreateDepartmentError(null);

    try {
      const formData = new FormData();
      formData.append('department_name', data.department_name);
      formData.append('user_id', user.user_id);
      
      if (data.cover) {
        formData.append('cover', data.cover);
      }

      const response = await fetch(`${BASE_URL}/create-department`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
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

  // Create Category
  const createCategory = async (data: CreateCategoryData) => {
    if (!user?.user_id || !token) {
      throw new Error('User not authenticated');
    }

    setIsCreateCategoryLoading(true);
    setCreateCategoryError(null);

    try {
      const response = await fetch(`${BASE_URL}/create-category`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          department_id: data.department_id,
          user_id: user.user_id,
          category_name: data.category_name,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to create category');
      }

      // Refresh categories list if we have a selected department
      if (data.department_id) {
        await fetchCategories(data.department_id);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setCreateCategoryError(errorMessage);
      throw error;
    } finally {
      setIsCreateCategoryLoading(false);
    }
  };


  // i'll implement later
  const createSubcategory = async (data: CreateSubcategoryData) => {
    if (!user?.user_id || !token) {
      throw new Error('User not authenticated');
    }

    setIsCreateSubcategoryLoading(true);
    setCreateSubcategoryError(null);

    try {
      // api call
      console.log('Creating subcategory:', data);

      const response = await fetch(`${BASE_URL}/create-subcategory`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: user.user_id,
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
    if (!token) return;

    setLoadingDepartments(true);
    try {
      const response = await fetch(`${BASE_URL}/get-departments`, {
        headers: { Authorization: `Bearer ${token}` },
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
    if (!token || !departmentId) return;

    try {
      const response = await fetch(
        `${BASE_URL}/get-departments?departmentId=${departmentId}&include-categories=true`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      
      if (data.success) {
        setCategories(data.data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Reset error functions
  const resetCreateDepartmentError = () => setCreateDepartmentError(null);
  const resetCreateCategoryError = () => setCreateCategoryError(null);
  const resetCreateSubcategoryError = () => setCreateSubcategoryError(null);

  const value: AdminContextType = {
    // Department
    isCreateDepartmentLoading,
    createDepartmentError,
    createDepartment,
    resetCreateDepartmentError,
    
    // Category
    isCreateCategoryLoading,
    createCategoryError,
    createCategory,
    resetCreateCategoryError,
    
    // Subcategory
    isCreateSubcategoryLoading,
    createSubcategoryError,
    createSubcategory,
    resetCreateSubcategoryError,
    
    // Data
    departments,
    categories,
    loadingDepartments,
    fetchDepartments,
    fetchCategories,
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = (): AdminContextType => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};