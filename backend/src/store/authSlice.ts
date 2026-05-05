import { UserInfo } from "@models/auth";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  isAuthenticated: boolean;
  loading: boolean;
  checked: boolean;
  user: UserInfo | null;
  pathLogin?: string;
}

export const defaultUserInfo: UserInfo = {
  id: 0,
  username: "",
  role: { id: 0, name: "" },
  // Legacy fields for backward compatibility
};

const initialState: AuthState = {
  isAuthenticated: false,
  loading: false,
  checked: false,
  user: defaultUserInfo,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthUser: (state, action: PayloadAction<UserInfo>) => {
      state.isAuthenticated = true;
      state.user = action.payload;
      state.loading = false;
      state.checked = true;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.loading = false;
      state.checked = true;
      state.pathLogin = "/login-admin";
    },
    logoutUser: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.loading = false;
      state.checked = true;
      state.pathLogin = "/login";
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const { setAuthUser, logout, logoutUser, setLoading } =
  authSlice.actions;
export default authSlice.reducer;
