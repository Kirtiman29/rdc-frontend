// src/api/authApi.ts

import axios from 'axios';
import { applyIndustrialInterceptors, clearTokens } from './apiClient';

const AUTH_BASE_URL = 'http://localhost:8081/auth';

/**
 * ✅ Public Instance: Used for Login, Signup, and Refresh
 * Does not require a Bearer token to be sent.
 */
export const authApi = axios.create({
  baseURL: AUTH_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * ✅ Private Instance: Used for Profile Management
 * Automatically includes the JWT and handles 401 refreshes via interceptors.
 * Applied to Port 8081 to ensure profile data is fetched from Auth Service.
 */
export const profileApi = axios.create({
  baseURL: AUTH_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ✅ Applying your crucial industrial interceptors (Contains the Refresh Logic)
applyIndustrialInterceptors(profileApi);

/**
 * ✅ Industrial Sync: Register User (Port 8081)
 * Now supports the mandatory 'displayName' requirement[cite: 180, 181].
 * Expected Data: { email, password, displayName }
 */
export const registerUser = async (data: { email: string; password: string; displayName: string }) => {
  const res = await authApi.post('/signup', data);
  return res.data;
};

/**
 * ✅ Industrial Sync: Login User
 */
export const loginUser = async (email: string, password: string) => {
  const res = await authApi.post('/login', { email, password });
  return res.data; 
};

/**
 * ✅ Google Login Support
 */
export const loginWithGoogle = async (idToken: string) => {
  const res = await authApi.post('/google', { idToken });
  return res.data;
};

/**
 * ✅ Fetch User Profile
 * Uses profileApi (with interceptors) to hit the /me endpoint.
 * Matches the backend controller: AuthController.getCurrentUser().
 */
export const getProfile = async () => {
  // Changed from '/profile' to '/me' to match backend implementation 
  const res = await profileApi.get('/me');
  return res.data;
};

/**
 * ✅ Global Logout
 */
export const logoutUser = () => {
  clearTokens();
  window.location.href = '/login';
};

/**
 * ✅ Request Password Reset
 */
export const requestPasswordReset = async (email: string) => {
  const res = await authApi.post('/password/request-reset', { email });
  return res.data;
};

/**
 * ✅ Submit New Password
 */
export const resetPassword = async (token: string, newPassword: string) => {
  const res = await authApi.post('/password/reset', { token, newPassword });
  return res.data;
};

export default authApi;