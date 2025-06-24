import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { BASE_URL } from "@/src/utils/url";
import type { IUser, UserState, IUpdateUserRequest } from "@/src/utils/types";

// Initialise state from localStorage if available
const getUserFromStorage = () => {
  if (typeof window !== "undefined") {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    return {
      user: storedUser ? JSON.parse(storedUser) : null,
      token: storedToken || null,
      isAuthenticated: !!storedToken,
      loading: false,
      error: null,
    };
  }

  return {
    user: null,
    token: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  };
};

const initialState: UserState = getUserFromStorage();

// Async thunk for login
export const loginUser = createAsyncThunk(
  "user/login",
  async (
    credentials: { email: string; password: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!data.success) {
        return rejectWithValue(data.message);
      }

      // Store in localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      return data;
    } catch (error) {
      console.error("Error logging in: " + error);
      return rejectWithValue("Failed to login. Please try again.");
    }
  },
);

// Async thunk for signup
export const signupUser = createAsyncThunk(
  "user/signup",
  async (userData: IUser, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL}/sign-up`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!data.success) {
        return rejectWithValue(data.message);
      }

      return data;
    } catch (error) {
      console.error("Error signing up: " + error);
      return rejectWithValue("Failed to sign up. Please try again.");
    }
  },
);

// Async thunk for updating user
export const updateUser = createAsyncThunk(
  "user/update",
  async (
    updateData: Partial<IUpdateUserRequest>,
    { getState, rejectWithValue },
  ) => {
    try {
      const state = getState() as { user: UserState };
      const token = state.user.token;

      if (!token) {
        return rejectWithValue("No authentication token found");
      }

      const response = await fetch(`${BASE_URL}/update-user`, {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!data.success) {
        return rejectWithValue(data.message);
      }

      // Update localStorage with new user data
      localStorage.setItem("user", JSON.stringify(data.user));

      return data;
    } catch (error) {
      console.error("Error updating user: " + error);
      return rejectWithValue("Failed to update user. Please try again.");
    }
  },
);

// Async thunk for updating usr avatar
export const updateUserAvatar = createAsyncThunk(
  "user/updateAvatar",
  async (
    { userId, avatarFile }: { userId: string; avatarFile: File },
    { getState, rejectWithValue },
  ) => {
    try {
      const state = getState() as { user: UserState };
      const token = state.user.token;

      if (!token) {
        return rejectWithValue("No authentication token found");
      }

      const formData = new FormData();
      formData.append('user_id', userId);
      formData.append('avatar', avatarFile);

      const response = await fetch(`${BASE_URL}/update-user`, {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!data.success) {
        return rejectWithValue(data.message);
      }

      localStorage.setItem("user", JSON.stringify(data.user));

      return data;
    } catch (error) {
      console.error("Error updating avatar: " + error);
      return rejectWithValue("Failed to update avatar. Please try again.");
    }
  },
);

// Create the user slice
const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    logout: (state) => {
      // Clear localStorage
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Reset state
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateUserLocal: (state, action: PayloadAction<Partial<IUser>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem("user", JSON.stringify(state.user));
      }
    },
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
      })
      // Update user cases
      .addCase(updateUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.user = action.payload.user;
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update avatar cases
      .addCase(updateUserAvatar.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserAvatar.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.user = action.payload.user;
      })
      .addCase(updateUserAvatar.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { logout, clearError, updateUserLocal } = userSlice.actions;
export default userSlice.reducer;