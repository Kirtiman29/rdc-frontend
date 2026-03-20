import axios from 'axios';
import { clearTokens, applyIndustrialInterceptors } from './apiClient';

/** * ✅ PRODUCTION URL: Fetched from .env 
 * Standardized to hit the /auth context path of the Auth Service
 */
const AUTH_BASE_URL = `${import.meta.env.VITE_AUTH_SERVICE_URL}/api/auth`.replace(/([^:]\/)\/+/g, "$1");

/**
 * ✅ Public Instance: Used for Login, Signup, and Password recovery.
 */
export const authApi = axios.create({
  baseURL: AUTH_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * ✅ Private Instance: Used for Profile Management (/me).
 */
export const profileApi = axios.create({
  baseURL: AUTH_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * ✅ FIX 5: Apply Interceptors to both
 * This ensures that if any auth endpoint needs a token (like profile) 
 * or needs response unwrapping, it's handled consistently.
 */
applyIndustrialInterceptors(authApi);
applyIndustrialInterceptors(profileApi);

/**
 * ✅ Register User (Auth Service)
 */
export const registerUser = async (data: { email: string; password: string; displayName: string }) => {
  return await authApi.post('/signup', data);
};

/**
 * ✅ Standard Login
 */
export const loginUser = async (email: string, password: string) => {
  return await authApi.post('/login', { email, password });
};

/**
 * ✅ Google OAuth2 Unification
 */
export const loginWithGoogle = async (idToken: string) => {
  return await authApi.post('/google', { idToken });
};

/**
 * ✅ Fetch User Profile
 */
export const getProfile = async () => {
  return await profileApi.get('/me');
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
  return await authApi.post('/password/request-reset', { email });
};

/**
 * ✅ Submit New Password
 */
export const resetPassword = async (token: string, newPassword: string) => {
  return await authApi.post('/password/reset', { token, newPassword });
};

export default authApi;