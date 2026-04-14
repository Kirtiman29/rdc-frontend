// src/api/apiClient.ts
import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from "axios";

/* =========================================
   INDIAN STATES
========================================= */
export const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa",
  "Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala",
  "Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland",
  "Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura",
  "Uttar Pradesh","Uttarakhand","West Bengal","Andaman and Nicobar Islands",
  "Chandigarh","Dadra and Nagar Haveli and Daman and Diu","Delhi",
  "Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry"
];

/* =========================================
   TOKEN STORAGE
========================================= */
const TOKEN_KEY = "accessToken";
const REFRESH_KEY = "refreshToken";
export const AUTH_STATE_CHANGE_EVENT = "auth-state-change";


export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_KEY);

const notifyAuthStateChange = () => {
  window.dispatchEvent(new Event(AUTH_STATE_CHANGE_EVENT));
};

export const saveTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
  notifyAuthStateChange();
};

export const clearTokens = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  notifyAuthStateChange();
};

/* =========================================
   SERVICE URLS
========================================= */
const BASE_DOMAIN = import.meta.env.VITE_BASE_URL || "https://ruchitadesigncompany.in";

const AUTH_URL =
  import.meta.env.VITE_AUTH_SERVICE_URL || BASE_DOMAIN;

const AUTH_CONTEXT_URL = `${AUTH_URL.replace(/\/$/, "")}/auth`;

const ASSET_URL =
  import.meta.env.VITE_ASSET_SERVICE_URL || BASE_DOMAIN;

const CART_URL =
  import.meta.env.VITE_CART_SERVICE_URL || BASE_DOMAIN;

const ORDER_URL =
  import.meta.env.VITE_ORDER_SERVICE_URL || BASE_DOMAIN;

const WISHLIST_URL =
  import.meta.env.VITE_WISHLIST_SERVICE_URL || BASE_DOMAIN;

const PAYMENT_URL =
  import.meta.env.VITE_PAYMENT_SERVICE_URL || BASE_DOMAIN;

const ADMIN_URL =
  import.meta.env.VITE_ADMIN_SERVICE_URL || BASE_DOMAIN;

/* =========================================
   URL BUILDER
========================================= */
const createUrl = (baseUrl: string, path = "") => {
  const cleanBase = baseUrl.replace(/\/$/, "");
  const cleanPath = path ? (path.startsWith("/") ? path : `/${path}`) : "/";
  return `${cleanBase}/api${cleanPath}`;
};

/* =========================================
   REFRESH TOKEN STATE
========================================= */
let isRefreshing = false;

let refreshQueue: ((token: string | null) => void)[] = [];

const processQueue = (token: string | null) => {
  refreshQueue.forEach(cb => cb(token));
  refreshQueue = [];
};

/* =========================================
   INTERCEPTORS
========================================= */
export const applyIndustrialInterceptors = (instance: AxiosInstance) => {

  /* REQUEST INTERCEPTOR */
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {

      const token = getToken();

      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    error => Promise.reject(error)
  );

  /* RESPONSE INTERCEPTOR */
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      return response.data;
    },

    async error => {

      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      if (error.response?.status === 401 && !originalRequest._retry) {

        if (isRefreshing) {

          return new Promise((resolve, reject) => {

            refreshQueue.push((token: string | null) => {

              if (token && originalRequest.headers) {

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

          if (!refreshToken) {
            throw new Error("No refresh token");
          }

          /* 🔑 IMPORTANT: use plain axios (no interceptor) */
          const refreshResponse = await axios.post(`${AUTH_CONTEXT_URL}/refresh`, { refreshToken });

          const data = refreshResponse.data?.data || refreshResponse.data;

          const { accessToken, refreshToken: newRefresh } = data;

          if (!accessToken || !newRefresh) {
            throw new Error("Invalid refresh response");
          }

          saveTokens(accessToken, newRefresh);

          processQueue(accessToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }

          return instance(originalRequest);

        } catch (err) {

          processQueue(null);
          clearTokens();

          if (window.location.pathname !== "/login") {
            window.location.href = "/login";
          }

          return Promise.reject(err);

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

/* PUBLIC API (NO TOKEN) */
export const publicApi = axios.create({
  baseURL: createUrl(ADMIN_URL)
});

/* AUTH REQUIRED APIS */
export const userApi = axios.create({
  baseURL: createUrl(ADMIN_URL)
});

export const cartApi = axios.create({
  baseURL: createUrl(CART_URL, "/cart")
});

export const orderApi = axios.create({
  baseURL: createUrl(ORDER_URL, "/orders")
});

export const wishlistApi = axios.create({
  baseURL: createUrl(WISHLIST_URL, "/wishlist")
});

export const paymentApi = axios.create({
  baseURL: createUrl(PAYMENT_URL, "/payments")
});

/* APPLY INTERCEPTORS ONLY TO SECURE APIS */
[userApi, cartApi, orderApi, wishlistApi, paymentApi]
  .forEach(applyIndustrialInterceptors);

/* =========================================
   ASSET URL HELPER
========================================= */
export const getAssetUrl = (urlOrUuid?: string | null) => {

  if (!urlOrUuid || urlOrUuid === "null") {
    return "https://placehold.co/600x800?text=Design+Pending";
  }

  const baseDownload = createUrl(ASSET_URL, "/assets/download/");

  if (urlOrUuid.includes("http")) {

    const parts = urlOrUuid.split("/");
    const uuid = parts.filter(Boolean).pop();

    return `${baseDownload}${uuid}`;

  }

  return `${baseDownload}${urlOrUuid}`;
};

/* DEFAULT EXPORT */
export default userApi;
