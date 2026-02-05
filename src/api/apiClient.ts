// src/api/apiClient.ts
import axios, { type InternalAxiosRequestConfig } from 'axios';

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

export const removeToken = clearTokens;

/* =========================================
   TOKEN UTIL
========================================= */
export const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // Industrial Standard: proactive refresh 30s before actual expiry
    return payload.exp * 1000 < Date.now() + 30000;
  } catch {
    return true;
  }
};

/* =========================================
   SERVICE URLS
========================================= */
const AUTH_URL = 'http://localhost:8081';
const ADMIN_URL = 'http://localhost:8080';
const ASSET_URL = 'http://localhost:8090';
const CART_URL = 'http://localhost:8091';
const ORDER_URL = 'http://localhost:8095';
const WISHLIST_URL = 'http://localhost:8093';
const PAYMENT_URL = 'http://localhost:8092';

/* =========================================
   REFRESH LOCK & QUEUE (CRITICAL)
   Ensures only ONE refresh call is made even if 100 requests trigger it.
========================================= */
let isRefreshing = false;
let refreshQueue: ((token: string) => void)[] = [];

const processQueue = (token: string) => {
  refreshQueue.forEach(callback => callback(token));
  refreshQueue = [];
};

/* =========================================
   INTERCEPTOR LOGIC
========================================= */
export const applyIndustrialInterceptors = (instance: any) => {

  // 1. Request Interceptor: Proactive Refresh & Header Attachment
  instance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      let token = getToken();

      // 🔥 Proactive Auto-Refresh
      if (token && isTokenExpired(token)) {
        if (!isRefreshing) {
          isRefreshing = true;
          try {
            const refreshToken = getRefreshToken();
            const res = await axios.post(`${AUTH_URL}/auth/refresh`, { refreshToken });
            
            saveTokens(res.data.accessToken, res.data.refreshToken);
            processQueue(res.data.accessToken);
            token = res.data.accessToken;
          } catch (error) {
            clearTokens();
            if (window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
            return Promise.reject('SESSION_EXPIRED');
          } finally {
            isRefreshing = false;
          }
        } else {
          // If a refresh is already happening, wait in the queue
          await new Promise(resolve => {
            refreshQueue.push((newToken) => {
              token = newToken;
              resolve(true);
            });
          });
        }
      }

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    (error: any) => Promise.reject(error)
  );

  // 2. Response Interceptor: Reactive 401 Handling
  instance.interceptors.response.use(
    (response: any) => response,
    async (error: any) => {
      if (error.response?.status === 401) {
        // If we get a 401 even after the proactive check, the session is likely dead
        clearTokens();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }
  );
};

/* =========================================
   API INSTANCES
========================================= */
// ✅ FIXED: Re-adding publicApi to fix designApi.ts import errors
export const publicApi = axios.create({ baseURL: `${ADMIN_URL}/api` });
export const userApi = axios.create({ baseURL: `${ADMIN_URL}/api` });
export const cartApi = axios.create({ baseURL: `${CART_URL}/api/cart` });
export const orderApi = axios.create({ baseURL: `${ORDER_URL}/api/orders` });
export const wishlistApi = axios.create({ baseURL: `${WISHLIST_URL}/api/wishlist` });
export const paymentApi = axios.create({ baseURL: `${PAYMENT_URL}/api/payments` });

// Initialize Interceptors for all secured services
[publicApi, userApi, cartApi, orderApi, wishlistApi, paymentApi].forEach(applyIndustrialInterceptors);

/* =========================================
   ASSET HELPER
========================================= */
export const getAssetUrl = (uuid?: string | null) => {
  if (!uuid || uuid === 'null') {
    return 'https://placehold.co/600x800?text=Design+Pending';
  }
  return `${ASSET_URL}/api/assets/download/${uuid}`;
};

export default userApi;