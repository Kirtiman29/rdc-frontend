import axios from 'axios';
import { applyIndustrialInterceptors, clearTokens } from './apiClient';

const AUTH_SERVICE_URL = (import.meta.env.VITE_AUTH_SERVICE_URL || import.meta.env.VITE_BASE_URL || 'https://ruchitadesigncompany.in').replace(/\/$/, '');
const AUTH_BASE_URL = `${AUTH_SERVICE_URL}/api/auth`.replace(/([^:]\/)\/+/g, '$1');
const USER_BASE_URL = `${AUTH_SERVICE_URL}/api/users`.replace(/([^:]\/)\/+/g, '$1');

export interface UserSubscription {
  planName: string;
  status: string;
  expiresAt: number | null;
}

export interface UserCredits {
  totalCredits: number;
  usedCredits: number;
}

export interface UserProfile {
  id: number | string;
  email: string;
  displayName?: string;
  name?: string;
  role?: string;
  verified?: boolean;
  twoFactorEnabled?: boolean;
  subscription?: UserSubscription | null;
  credits?: UserCredits | null;
}

export interface UpdateUserProfilePayload {
  displayName?: string;
  email?: string;
  oldPassword?: string;
  newPassword?: string;
}

export interface TwoFactorSetupResponse {
  secret: string;
  qrCodeImageUri: string;
  provisioningUri?: string;
}

export interface AuthTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export const authApi = axios.create({
  baseURL: AUTH_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

export const profileApi = axios.create({
  baseURL: USER_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

applyIndustrialInterceptors(authApi);
applyIndustrialInterceptors(profileApi);

export const registerUser = async (data: { email: string; password: string; displayName: string }) => {
  return await authApi.post('/signup', data);
};

export const loginUser = async (email: string, password: string, twoFactorCode?: string): Promise<AuthTokenResponse> => {
  return await authApi.post<AuthTokenResponse, AuthTokenResponse>('/login', {
    email,
    password,
    ...(twoFactorCode ? { twoFactorCode } : {}),
  });
};

export const requestUserOtp = async (email: string) => {
  return await authApi.post('/login/otp/request', { email });
};

export const verifyUserOtp = async (email: string, otp: string): Promise<AuthTokenResponse> => {
  return await authApi.post<AuthTokenResponse, AuthTokenResponse>('/login/otp/verify', { email, otp });
};

export const loginWithGoogle = async (idToken: string): Promise<AuthTokenResponse> => {
  return await authApi.post<AuthTokenResponse, AuthTokenResponse>('/google', { idToken });
};

export const getProfile = async (): Promise<UserProfile> => {
  return await profileApi.get<UserProfile, UserProfile>('/profile');
};

export const updateProfile = async (data: UpdateUserProfilePayload): Promise<UserProfile> => {
  return await profileApi.put<UserProfile, UserProfile>('/profile', data);
};

export const setupTwoFactor = async (): Promise<TwoFactorSetupResponse> => {
  return await profileApi.post<TwoFactorSetupResponse, TwoFactorSetupResponse>('/2fa/setup');
};

export const verifyTwoFactor = async (code: string): Promise<{ valid: boolean }> => {
  return await profileApi.post<{ valid: boolean }, { valid: boolean }>('/2fa/verify', { code });
};

export const disableTwoFactor = async (code: string): Promise<{ message?: string; code?: string }> => {
  return await profileApi.post<{ message?: string; code?: string }, { message?: string; code?: string }>('/2fa/disable', { code });
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
