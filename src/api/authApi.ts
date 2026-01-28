import axios from 'axios';
import { saveTokens, clearTokens, applyIndustrialInterceptors } from './apiClient';

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

// Apply industrial interceptors for automated token refresh [cite: 131-135]
applyIndustrialInterceptors(profileApi);

/**
 * ✅ Industrial Sync: Register User (Port 8081)
 */
export const registerUser = async (data: any) => {
  const res = await authApi.post('/signup', data); // [cite: 25-27]
  return res.data;
};

/**
 * ✅ Industrial Sync: Login User
 * Standardizes token extraction and saves to LocalStorage automatically.
 */
export const loginUser = async (email: string, password: string) => {
  const res = await authApi.post('/login', { email, password }); // [cite: 27]
  
  const { accessToken, refreshToken } = res.data; // [cite: 48-50]
  
  if (accessToken) {
    saveTokens(accessToken, refreshToken);
    console.log('✅ Session synchronized: JWT stored in LocalStorage');
  }
  
  return res.data;
};

/**
 * ✅ Google Login Support
 * Verifies ID Token from Frontend and creates/logs in user [cite: 15-24]
 */
export const loginWithGoogle = async (idToken: string) => {
  const res = await authApi.post('/google', { idToken }); // 
  const { accessToken, refreshToken } = res.data; // [cite: 22]
  
  if (accessToken) {
    saveTokens(accessToken, refreshToken);
  }
  return res.data;
};

/**
 * ✅ FIXED: Fetch User Profile
 * Uses the authenticated profileApi to hit the /me endpoint
 */
export const getProfile = async () => {
  const res = await profileApi.get('/me'); // Calls getCurrentUser [cite: 10, 12, 132]
  return res.data;
};

/**
 * ✅ Update Profile
 */
export const updateProfile = async (data: any) => {
  const res = await profileApi.put('/me', data); 
  return res.data;
};

export const logoutUser = () => {
  clearTokens();
  window.location.href = '/login';
};

export default authApi;