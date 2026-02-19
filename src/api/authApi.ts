import axios from 'axios';
import { clearTokens, applyIndustrialInterceptors } from './apiClient';

/** * ✅ PRODUCTION URL: Fetched from .env 
 * Standardized to hit the /auth context path of the Auth Service
 */
const AUTH_BASE_URL = `${import.meta.env.VITE_AUTH_SERVICE_URL}/auth`;

/**
 * ✅ Public Instance: Used for Login, Signup, and Password recovery.
 * These endpoints do not require an existing token.
 */
export const authApi = axios.create({
  baseURL: AUTH_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * ✅ Private Instance: Used for Profile Management (/me).
 * Uses the industrial interceptor for automatic data unwrapping.
 */
export const profileApi = axios.create({
  baseURL: AUTH_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Apply the centralized industrial interceptors for the profile service
// This handles Bearer token attachment and response.data unwrapping
applyIndustrialInterceptors(profileApi);

// For the public api, we only want the data unwrapper, not the token attachment
authApi.interceptors.response.use((response) => response.data);

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
 * Uses the profileApi which automatically handles JWT injection
 */
export const getProfile = async () => {
  return await profileApi.get('/me');
};

/**
 * ✅ Global Logout: Purges local security context
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