import React, { createContext, useContext } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BASE_URL } from '@/src/utils/url';

interface Department {
  department_id: string;
  department_name: string;
  department_cover: string;
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

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  body?: T;
  brands?: T;
  sizes?: T;
}

const apiClient = {
  createDepartment: async (data: CreateDepartmentData): Promise<ApiResponse<Department>> => {
    const formData = new FormData();
    formData.append('department_name', data.department_name);
    
    if (data.cover) {
      formData.append('cover', data.cover);
    }

    const response = await fetch(`${BASE_URL}/create-department`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to create department');
    }
    
    return result;
  },

  fetchDepartments: async (): Promise<Department[]> => {
    const response = await fetch(`${BASE_URL}/get-departments`);
    const data: ApiResponse<Department[]> = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch departments');
    }
    
    return data.data || [];
  },

  fetchCategories: async (departmentId: string): Promise<Category[]> => {
    const response = await fetch(
      `${BASE_URL}/get-departments?departmentId=${departmentId}&include-categories=true`
    );
    const data: ApiResponse<{ categories: Category[] }> = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch categories');
    }
    
    return data.data?.categories || [];
  },

  createSubcategory: async (data: CreateSubcategoryData): Promise<ApiResponse<Subcategory>> => {
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
      throw new Error(result.message || 'Failed to create subcategory');
    }
    
    return result;
  },

  fetchSubcategories: async (departmentId: string, categoryId: string): Promise<Subcategory[]> => {
    const response = await fetch(
      `${BASE_URL}/get-subcategories?categoryId=${categoryId}&departmentId=${departmentId}`
    );
    const data: ApiResponse<Subcategory[]> = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch subcategories');
    }

    return data.body || [];
  },

  fetchBrands: async (): Promise<Brand[]> => {
    const response = await fetch(`${BASE_URL}/get-brands`);
    const data: ApiResponse<Brand[]> = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch brands');
    }
    
    return data.brands || [];
  },

  fetchSizes: async (): Promise<Size[]> => {
    const response = await fetch(`${BASE_URL}/get-sizes`);
    const data: ApiResponse<Size[]> = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch sizes');
    }

    return data.sizes || [];
  }
};

// Query keys
export const queryKeys = {
  departments: ['departments'] as const,
  categories: (departmentId: string) => ['categories', departmentId] as const,
  subcategories: (departmentId: string, categoryId: string) => 
    ['subcategories', departmentId, categoryId] as const,
  brands: ['brands'] as const,
  sizes: ['sizes'] as const,
};

// Custom hooks
export const useDepartments = () => {
  return useQuery({
    queryKey: queryKeys.departments,
    queryFn: apiClient.fetchDepartments,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCategories = (departmentId: string) => {
  return useQuery({
    queryKey: queryKeys.categories(departmentId),
    queryFn: () => apiClient.fetchCategories(departmentId),
    enabled: !!departmentId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useSubcategories = (departmentId: string, categoryId: string) => {
  return useQuery({
    queryKey: queryKeys.subcategories(departmentId, categoryId),
    queryFn: () => apiClient.fetchSubcategories(departmentId, categoryId),
    enabled: !!departmentId && !!categoryId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useBrands = () => {
  return useQuery({
    queryKey: queryKeys.brands,
    queryFn: apiClient.fetchBrands,
    staleTime: 60 * 60 * 1000, // 60 minutes - brands change less frequently
  });
};

export const useSizes = () => {
  return useQuery({
    queryKey: queryKeys.sizes,
    queryFn: apiClient.fetchSizes,
    staleTime: 10 * 60 * 1000,
  });
};

// Mutation hooks
export const useCreateDepartment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: apiClient.createDepartment,
    onSuccess: () => {
      // Invalidate and refetch departments
      queryClient.invalidateQueries({ queryKey: queryKeys.departments });
    },
  });
};

export const useCreateSubcategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: apiClient.createSubcategory,
    onSuccess: (_, variables) => {
      // Invalidate subcategories for the specific category
      queryClient.invalidateQueries({ 
        queryKey: ['subcategories'],
        predicate: (query) => {
          const [, , categoryId] = query.queryKey;
          return categoryId === variables.category_id;
        }
      });
    },
  });
};

// Context type (simplified since React Query handles most of the state)
interface UIContextType {
  // Legacy methods for backward compatibility
  resetCreateDepartmentError: () => void;
  resetCreateCategoryError: () => void;
  resetCreateSubcategoryError: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

interface UIProviderProps {
  children: React.ReactNode;
}

export const UIProvider: React.FC<UIProviderProps> = ({ children }) => {
  // These are no-ops since React Query handles error states
  const resetCreateDepartmentError = () => {};
  const resetCreateCategoryError = () => {};
  const resetCreateSubcategoryError = () => {};

  const value: UIContextType = {
    resetCreateDepartmentError,
    resetCreateCategoryError,
    resetCreateSubcategoryError,
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
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};