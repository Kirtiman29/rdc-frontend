import axios from 'axios';
import { applyIndustrialInterceptors, clearTokens } from './apiClient';

const AUTH_BASE_URL = `${import.meta.env.VITE_AUTH_SERVICE_URL}/auth`.replace(/([^:]\/)\/+/g, '$1');

export const authApi = axios.create({
  baseURL: AUTH_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

export const profileApi = axios.create({
  baseURL: AUTH_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

applyIndustrialInterceptors(authApi);
applyIndustrialInterceptors(profileApi);

export const registerUser = async (data: { email: string; password: string; displayName: string }) => {
  return await authApi.post('/signup', data);
};

export const loginUser = async (email: string, password: string) => {
  return await authApi.post('/login', { email, password });
};

export const requestUserOtp = async (email: string) => {
  return await authApi.post('/login/otp/request', { email });
};

export const verifyUserOtp = async (email: string, otp: string) => {
  return await authApi.post('/login/otp/verify', { email, otp });
};

export const loginWithGoogle = async (idToken: string) => {
  return await authApi.post('/google', { idToken });
};

export const getProfile = async () => {
  return await profileApi.get('/me');
};

export const logoutUser = () => {
  clearTokens();
  window.location.href = '/login';
};

export const requestPasswordReset = async (email: string) => {
  return await authApi.post('/password/request-reset', { email });
};

export const resetPassword = async (token: string, newPassword: string) => {
  return await authApi.post('/password/reset', { token, newPassword });
};

export default authApi;
