// src/api/authApi.ts

import axios from 'axios';
import { clearTokens } from './apiClient';

const AUTH_BASE_URL = 'http://localhost:8081/auth';

/**
 * ✅ Public Instance: Used for Login, Signup, and Password recovery.
 * Does not require a Bearer token to be sent.
 */
export const authApi = axios.create({
  baseURL: AUTH_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * ✅ Private Instance: Used for Profile Management (/me).
 * Attaches the JWT from localStorage but does NOT include the auto-refresh interceptor
 * to prevent infinite loop cycles during the authentication handshake.
 */
export const profileApi = axios.create({
  baseURL: AUTH_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ✅ Manual Industrial Interceptor: Attach token strictly without refresh logic
profileApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * ✅ Industrial Sync: Register User (Port 8081)
 * Enforces the mandatory 'displayName' requirement for the RDC Vault[cite: 43, 72].
 */
export const registerUser = async (data: { email: string; password: string; displayName: string }) => {
  const res = await authApi.post('/signup', data);
  return res.data;
};

/**
 * ✅ Industrial Sync: Standard Login [cite: 45]
 */
export const loginUser = async (email: string, password: string) => {
  const res = await authApi.post('/login', { email, password });
  return res.data; 
};

/**
 * ✅ Google OAuth2 Unification [cite: 36, 40]
 */
export const loginWithGoogle = async (idToken: string) => {
  const res = await authApi.post('/google', { idToken });
  return res.data;
};

/**
 * ✅ Fetch User Profile
 * Hits the Port 8081 /me endpoint using numeric userId extracted from JWT.
 */
export const getProfile = async () => {
  const res = await profileApi.get('/me');
  return res.data;
};

/**
 * ✅ Global Logout: Purges local security context
 */
export const logoutUser = () => {
  clearTokens();
  window.location.href = '/login';
};

/**
 * ✅ Request Password Reset [cite: 48, 51]
 */
export const requestPasswordReset = async (email: string) => {
  const res = await authApi.post('/password/request-reset', { email });
  return res.data;
};

/**
 * ✅ Submit New Password [cite: 52, 53]
 */
export const resetPassword = async (token: string, newPassword: string) => {
  const res = await authApi.post('/password/reset', { token, newPassword });
  return res.data;
};

export default authApi;