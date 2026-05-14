import { useCallback, useEffect, useMemo, useState } from "react";

import { getToken } from "@/api/apiClient";
import {
  getMyNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from "@/api/notificationApi";
import { useToast } from "@/hooks/use-toast";

const DEFAULT_POLL_INTERVAL_MS = 45000;

export const NOTIFICATIONS_UPDATED_EVENT = "notifications-updated";

type ApiErrorLike = {
  response?: {
    status?: number;
  };
};

type LoadOptions = {
  silent?: boolean;
};

type UseNotificationsOptions = {
  enabled?: boolean;
  autoFetchList?: boolean;
  unreadPollingMs?: number;
};

const getApiStatus = (error: unknown) => (error as ApiErrorLike)?.response?.status;

const getUnreadCountFromList = (items: AppNotification[]) =>
  items.reduce((total, notification) => total + (notification.read ? 0 : 1), 0);

export const emitNotificationsUpdated = () => {
  window.dispatchEvent(new Event(NOTIFICATIONS_UPDATED_EVENT));
};

export const useNotifications = ({
  enabled = true,
  autoFetchList = false,
  unreadPollingMs = DEFAULT_POLL_INTERVAL_MS,
}: UseNotificationsOptions = {}) => {
  const { toast } = useToast();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingUnreadCount, setLoadingUnreadCount] = useState(false);
  const [markingAllAsRead, setMarkingAllAsRead] = useState(false);

  const isEnabled = enabled && Boolean(getToken());

  const loadUnreadCount = useCallback(
    async ({ silent = false }: LoadOptions = {}) => {
      if (!isEnabled) {
        setUnreadCount(0);
        return 0;
      }

      setLoadingUnreadCount(true);

      try {
        const response = await getUnreadCount();
        const nextCount = typeof response?.count === "number" ? response.count : 0;
        setUnreadCount(nextCount);
        return nextCount;
      } catch (error) {
        if (!silent) {
          toast({
            variant: "destructive",
            title: "Unable to load notifications",
            description: "Please try again in a moment.",
          });
        }
        return 0;
      } finally {
        setLoadingUnreadCount(false);
      }
    },
    [isEnabled, toast],
  );

  const loadNotifications = useCallback(
    async ({ silent = false }: LoadOptions = {}) => {
      if (!isEnabled) {
        setNotifications([]);
        setUnreadCount(0);
        return [];
      }

      setLoadingList(true);

      try {
        const response = await getMyNotifications();
        const items = Array.isArray(response) ? response : [];
        setNotifications(items);
        setUnreadCount(getUnreadCountFromList(items));
        return items;
      } catch (error) {
        if (!silent) {
          toast({
            variant: "destructive",
            title: "Unable to load notifications",
            description: "Please try again in a moment.",
          });
        }
        return [];
      } finally {
        setLoadingList(false);
      }
    },
    [isEnabled, toast],
  );

  const markAsRead = useCallback(
    async (notification: AppNotification) => {
      if (!isEnabled || notification.read) {
        return true;
      }

      const previousNotifications = notifications;
      const previousUnreadCount = unreadCount;

      setNotifications((current) =>
        current.map((item) => (item.id === notification.id ? { ...item, read: true } : item)),
      );
      setUnreadCount((current) => Math.max(0, current - 1));

      try {
        await markNotificationRead(notification.id);
        emitNotificationsUpdated();
        return true;
      } catch (error) {
        setNotifications(previousNotifications);
        setUnreadCount(previousUnreadCount);

        toast({
          variant: "destructive",
          title: getApiStatus(error) === 404 ? "Notification not found" : "Unable to update notification",
          description:
            getApiStatus(error) === 404
              ? "This notification is no longer available for your account."
              : "Please try again in a moment.",
        });

        return false;
      }
    },
    [isEnabled, notifications, toast, unreadCount],
  );

  const markEveryNotificationRead = useCallback(async () => {
    if (!isEnabled || unreadCount === 0) {
      return true;
    }

    const previousNotifications = notifications;
    const previousUnreadCount = unreadCount;

    setMarkingAllAsRead(true);
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
    setUnreadCount(0);

    try {
      await markAllNotificationsRead();
      emitNotificationsUpdated();
      return true;
    } catch (error) {
      setNotifications(previousNotifications);
      setUnreadCount(previousUnreadCount);
      toast({
        variant: "destructive",
        title: "Unable to update notifications",
        description: "Please try again in a moment.",
      });
      return false;
    } finally {
      setMarkingAllAsRead(false);
    }
  }, [isEnabled, notifications, toast, unreadCount]);

  useEffect(() => {
    if (!isEnabled) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    void loadUnreadCount({ silent: true });

    if (autoFetchList) {
      void loadNotifications({ silent: true });
    }
  }, [autoFetchList, isEnabled, loadNotifications, loadUnreadCount]);

  useEffect(() => {
    if (!isEnabled || unreadPollingMs <= 0) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void loadUnreadCount({ silent: true });
    }, unreadPollingMs);

    return () => window.clearInterval(intervalId);
  }, [isEnabled, loadUnreadCount, unreadPollingMs]);

  useEffect(() => {
    if (!isEnabled) {
      return;
    }

    const handleRefresh = () => {
      void loadUnreadCount({ silent: true });

      if (autoFetchList) {
        void loadNotifications({ silent: true });
      }
    };

    const handleFocus = () => {
      void loadUnreadCount({ silent: true });
    };

    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, handleRefresh);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, handleRefresh);
      window.removeEventListener("focus", handleFocus);
    };
  }, [autoFetchList, isEnabled, loadNotifications, loadUnreadCount]);

  return useMemo(
    () => ({
      notifications,
      unreadCount,
      loadingList,
      loadingUnreadCount,
      markingAllAsRead,
      loadNotifications,
      loadUnreadCount,
      markAsRead,
      markEveryNotificationRead,
      setNotifications,
      setUnreadCount,
    }),
    [
      loadingList,
      loadingUnreadCount,
      loadNotifications,
      loadUnreadCount,
      markAsRead,
      markEveryNotificationRead,
      markingAllAsRead,
      notifications,
      unreadCount,
    ],
  );
};
