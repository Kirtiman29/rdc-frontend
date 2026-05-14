import type { AppNotification } from "@/api/notificationApi";
import { getNotificationItemClasses, getNotificationVisual, formatNotificationRelativeTime } from "@/components/notifications/notificationUtils";
import { cn } from "@/lib/utils";
import { ChevronRight, Dot } from "lucide-react";

type NotificationListItemProps = {
  notification: AppNotification;
  compact?: boolean;
  busy?: boolean;
  onClick?: (notification: AppNotification) => void | Promise<void>;
};

const NotificationListItem = ({
  notification,
  compact = false,
  busy = false,
  onClick,
}: NotificationListItemProps) => {
  const { icon: Icon, iconClassName, chipLabel } = getNotificationVisual(notification.type);

  const content = (
    <div className={getNotificationItemClasses(notification)}>
      <div className="flex items-start gap-3">
        <div className={cn("mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full", iconClassName)}>
          <Icon className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#2A2623]/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#2A2623]/70">
              {chipLabel}
            </span>
            {notification.global && (
              <span className="rounded-full bg-[#ba1b1c]/8 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#ba1b1c]">
                Global
              </span>
            )}
            {!notification.read && (
              <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-[0.18em] text-[#ba1b1c]">
                <Dot className="-mx-1 h-4 w-4" />
                Unread
              </span>
            )}
          </div>

          <div className="mt-2 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className={cn("text-sm text-[#2A2623]", !notification.read && "font-semibold")}>
                {notification.title}
              </h3>
              <p
                className={cn(
                  "mt-1 text-sm leading-6 text-[#2A2623]/70",
                  compact ? "max-h-11 overflow-hidden" : "text-pretty",
                )}
              >
                {notification.message}
              </p>
            </div>

            {notification.targetUrl && (
              <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-[#2A2623]/35 transition-transform duration-300 group-hover:translate-x-0.5" />
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-[#2A2623]/45">
            <span>{formatNotificationRelativeTime(notification.createdAt)}</span>
            {notification.expiresAt && <span>Expires {formatNotificationRelativeTime(notification.expiresAt)}</span>}
          </div>
        </div>
      </div>
    </div>
  );

  if (!onClick) {
    return content;
  }

  return (
    <button
      type="button"
      onClick={() => void onClick(notification)}
      disabled={busy}
      className="w-full disabled:cursor-not-allowed disabled:opacity-70"
    >
      {content}
    </button>
  );
};

export default NotificationListItem;
