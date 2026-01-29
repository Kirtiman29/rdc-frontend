import axios, { type InternalAxiosRequestConfig } from 'axios';

// ==========================================
// ✅ INDUSTRIAL HELPERS
// ==========================================
const TOKEN_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';

/**
 * ✅ NEW: Check if JWT is expired to trigger refresh BEFORE a request fails
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // Buffer of 10 seconds to account for network lag
    return payload.exp * 1000 < (Date.now() + 10000);
  } catch {
    return true;
  }
};

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

// ==========================================
// ✅ SERVICE URL CONFIGURATION
// ==========================================
const AUTH_URL = 'http://localhost:8081';    
const ADMIN_URL = 'http://localhost:8080';   
const ASSET_URL = 'http://localhost:8090';   
const CART_URL = 'http://localhost:8091';    
const ORDER_URL = 'http://localhost:8095';   
const WISHLIST_URL = 'http://localhost:8093'; 
const PAYMENT_URL = 'http://localhost:8092'; 

// ==========================================
// ✅ PUBLIC INSTANCE
// ==========================================
export const publicApi = axios.create({
    baseURL: `${ADMIN_URL}/api`, 
    headers: { 'Content-Type': 'application/json' },
});

publicApi.interceptors.request.use(config => {
    if (config.headers) {
        config.headers.Authorization = undefined; 
    }
    return config;
}, error => Promise.reject(error));

// ==========================================
// ✅ INTERCEPTOR FOR AUTHENTICATED SERVICES
// ==========================================
export const applyIndustrialInterceptors = (instance: any) => {
    instance.interceptors.request.use(
        (config: InternalAxiosRequestConfig) => {
            const token = getToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error: any) => Promise.reject(error)
    );

    instance.interceptors.response.use(
        (response: any) => response,
        async (error: any) => {
            const originalRequest = error.config;

            /**
             * ✅ AUTO-REFRESH LOGIC
             * 1. Trigger on 401 Unauthorized
             * 2. Ensure we aren't already retrying
             * 3. Ensure the failed request wasn't the refresh call itself (prevents infinite loops)
             */
            if (
                error.response?.status === 401 && 
                !originalRequest._retry && 
                !originalRequest.url.includes('/auth/refresh')
            ) {
                originalRequest._retry = true;

                try {
                    const refreshToken = getRefreshToken();
                    if (!refreshToken) throw new Error('No refresh token available');

                    // Call Auth Service Port 8081
                    const response = await axios.post(`${AUTH_URL}/auth/refresh`, { refreshToken });
                    
                    const { accessToken, refreshToken: newRefresh } = response.data;
                    
                    // Sync tokens in localStorage
                    saveTokens(accessToken, newRefresh);

                    // Update header and retry original request
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    return axios(originalRequest); 

                } catch (refreshError) {
                    // Refresh failed (e.g., refresh token expired) -> Force Logout
                    clearTokens();
                    window.location.href = '/login'; 
                    return Promise.reject(refreshError);
                }
            }
            return Promise.reject(error);
        }
    );
};

// ==========================================
// ✅ SERVICE INSTANCES
// ==========================================
export const userApi = axios.create({ baseURL: `${ADMIN_URL}/api` });
export const cartApi = axios.create({ baseURL: `${CART_URL}/api/cart` });
export const orderApi = axios.create({ baseURL: `${ORDER_URL}/api/orders` });
export const wishlistApi = axios.create({ baseURL: `${WISHLIST_URL}/api/wishlist` });
export const paymentApi = axios.create({ baseURL: 'http://localhost:8092/api/payments' });

// Initialize Interceptors
[userApi, cartApi, orderApi, wishlistApi, paymentApi].forEach(applyIndustrialInterceptors);

// Asset Helper
export const getAssetUrl = (uuid: string | null | undefined) => {
    if (!uuid || uuid === 'null' || uuid === '') {
        return 'https://placehold.co/600x800?text=Design+Pending';
    }
    return `${ASSET_URL}/api/assets/download/${uuid}`;
};

export default userApi;