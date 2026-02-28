import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

/* =========================================
   TOKEN STORAGE
========================================= */
const TOKEN_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_KEY);

export const saveTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
};

export const clearTokens = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
};

// ✅ Alias for legacy imports in Header.tsx
export const removeToken = clearTokens; 

/* =========================================
   TOKEN UTIL
========================================= */
export const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    return payload.exp * 1000 < Date.now() + 30000;
  } catch (e) {
    return true;
  }
};

/* =========================================
   PRODUCTION SERVICE URLS
========================================= */
const BASE_URL = import.meta.env.VITE_ADMIN_SERVICE_URL || ''; 
const AUTH_URL = import.meta.env.VITE_AUTH_SERVICE_URL || BASE_URL; 
const ASSET_URL = import.meta.env.VITE_ASSET_SERVICE_URL || BASE_URL;

/* =========================================
   REFRESH LOCK & QUEUE
========================================= */
let isRefreshing = false;
let refreshQueue: ((token: string) => void)[] = [];

const processQueue = (token: string) => {
  refreshQueue.forEach((callback) => callback(token));
  refreshQueue = [];
};

/* =========================================
   INTERCEPTOR LOGIC
========================================= */
export const applyIndustrialInterceptors = (instance: AxiosInstance) => {
  instance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      let token = getToken();

      if (token && isTokenExpired(token)) {
        if (!isRefreshing) {
          isRefreshing = true;
          try {
            const refreshToken = getRefreshToken();
            const refreshUrl = `${AUTH_URL}/api/auth/refresh`.replace(/([^:]\/)\/+/g, "$1");
            
            const res = await axios.post(refreshUrl, { refreshToken });
            const data = res.data?.data || res.data;
            const newAccess = data.accessToken;
            const newRefresh = data.refreshToken;

            if (newAccess && newRefresh) {
              saveTokens(newAccess, newRefresh);
              processQueue(newAccess);
              token = newAccess;
            } else {
              throw new Error("Session Invalid");
            }
          } catch (err) {
            clearTokens();
            if (window.location.pathname !== '/login') window.location.href = '/login';
            return Promise.reject(err);
          } finally {
            isRefreshing = false;
          }
        } else {
          return new Promise((resolve) => {
            refreshQueue.push((newToken: string) => {
              config.headers.Authorization = `Bearer ${newToken}`;
              resolve(config);
            });
          });
        }
      }

      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    },
    (error) => Promise.reject(error)
  );

  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      if (response.data && response.data.data !== undefined) return response.data.data;
      return response.data;
    },
    async (error) => {
      if (error.response?.status === 401) {
        clearTokens();
        if (window.location.pathname !== '/login') window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );
};

/* =========================================
   API INSTANCES
========================================= */
const createUrl = (path: string) => `${BASE_URL}/api${path}/`.replace(/([^:]\/)\/+/g, "$1");

export const publicApi = axios.create({ baseURL: createUrl('') });
export const userApi = axios.create({ baseURL: createUrl('') });
export const cartApi = axios.create({ baseURL: createUrl('/cart') });
export const orderApi = axios.create({ baseURL: createUrl('/orders') });
export const wishlistApi = axios.create({ baseURL: createUrl('/wishlist') });
export const paymentApi = axios.create({ baseURL: createUrl('/payments') });

[publicApi, userApi, cartApi, orderApi, wishlistApi, paymentApi].forEach(applyIndustrialInterceptors);

/* =========================================
   ASSET UTILS
========================================= */
export const getAssetUrl = (urlOrUuid?: string | null) => {
  if (!urlOrUuid || urlOrUuid === 'null' || urlOrUuid === '') {
    return 'https://placehold.co/600x800?text=Design+Pending';
  }
  const baseDownloadUrl = `${ASSET_URL}/api/assets/download/`.replace(/([^:]\/)\/+/g, "$1");
  if (urlOrUuid.includes('localhost') || urlOrUuid.includes('http')) {
    const parts = urlOrUuid.split('/');
    const uuid = parts.filter(Boolean).pop();
    return `${baseDownloadUrl}${uuid}`;
  }
  return `${baseDownloadUrl}${urlOrUuid}`;
};

export default userApi;