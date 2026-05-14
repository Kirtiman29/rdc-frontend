import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Loader2 } from "lucide-react";

import type { AppNotification } from "@/api/notificationApi";
import NotificationListItem from "@/components/notifications/NotificationListItem";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

type FilterKey = "all" | "unread" | "read";

const filterOptions: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "read", label: "Read" },
];

const Notifications = () => {
  const navigate = useNavigate();
  const [activeNotificationId, setActiveNotificationId] = useState<number | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");

  const {
    notifications,
    unreadCount,
    loadingList,
    markingAllAsRead,
    markAsRead,
    markEveryNotificationRead,
  } = useNotifications({
    enabled: true,
    autoFetchList: true,
    unreadPollingMs: 0,
  });

  const filteredNotifications = useMemo(() => {
    switch (filter) {
      case "unread":
        return notifications.filter((notification) => !notification.read);
      case "read":
        return notifications.filter((notification) => notification.read);
      default:
        return notifications;
    }
  }, [filter, notifications]);

  const handleNotificationClick = async (notification: AppNotification) => {
    setActiveNotificationId(notification.id);

    try {
      const success = await markAsRead(notification);

      if (success && notification.targetUrl) {
        navigate(notification.targetUrl);
      }
    } finally {
      setActiveNotificationId(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfbf8]">
      <Header />

      <main className="flex-1">
        <section className="px-6 pb-16 pt-16 md:px-10 md:pb-20 md:pt-20">
          <div className="mx-auto max-w-5xl">
            <div className="rounded-[32px] border border-[#2A2623]/8 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.06)] md:p-8">
              <div className="flex flex-col gap-6 border-b border-[#2A2623]/8 pb-6 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#2A2623]/45">Account Updates</p>
                  <h1 className="mt-2 font-serif text-4xl text-[#2A2623]">Notifications</h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-[#2A2623]/60">
                    Track purchases, subscription changes, downloads, and platform announcements in one place.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="rounded-full border border-[#c98d64]/25 bg-[#fffaf6] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#7c2d12]">
                    {unreadCount} unread
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={markingAllAsRead || unreadCount === 0}
                    onClick={() => void markEveryNotificationRead()}
                    className="h-11 rounded-full border-[#2A2623]/15 px-5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#2A2623]"
                  >
                    {markingAllAsRead ? "Updating..." : "Mark all as read"}
                  </Button>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {filterOptions.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setFilter(option.key)}
                    className={cn(
                      "rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300",
                      filter === option.key
                        ? "bg-[#2A2623] text-white shadow-lg"
                        : "border border-[#2A2623]/10 bg-[#faf7f3] text-[#2A2623]/60 hover:text-[#2A2623]",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="mt-8">
                {loadingList ? (
                  <div className="flex min-h-[280px] items-center justify-center">
                    <Loader2 className="h-7 w-7 animate-spin text-[#2A2623]/60" />
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="flex min-h-[280px] flex-col items-center justify-center rounded-[24px] border border-dashed border-[#2A2623]/12 bg-[#faf7f3] px-6 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
                      <Bell className="h-7 w-7 text-[#2A2623]/40" />
                    </div>
                    <h2 className="mt-5 text-xl font-semibold text-[#2A2623]">Nothing to show here</h2>
                    <p className="mt-2 max-w-md text-sm leading-6 text-[#2A2623]/55">
                      {filter === "all"
                        ? "You do not have any notifications yet."
                        : `There are no ${filter} notifications right now.`}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredNotifications.map((notification) => (
                      <NotificationListItem
                        key={notification.id}
                        notification={notification}
                        busy={activeNotificationId === notification.id}
                        onClick={handleNotificationClick}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Notifications;
