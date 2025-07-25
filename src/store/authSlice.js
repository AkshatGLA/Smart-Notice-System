// 1. Update your auth slice to include user role
// store/authSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  status: false,
  userData: null,
  userRole: null, // Add user role
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login: (state, action) => {
      state.status = true;
      state.userData = action.payload.userData;
      state.userRole = action.payload.userRole; // Store user role
    },
    logout: (state) => {
      state.status = false;
      state.userData = null;
      state.userRole = null;
    }
  }
});

export const { login, logout } = authSlice.actions;
export default authSlice.reducer;