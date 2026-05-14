import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, Loader2 } from "lucide-react";

import type { AppNotification } from "@/api/notificationApi";
import NotificationListItem from "@/components/notifications/NotificationListItem";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/hooks/useNotifications";

const MAX_DROPDOWN_ITEMS = 6;

type NotificationBellProps = {
  enabled: boolean;
};

const NotificationBell = ({ enabled }: NotificationBellProps) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [activeNotificationId, setActiveNotificationId] = useState<number | null>(null);

  const {
    notifications,
    unreadCount,
    loadingList,
    loadingUnreadCount,
    markingAllAsRead,
    loadNotifications,
    markAsRead,
    markEveryNotificationRead,
  } = useNotifications({
    enabled,
    autoFetchList: false,
  });

  const previewNotifications = useMemo(
    () => notifications.slice(0, MAX_DROPDOWN_ITEMS),
    [notifications],
  );

  const unreadBadge = unreadCount > 99 ? "99+" : unreadCount;

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (nextOpen) {
      void loadNotifications({ silent: true });
    }
  };

  const handleNotificationClick = async (notification: AppNotification) => {
    setActiveNotificationId(notification.id);

    try {
      const success = await markAsRead(notification);

      if (success && notification.targetUrl) {
        setOpen(false);
        navigate(notification.targetUrl);
      }
    } finally {
      setActiveNotificationId(null);
    }
  };

  const handleMarkAllRead = async () => {
    await markEveryNotificationRead();
  };

  if (!enabled) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative p-2 text-[#2A2623]/70 transition-all hover:scale-110 hover:text-[#2A2623] active:scale-95"
          aria-label="Open notifications"
        >
          <Bell className="h-[18px] w-[18px] stroke-[1.5px]" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ba1b1c] px-1 text-[9px] font-bold text-white shadow-lg">
              {unreadBadge}
            </span>
          )}
          {loadingUnreadCount && unreadCount === 0 && (
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-[#2A2623]/20" />
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" sideOffset={12} className="w-[360px] border-[#2A2623]/10 bg-white p-0 shadow-[0_25px_80px_rgba(15,23,42,0.18)]">
        <div className="border-b border-[#2A2623]/8 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#2A2623]/45">Notifications</p>
              <h2 className="mt-1 text-lg font-semibold text-[#2A2623]">Inbox</h2>
            </div>

            {unreadCount > 0 && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => void handleMarkAllRead()}
                disabled={markingAllAsRead}
                className="h-auto px-0 py-0 text-[10px] font-bold uppercase tracking-[0.18em] text-[#ba1b1c] hover:bg-transparent hover:text-[#8e1415]"
              >
                {markingAllAsRead ? "Updating..." : "Mark all read"}
              </Button>
            )}
          </div>
        </div>

        {loadingList ? (
          <div className="flex h-56 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-[#2A2623]/60" />
          </div>
        ) : previewNotifications.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm font-medium text-[#2A2623]">No notifications yet</p>
            <p className="mt-2 text-sm text-[#2A2623]/55">We&apos;ll show updates about orders, offers, and subscriptions here.</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[420px] px-3 py-3">
            <div className="space-y-3">
              {previewNotifications.map((notification) => (
                <NotificationListItem
                  key={notification.id}
                  notification={notification}
                  compact
                  busy={activeNotificationId === notification.id}
                  onClick={handleNotificationClick}
                />
              ))}
            </div>
          </ScrollArea>
        )}

        <div className="flex items-center justify-between border-t border-[#2A2623]/8 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#2A2623]/45">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#2A2623] transition-colors hover:text-[#ba1b1c]"
          >
            View all
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
