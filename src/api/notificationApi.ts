import { userApi } from "./apiClient";

export type NotificationType =
  | "ORDER_PURCHASE"
  | "PAYMENT_SUCCESS"
  | "DESIGN_DOWNLOAD"
  | "NEW_COLLECTION"
  | "SPECIAL_OFFER"
  | "CREDIT_LOW"
  | "DESIGN_LIMIT_LOW"
  | "SUBSCRIPTION_ACTIVATED"
  | "SUBSCRIPTION_EXPIRING"
  | "SUBSCRIPTION_EXPIRED"
  | "SYSTEM";

export interface AppNotification {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  targetUrl?: string | null;
  read: boolean;
  global: boolean;
  createdAt: string;
  expiresAt?: string | null;
}

export interface UnreadCountResponse {
  count: number;
}

export const getMyNotifications = async (): Promise<AppNotification[]> => {
  const response = await userApi.get<AppNotification[], AppNotification[]>("/notifications/my");
  return Array.isArray(response) ? response : [];
};

export const getUnreadCount = async (): Promise<UnreadCountResponse> => {
  return await userApi.get<UnreadCountResponse, UnreadCountResponse>("/notifications/unread-count");
};

export const markNotificationRead = async (id: number): Promise<void> => {
  await userApi.patch(`/notifications/${id}/read`);
};

export const markAllNotificationsRead = async (): Promise<void> => {
  await userApi.patch("/notifications/read-all");
};

export const getUnreadCountValue = async (): Promise<number> => {
  try {
    const response = await getUnreadCount();
    return typeof response?.count === "number" ? response.count : 0;
  } catch (error) {
    console.error("Notification API Error (getUnreadCountValue):", error);
    return 0;
  }
};
