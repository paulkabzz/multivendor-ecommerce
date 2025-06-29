import React, { createContext, useContext, useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BASE_URL } from '@/src/utils/url';
import type { IUpdateUserRequest } from '@/src/utils/types';

interface User {
  user_id: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: any;
  login: (credentials: { email: string; password: string }) => Promise<any>;
  updateUser: (updateData: Partial<IUpdateUserRequest>) => Promise<any>;
  updateAvatar: (data: { userId: string; avatarFile: File }) => Promise<any>;
  logout: () => void;
  refetchUser: () => Promise<any>;
  isLoginLoading: boolean;
  isUpdateLoading: boolean;
  isAvatarLoading: boolean;
  loginError: string | undefined;
  updateError: string | undefined;
  avatarError: string | undefined;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const getStoredToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

export const setStoredToken = (token: string) => {
  localStorage.setItem('token', token);
};

export const removeStoredToken = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

const fetchUser = async (token: string | null) => {
  if (!token) {
    throw new Error('No authentication token provided');
  }

  const response = await fetch(`${BASE_URL}/get-me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user data: ${response.status}`);
  }

  const data = await response.json();
  return data;
};

const loginAPI = async (credentials: { email: string; password: string }) => {
  const response = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message);
  }

  return data;
};

const updateUserAPI = async (updateData: Partial<IUpdateUserRequest>, token: string) => {
  const response = await fetch(`${BASE_URL}/update-user`, {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updateData),
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message);
  }

  return data;
};

const updateUserAvatarAPI = async ({ userId, avatarFile, token }: { userId: string; avatarFile: File; token: string }) => {
  const formData = new FormData();
  formData.append('user_id', userId);
  formData.append('avatar', avatarFile);

  const response = await fetch(`${BASE_URL}/update-user`, {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message);
  }

  return data;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [forceUpdate, setForceUpdate] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentToken = getStoredToken();
      if (currentToken !== token) {
        setToken(currentToken);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [token]);

  const {
    data: userData,
    isLoading,
    error,
    refetch: refetchUser,
  } = useQuery({
    queryKey: ['user', token, forceUpdate],
    queryFn: () => fetchUser(token),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const user = userData?.user || null;
  const isAuthenticated = !!token && !!user;

  const loginMutation = useMutation({
    mutationFn: loginAPI,
    onSuccess: (data) => {
      setStoredToken(data.token);
      setToken(data.token);

      queryClient.setQueryData(['user', data.token, forceUpdate], data);
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error) => {
      console.error('Login failed:', error);
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: (updateData: Partial<IUpdateUserRequest>) => updateUserAPI(updateData, token!),
    onSuccess: (data) => {
      queryClient.setQueryData(['user', token, forceUpdate], data);
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error) => {
      console.error('Update user failed:', error);
    },
  });

  const updateAvatarMutation = useMutation({
    mutationFn: ({ userId, avatarFile }: { userId: string; avatarFile: File }) => 
      updateUserAvatarAPI({ userId, avatarFile, token: token! }),
    onSuccess: (data) => {
      queryClient.setQueryData(['user', token, forceUpdate], data);
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error) => {
      console.error('Update avatar failed:', error);
    },
  });

  const logout = () => {
    removeStoredToken();
    setToken(null);
    
    queryClient.clear();
    
    setForceUpdate(prev => prev + 1);
    
    queryClient.removeQueries({ queryKey: ['user'] });
    queryClient.setQueryData(['user', null, forceUpdate + 1], null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login: loginMutation.mutateAsync,
    updateUser: updateUserMutation.mutateAsync,
    updateAvatar: updateAvatarMutation.mutateAsync,
    logout,
    refetchUser,
    isLoginLoading: loginMutation.isPending,
    isUpdateLoading: updateUserMutation.isPending,
    isAvatarLoading: updateAvatarMutation.isPending,
    loginError: loginMutation.error?.message,
    updateError: updateUserMutation.error?.message,
    avatarError: updateAvatarMutation.error?.message,
    token
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};