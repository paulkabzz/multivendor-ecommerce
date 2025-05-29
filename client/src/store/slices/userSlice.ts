import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { BASE_URL } from '@/src/utils/url';
import type { IUser, UserState } from '@/src/utils/types';

// Initialise state from localStorage if available
const getUserFromStorage = () => {
  if (typeof window !== 'undefined') {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    return {
      user: storedUser ? JSON.parse(storedUser) : null,
      token: storedToken || null,
      isAuthenticated: !!storedToken,
      loading: false,
      error: null
    };
  }
  
  return {
    user: null,
    token: null,
    isAuthenticated: false,
    loading: false,
    error: null
  };
};

const initialState: UserState = getUserFromStorage();

// Async thunk for login
export const loginUser = createAsyncThunk(
  'user/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });

      const data = await response.json();
      
      if (!data.success) {
        return rejectWithValue(data.message);
      }
      
      // Store in localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      return data;
    } catch (error) {
      return rejectWithValue('Failed to login. Please try again.');
    }
  }
);

// Async thunk for signup
export const signupUser = createAsyncThunk(
  'user/signup',
  async (userData: IUser, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL}/sign-up`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();
      
      if (!data.success) {
        return rejectWithValue(data.message);
      }
      
      return data;
    } catch (error) {
      return rejectWithValue('Failed to sign up. Please try again.');
    }
  }
);

// Create the user slice
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    logout: (state) => {
      // Clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Reset state
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Signup cases
      .addCase(signupUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signupUser.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const { logout, clearError } = userSlice.actions;
export default userSlice.reducer;