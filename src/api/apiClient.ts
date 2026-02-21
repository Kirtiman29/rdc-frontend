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
    // Proactive refresh 30s before actual expiry
    return payload.exp * 1000 < Date.now() + 30000;
  } catch {
    return true;
  }
};

/* =========================================
   PRODUCTION SERVICE URLS
========================================= */
const AUTH_URL = import.meta.env.VITE_AUTH_SERVICE_URL;
const ADMIN_URL = import.meta.env.VITE_ADMIN_SERVICE_URL;
const ASSET_URL = import.meta.env.VITE_ASSET_SERVICE_URL;
const CART_URL = import.meta.env.VITE_CART_SERVICE_URL;
const ORDER_URL = import.meta.env.VITE_ORDER_SERVICE_URL;
const WISHLIST_URL = import.meta.env.VITE_WISHLIST_SERVICE_URL;
const PAYMENT_URL = import.meta.env.VITE_PAYMENT_SERVICE_URL;

/* =========================================
   REFRESH LOCK & QUEUE
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

  instance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      let token = getToken();

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

  instance.interceptors.response.use(
    (response: any) => response.data, 
    async (error: any) => {
      if (error.response?.status === 401) {
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
export const publicApi = axios.create({ baseURL: `${ADMIN_URL}/api` });
export const userApi = axios.create({ baseURL: `${ADMIN_URL}/api` });
export const cartApi = axios.create({ baseURL: `${CART_URL}/api/cart` });
export const orderApi = axios.create({ baseURL: `${ORDER_URL}/api/orders` });
export const wishlistApi = axios.create({ baseURL: `${WISHLIST_URL}/api/wishlist` });
export const paymentApi = axios.create({ baseURL: `${PAYMENT_URL}/api/payments` });

[publicApi, userApi, cartApi, orderApi, wishlistApi, paymentApi].forEach(applyIndustrialInterceptors);

export const getAssetUrl = (urlOrUuid?: string | null) => {
  if (!urlOrUuid || urlOrUuid === 'null' || urlOrUuid === '') {
    return 'https://placehold.co/600x800?text=Design+Pending';
  }

  if (urlOrUuid.includes('localhost')) {
     const parts = urlOrUuid.split('/');
     const uuid = parts[parts.length - 1] || parts[parts.length - 2];
     return `${ASSET_URL}/api/assets/download/${uuid}`;
  }

  // 2. Resolve Relative Path or raw UUIDs
  if (!urlOrUuid.startsWith('http')) {
    return `${ASSET_URL}/api/assets/download/${urlOrUuid}`;
  }

  // 3. Return as-is if already a valid external HTTP/HTTPS URL
  return urlOrUuid;
};

export default userApi;