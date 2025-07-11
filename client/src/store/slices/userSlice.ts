import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { BASE_URL } from "@/src/utils/url";
import type { IUser, IUpdateUserRequest } from "@/src/utils/types";

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

interface UserState {
  user: IUser | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  signupSuccess: boolean;
  token: string | null;
}

const initialState: Partial<UserState> = getUserFromStorage();

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

// Async thunk for user signup
export const signupUser = createAsyncThunk(
  'user/signup',
  async (userData: Omit<IUser, 'user_id'>, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL}/sign-up`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Signup failed');
      }

      return data;
    } catch (error) {
      return rejectWithValue('Network error. Please try again.');
    }
  }
);

// Async thunk for OTP verification
export const verifyOTP = createAsyncThunk(
  'user/verifyOTP',
  async ({ email, otpCode }: { email: string; otpCode: string }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL}/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otpCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'OTP verification failed');
      }

      return data;
    } catch (error) {
      return rejectWithValue('Network error. Please try again.');
    }
  }
);

// Async thunk for resending OTP
export const resendOTP = createAsyncThunk(
  'user/resendOTP',
  async ({ email }: { email: string }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL}/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to resend OTP');
      }

      return data;
    } catch (error) {
      return rejectWithValue('Network error. Please try again.');
    }
  }
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

// Async thunk for updating user avatar
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

export const logoutUser = createAsyncThunk(
  "user/logout",
  async (_, { rejectWithValue }) => {
    try {
      const token = getUserFromStorage().token;

      if (!token) {
        return rejectWithValue("No authentication token found");
      }

      const response = await fetch(`${BASE_URL}/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      } else {
        throw new Error(data.message || "Failed to logout. Please try again.");
      }
    } catch (error) {
      console.error("Error logging out: ", error);
      return rejectWithValue("Failed to log out.");
    }
  }
);

// Create the user slice
const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateUserLocal: (state, action: PayloadAction<Partial<IUser>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem("user", JSON.stringify(state.user));
      }
    },
    clearSignupSuccess: (state) => {
      state.signupSuccess = false;
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
        state.signupSuccess = false;
      })
      .addCase(signupUser.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.signupSuccess = true;
        // Don't set user as authenticated yet - wait for OTP verification
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.signupSuccess = false;
      })
      // OTP verification cases
      .addCase(verifyOTP.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOTP.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.isAuthenticated = true;
        state.signupSuccess = false;
        // You might want to redirect to login page instead of auto-login
        // depending on your UX requirements
      })
      .addCase(verifyOTP.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Resend OTP cases
      .addCase(resendOTP.pending, (state) => {
        state.error = null;
      })
      .addCase(resendOTP.fulfilled, (state) => {
        state.error = null;
      })
      .addCase(resendOTP.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Logout cases
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
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

export const { clearError, updateUserLocal, clearSignupSuccess } = userSlice.actions;
export default userSlice.reducer;