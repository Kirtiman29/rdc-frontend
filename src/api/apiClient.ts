import axios, { type InternalAxiosRequestConfig } from 'axios';

// ✅ Industrial Sync: Standardized keys for session tracking
const TOKEN_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';

const AUTH_URL = 'http://localhost:8081';    
const ADMIN_URL = 'http://localhost:8080';   
const ASSET_URL = 'http://localhost:8090';   
const CART_URL = 'http://localhost:8091';    
const ORDER_URL = 'http://localhost:8095';   
const WISHLIST_URL = 'http://localhost:8093'; 
const PAYMENT_URL = 'http://localhost:8092'; 

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
// ✅ FIXED PUBLIC INSTANCE
// Base URL set to /api to allow direct access to /public and /categories
// ==========================================
export const publicApi = axios.create({
    baseURL: `${ADMIN_URL}/api`, 
    headers: { 'Content-Type': 'application/json' },
});

// Explicitly strip headers to prevent 401s on guest routes
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
            if (error.response?.status === 401 && !originalRequest._retry) {
                originalRequest._retry = true;
                try {
                    const refreshToken = getRefreshToken();
                    if (!refreshToken) throw new Error('No refresh token');
                    const response = await axios.post(`${AUTH_URL}/auth/refresh`, { refreshToken });
                    const { accessToken, refreshToken: newRefresh } = response.data;
                    saveTokens(accessToken, newRefresh);
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    return axios(originalRequest); 
                } catch (refreshError) {
                    clearTokens();
                    window.location.href = '/login'; 
                    return Promise.reject(refreshError);
                }
            }
            return Promise.reject(error);
        }
    );
};

export const userApi = axios.create({ baseURL: `${ADMIN_URL}/api` });
export const cartApi = axios.create({ baseURL: `${CART_URL}/api/cart` });
export const orderApi = axios.create({ baseURL: `${ORDER_URL}/api/orders` });
export const wishlistApi = axios.create({ baseURL: `${WISHLIST_URL}/api/wishlist` });
export const paymentApi = axios.create({ baseURL: `${PAYMENT_URL}/api/payments` });

[userApi, cartApi, orderApi, wishlistApi, paymentApi].forEach(applyIndustrialInterceptors);

export const getAssetUrl = (uuid: string | null | undefined) => {
    if (!uuid || uuid === 'null' || uuid === '') {
        return 'https://placehold.co/600x800?text=Design+Pending';
    }
    return `${ASSET_URL}/api/assets/download/${uuid}`;
};

export default userApi;