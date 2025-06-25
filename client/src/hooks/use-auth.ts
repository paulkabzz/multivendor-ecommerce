// hooks/useAuth.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BASE_URL } from '@/src/utils/url';
import type { IUpdateUserRequest } from '@/src/utils/types';

// Auth token management
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
  localStorage.removeItem('user'); // Clean up old user data if exists
};

// API functions
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

// Custom hooks
export const useAuth = () => {
  const queryClient = useQueryClient();
  const token = getStoredToken();

  // User query
  const {
    data: userData,
    isLoading,
    error,
    refetch: refetchUser,
  } = useQuery({
    queryKey: ['user'],
    queryFn: () => fetchUser(token),
    enabled: !!token,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });

  const user = userData?.user;
  const isAuthenticated = !!token && !!user;

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: loginAPI,
    onSuccess: (data) => {
      // Store token
      setStoredToken(data.token);
      
      // Set user data in cache
      queryClient.setQueryData(['user'], data);
      
      // Invalidate and refetch user data to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error) => {
      console.error('Login failed:', error);
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: (updateData: Partial<IUpdateUserRequest>) => updateUserAPI(updateData, token!),
    onSuccess: (data) => {
      // Update user data in cache immediately
      queryClient.setQueryData(['user'], data);
      
      // Optional: Also invalidate to refetch from server
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error) => {
      console.error('Update user failed:', error);
    },
  });

  // Update avatar mutation
  const updateAvatarMutation = useMutation({
    mutationFn: ({ userId, avatarFile }: { userId: string; avatarFile: File }) => 
      updateUserAvatarAPI({ userId, avatarFile, token: token! }),
    onSuccess: (data) => {
      // Update user data in cache immediately
      queryClient.setQueryData(['user'], data);
      
      // Optional: Also invalidate to refetch from server
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error) => {
      console.error('Update avatar failed:', error);
    },
  });

  // Logout function
  const logout = () => {
    removeStoredToken();
    queryClient.removeQueries({ queryKey: ['user'] });
    queryClient.clear(); // Clear all cached data
  };

  return {
    // User data
    user,
    isAuthenticated,
    isLoading,
    error,
    
    // Actions
    login: loginMutation.mutateAsync,
    updateUser: updateUserMutation.mutateAsync,
    updateAvatar: updateAvatarMutation.mutateAsync,
    logout,
    refetchUser,
    
    // Loading states
    isLoginLoading: loginMutation.isPending,
    isUpdateLoading: updateUserMutation.isPending,
    isAvatarLoading: updateAvatarMutation.isPending,
    
    // Errors
    loginError: loginMutation.error?.message,
    updateError: updateUserMutation.error?.message,
    avatarError: updateAvatarMutation.error?.message,
  };
};

// // Optional: Simplified Redux slice (if you want to keep minimal auth state)
// // userSlice.ts - MINIMAL VERSION
// import { createSlice } from "@reduxjs/toolkit";

// interface MinimalUserState {
//   token: string | null;
//   isAuthenticated: boolean;
// }

// const getInitialState = (): MinimalUserState => {
//   if (typeof window !== "undefined") {
//     const token = localStorage.getItem("token");
//     return {
//       token,
//       isAuthenticated: !!token,
//     };
//   }
//   return {
//     token: null,
//     isAuthenticated: false,
//   };
// };

// const userSlice = createSlice({
//   name: "user",
//   initialState: getInitialState(),
//   reducers: {
//     setToken: (state, action) => {
//       state.token = action.payload;
//       state.isAuthenticated = !!action.payload;
//       if (action.payload) {
//         localStorage.setItem("token", action.payload);
//       } else {
//         localStorage.removeItem("token");
//       }
//     },
//     clearToken: (state) => {
//       state.token = null;
//       state.isAuthenticated = false;
//       localStorage.removeItem("token");
//     },
//   },
// });

// export const { setToken, clearToken } = userSlice.actions;
// export default userSlice.reducer;