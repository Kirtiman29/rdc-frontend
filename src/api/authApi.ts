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
 */
export const registerUser = async (data: any) => {
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
 * Uses profileApi (with interceptors) to hit the /profile endpoint.
 * Note: Changed from '/me' to '/profile' to match standard Auth Service patterns.
 */
export const getProfile = async () => {
  const res = await profileApi.get('/profile');
  return res.data;
};

/**
 * ✅ Update Profile
 */
export const updateProfile = async (data: any) => {
  const res = await profileApi.put('/profile', data);
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