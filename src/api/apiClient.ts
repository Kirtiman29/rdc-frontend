// apiClient.ts
import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

/* =========================================
   INDIAN STATES CONSTANT
========================================= */
export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", 
  "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", 
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", 
  "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", 
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", 
  "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", 
  "Ladakh", "Lakshadweep", "Puducherry"
];

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

/* =========================================
   PRODUCTION SERVICE URLS
========================================= */
const BASE_DOMAIN = 'https://ruchitadesigncompany.in';
const AUTH_URL     = import.meta.env.VITE_AUTH_SERVICE_URL     || BASE_DOMAIN;
const ASSET_URL    = import.meta.env.VITE_ASSET_SERVICE_URL    || BASE_DOMAIN;
const CART_URL     = import.meta.env.VITE_CART_SERVICE_URL     || BASE_DOMAIN;
const ORDER_URL    = import.meta.env.VITE_ORDER_SERVICE_URL    || BASE_DOMAIN;
const WISHLIST_URL = import.meta.env.VITE_WISHLIST_SERVICE_URL || BASE_DOMAIN;
const PAYMENT_URL  = import.meta.env.VITE_PAYMENT_SERVICE_URL  || BASE_DOMAIN;
const ADMIN_URL    = import.meta.env.VITE_ADMIN_SERVICE_URL    || BASE_DOMAIN;

/* =========================================
   REFRESH STATE MANAGEMENT
========================================= */
let isRefreshing = false;
let refreshQueue: ((token: string | null) => void)[] = [];

const processQueue = (token: string | null) => {
  refreshQueue.forEach((callback) => callback(token));
  refreshQueue = [];
};

/* =========================================
   INTERCEPTOR LOGIC (Reactive Pattern)
========================================= */
export const applyIndustrialInterceptors = (instance: AxiosInstance) => {
  
  // 1. Request Interceptor: Simply attach the current token
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // 2. Response Interceptor: Handle Unwrapping and Reactive Refresh
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      // ✅ FIX 6: Robust unwrap logic
      return response.data?.data ?? response.data;
    },
    async (error) => {
      const originalRequest = error.config;

      // ✅ FIX 1 & 4: Trigger Refresh on 401 and protect with _retry guard
      if (error.response?.status === 401 && !originalRequest._retry) {
        
        if (isRefreshing) {
          // If a refresh is already in progress, queue this request
          return new Promise((resolve, reject) => {
            refreshQueue.push((token: string | null) => {
              if (token) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                resolve(instance(originalRequest));
              } else {
                reject(error);
              }
            });
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const refreshToken = getRefreshToken();

          // ✅ FIX 2: Null check for refresh token
          if (!refreshToken) {
            throw new Error("No refresh token available");
          }

          const refreshUrl = `${AUTH_URL}/auth/refresh`.replace(/([^:]\/)\/+/g, "$1");
          
          // Use a clean axios instance for refresh to avoid interceptor loops
          const res = await axios.post(refreshUrl, { refreshToken }, {
            headers: { "Content-Type": "application/json" }
          });

          const data = res.data?.data || res.data;
          const { accessToken, refreshToken: newRefresh } = data;

          if (accessToken && newRefresh) {
            saveTokens(accessToken, newRefresh);
            processQueue(accessToken);
            
            // Retry the original request with the new token
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return instance(originalRequest);
          } else {
            throw new Error("Invalid token response");
          }
        } catch (refreshError) {
          // ✅ FIX 3: Clear queue on failure to prevent memory leaks
          processQueue(null);
          clearTokens();
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );
};

/* =========================================
   API INSTANCES
========================================= */
const createUrl = (baseUrl: string, path: string) => 
  `${baseUrl.replace(/\/$/, '')}/api${path}`.replace(/\/+/g, "/").replace("https:/", "https://").replace("http:/", "http://");

export const publicApi   = axios.create({ baseURL: createUrl(ADMIN_URL, '') });
export const userApi     = axios.create({ baseURL: createUrl(ADMIN_URL, '') });
export const cartApi     = axios.create({ baseURL: createUrl(CART_URL, '/cart') });
export const orderApi    = axios.create({ baseURL: createUrl(ORDER_URL, '/orders') });
export const wishlistApi = axios.create({ baseURL: createUrl(WISHLIST_URL, '/wishlist') });
export const paymentApi  = axios.create({ baseURL: createUrl(PAYMENT_URL, '/payments') });

const allInstances = [publicApi, userApi, cartApi, orderApi, wishlistApi, paymentApi];
allInstances.forEach(applyIndustrialInterceptors);

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