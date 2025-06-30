import React, { createContext, useContext } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BASE_URL } from '@/src/utils/url';
import { useAuth } from './auth-context';
import { setStoredToken } from './auth-context'; 

interface Store {
  vendor_id: string;
  user_id: string;
  store_name: string;
  bio?: string | null;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
  // product: any[];
  [key: string]: any;
}

interface CreateStoreData {
  store_name: string;
  bio?: string;
  avatar?: File;
}

interface StoreContextType {
  store: Store | null;
  isLoading: boolean;
  error: any;
  hasStore: boolean;
  createStore: (storeData: CreateStoreData) => Promise<any>;
  refetchStore: () => void;
  isCreateLoading: boolean;
  createError: string | undefined;
  resetCreateError: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const fetchStore = async (token: string | null) => {
  if (!token) {
    throw new Error('No authentication token provided');
  }

  const response = await fetch(`${BASE_URL}/my-store`, {
    headers: {
      authorization: `Bearer ${token}`,
    },
    method: 'GET',
  });

  const data = await response.json();

  if (response.status === 404) {
    return { store: null };
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch store data: ${response.status}`);
  }

  return { store: data.data };
};

const createStoreAPI = async (storeData: CreateStoreData, token: string, userId: string) => {
  const formData = new FormData();
  formData.append('user_id', userId);
  formData.append('store_name', storeData.store_name.trim());
  
  if (storeData.bio?.trim()) {
    formData.append('bio', storeData.bio.trim());
  }
  
  if (storeData.avatar) {
    formData.append('avatar', storeData.avatar);
  }

  const response = await fetch(`${BASE_URL}/create-store`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message);
  }

  return data;
};

interface StoreProviderProps {
  children: React.ReactNode;
}

export const StoreProvider: React.FC<StoreProviderProps> = ({ children }) => {
  const queryClient = useQueryClient();
  const { user, isAuthenticated, refetchUser, token } = useAuth();

  // Store query.. only fetch if user is authenticated and has VENDOR or ADMIN role
  const {
    data: storeData,
    isLoading,
    error,
    refetch: refetchStore,
  } = useQuery({
    queryKey: ['store', user?.user_id],
    queryFn: () => fetchStore(token),
    enabled: isAuthenticated && (user?.role === 'VENDOR' || user?.role === 'ADMIN'),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const store = storeData?.store || null;
  const hasStore = !!store;

  const createStoreMutation = useMutation({
    mutationFn: (storeData: CreateStoreData) => {
      if (!user?.user_id || !token) {
        throw new Error('User not authenticated');
      }
      return createStoreAPI(storeData, token, user.user_id);
    },
    onSuccess: async (data) => {
      // CRITICAL FIX: Store the new JWT token that comes with updated role, was having issue with token based role verification
      if (data.token) {
        setStoredToken(data.token);
        console.log('New token stored after store creation:', data.token);
      }
      
      queryClient.setQueryData(['store', user?.user_id], { store: data.data });
      
      if (data.user) {
        queryClient.setQueryData(['user', data.token, 0], { user: data.user });
      }
      
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['store'] });
      
      setTimeout(() => {
        refetchUser();
      }, 100);
    },
    onError: (error) => {
      console.error('Create store failed:', error);
    },
  });

  const resetCreateError = () => {
    createStoreMutation.reset();
  };

  const value: StoreContextType = {
    store,
    isLoading,
    error,
    hasStore,
    createStore: createStoreMutation.mutateAsync,
    refetchStore,
    isCreateLoading: createStoreMutation.isPending,
    createError: createStoreMutation.error?.message,
    resetCreateError,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export const useStore = (): StoreContextType => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};