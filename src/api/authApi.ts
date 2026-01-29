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
 */
export const profileApi = axios.create({
  baseURL: AUTH_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Apply industrial interceptors for automated token refresh
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
 * Logic: Just returns data. Storage is handled by useAuth.login() 
 * to ensure state and storage are always in sync.
 */
export const loginUser = async (email: string, password: string) => {
  const res = await authApi.post('/login', { email, password });
  return res.data; // Logic moved to useAuth hook for atomic state updates
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
 * Uses the authenticated profileApi to hit the /me endpoint
 */
export const getProfile = async () => {
  const res = await profileApi.get('/me');
  return res.data;
};

/**
 * ✅ Update Profile
 */
export const updateProfile = async (data: any) => {
  const res = await profileApi.put('/me', data);
  return res.data;
};

/**
 * ✅ Global Logout
 */
export const logoutUser = () => {
  clearTokens();
  window.location.href = '/login';
};

export default authApi;