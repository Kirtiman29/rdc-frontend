// src/api/apiClient.ts
import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from "axios";
import { createApiUrl, serviceApiUrls, serviceOrigins } from "./serviceConfig";

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

type IndustrialRequestConfig = InternalAxiosRequestConfig & {
  skipAuthToken?: boolean;
};


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
    (config: IndustrialRequestConfig) => {
      if (config.skipAuthToken) {
        return config;
      }

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

      const originalRequest = error.config as (IndustrialRequestConfig & { _retry?: boolean }) | undefined;

      if (!originalRequest) {
        return Promise.reject(error);
      }

      const hasBearerAuth = Boolean(
        originalRequest.headers?.Authorization || originalRequest.headers?.authorization
      );
      const isTwoFactorChallenge = error.response?.data?.status === "2FA_REQUIRED";

      if (error.response?.status === 401 && hasBearerAuth && !isTwoFactorChallenge && !originalRequest._retry) {

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
          const refreshResponse = await axios.post(serviceApiUrls.authRefresh, { refreshToken });

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
  baseURL: serviceApiUrls.admin
});

/* AUTH REQUIRED APIS */
export const userApi = axios.create({
  baseURL: serviceApiUrls.admin
});

export const cartApi = axios.create({
  baseURL: serviceApiUrls.cart
});

export const orderApi = axios.create({
  baseURL: serviceApiUrls.order
});

export const orderCouponApi = axios.create({
  baseURL: serviceApiUrls.orderCoupons
});

export const wishlistApi = axios.create({
  baseURL: serviceApiUrls.wishlist
});

export const paymentApi = axios.create({
  baseURL: serviceApiUrls.payment
});

export const publicSubscriptionApi = axios.create({
  baseURL: serviceApiUrls.publicSubscription
});

export const subscriptionApi = axios.create({
  baseURL: serviceApiUrls.subscription
});

/* APPLY INTERCEPTORS ONLY TO SECURE APIS */
[userApi, cartApi, orderApi, orderCouponApi, wishlistApi, paymentApi, subscriptionApi]
  .forEach(applyIndustrialInterceptors);

/* =========================================
   ASSET URL HELPER
========================================= */
export const getAssetUrl = (urlOrUuid?: string | null) => {

  if (!urlOrUuid || urlOrUuid === "null") {
    return "https://placehold.co/600x800?text=Design+Pending";
  }

  const baseDownload = createApiUrl(serviceOrigins.asset, "assets/download");
  const cleanedInput = urlOrUuid.trim();
  const pathLikeInput = (() => {
    try {
      return new URL(cleanedInput, "http://placeholder.local").pathname;
    } catch {
      return cleanedInput.split(/[?#]/)[0];
    }
  })();

  if (/\/api\/assets\/download\//i.test(pathLikeInput)) {
    const uuid = pathLikeInput.split("/").filter(Boolean).pop();
    return uuid ? `${baseDownload}/${uuid}` : baseDownload;
  }

  if (cleanedInput.includes("http")) {

    const parts = cleanedInput.split("/");
    const uuid = parts.filter(Boolean).pop();

    return `${baseDownload}/${uuid}`;

  }

  return `${baseDownload}/${cleanedInput.replace(/^\/+/, "")}`;
};

/* DEFAULT EXPORT */
export default userApi;
