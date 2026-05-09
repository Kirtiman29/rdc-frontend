const DEFAULT_BASE_URL = "https://ruchitadesigncompany.in";

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const resolveServiceOrigin = (envValue?: string) =>
  trimTrailingSlash(envValue || import.meta.env.VITE_BASE_URL || DEFAULT_BASE_URL);

export const serviceOrigins = {
  admin: resolveServiceOrigin(import.meta.env.VITE_ADMIN_SERVICE_URL),
  ai: resolveServiceOrigin(import.meta.env.VITE_AI_SERVICE_URL),
  asset: resolveServiceOrigin(import.meta.env.VITE_ASSET_SERVICE_URL),
  auth: resolveServiceOrigin(import.meta.env.VITE_AUTH_SERVICE_URL),
  cart: resolveServiceOrigin(import.meta.env.VITE_CART_SERVICE_URL),
  order: resolveServiceOrigin(import.meta.env.VITE_ORDER_SERVICE_URL),
  payment: resolveServiceOrigin(import.meta.env.VITE_PAYMENT_SERVICE_URL),
  subscription: resolveServiceOrigin(import.meta.env.VITE_SUBSCRIPTION_SERVICE_URL),
  wishlist: resolveServiceOrigin(import.meta.env.VITE_WISHLIST_SERVICE_URL),
} as const;

export const createApiUrl = (serviceOrigin: string, path = "") => {
  const cleanPath = path ? `/${path.replace(/^\/+/, "")}` : "";
  return `${trimTrailingSlash(serviceOrigin)}/api${cleanPath}`;
};

export const serviceApiUrls = {
  admin: createApiUrl(serviceOrigins.admin),
  auth: createApiUrl(serviceOrigins.auth, "auth"),
  authRefresh: createApiUrl(serviceOrigins.auth, "auth/refresh"),
  cart: createApiUrl(serviceOrigins.cart, "cart"),
  order: createApiUrl(serviceOrigins.order, "orders"),
  orderCoupons: createApiUrl(serviceOrigins.order, "coupons"),
  payment: createApiUrl(serviceOrigins.payment, "payments"),
  subscription: createApiUrl(serviceOrigins.subscription, "subscriptions"),
  publicSubscription: createApiUrl(serviceOrigins.subscription, "public/subscriptions"),
  userProfile: createApiUrl(serviceOrigins.auth, "users"),
  wishlist: createApiUrl(serviceOrigins.wishlist, "wishlist"),
} as const;
