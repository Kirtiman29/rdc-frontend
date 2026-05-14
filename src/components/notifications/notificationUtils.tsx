import type { LucideIcon } from "lucide-react";
import {
  Bell,
  CalendarClock,
  CheckCircle2,
  Download,
  Info,
  ShoppingBag,
  Sparkles,
  Tag,
  TriangleAlert,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { AppNotification, NotificationType } from "@/api/notificationApi";

type NotificationVisual = {
  icon: LucideIcon;
  iconClassName: string;
  chipLabel: string;
};

const notificationVisuals: Record<NotificationType, NotificationVisual> = {
  ORDER_PURCHASE: {
    icon: ShoppingBag,
    iconClassName: "text-[#7c2d12] bg-[#fff7ed]",
    chipLabel: "Order",
  },
  PAYMENT_SUCCESS: {
    icon: CheckCircle2,
    iconClassName: "text-emerald-700 bg-emerald-50",
    chipLabel: "Payment",
  },
  DESIGN_DOWNLOAD: {
    icon: Download,
    iconClassName: "text-sky-700 bg-sky-50",
    chipLabel: "Download",
  },
  NEW_COLLECTION: {
    icon: Sparkles,
    iconClassName: "text-fuchsia-700 bg-fuchsia-50",
    chipLabel: "Collection",
  },
  SPECIAL_OFFER: {
    icon: Tag,
    iconClassName: "text-rose-700 bg-rose-50",
    chipLabel: "Offer",
  },
  CREDIT_LOW: {
    icon: TriangleAlert,
    iconClassName: "text-amber-700 bg-amber-50",
    chipLabel: "Credits",
  },
  DESIGN_LIMIT_LOW: {
    icon: TriangleAlert,
    iconClassName: "text-amber-700 bg-amber-50",
    chipLabel: "Usage",
  },
  SUBSCRIPTION_ACTIVATED: {
    icon: CalendarClock,
    iconClassName: "text-violet-700 bg-violet-50",
    chipLabel: "Subscription",
  },
  SUBSCRIPTION_EXPIRING: {
    icon: CalendarClock,
    iconClassName: "text-violet-700 bg-violet-50",
    chipLabel: "Subscription",
  },
  SUBSCRIPTION_EXPIRED: {
    icon: CalendarClock,
    iconClassName: "text-violet-700 bg-violet-50",
    chipLabel: "Subscription",
  },
  SYSTEM: {
    icon: Info,
    iconClassName: "text-slate-700 bg-slate-100",
    chipLabel: "System",
  },
};

const fallbackVisual: NotificationVisual = {
  icon: Bell,
  iconClassName: "text-slate-700 bg-slate-100",
  chipLabel: "Notice",
};

export const getNotificationVisual = (type: NotificationType) =>
  notificationVisuals[type] || fallbackVisual;

export const formatNotificationRelativeTime = (value: string) => {
  const timestamp = new Date(value).getTime();

  if (Number.isNaN(timestamp)) {
    return "";
  }

  const diffSeconds = Math.max(1, Math.floor((Date.now() - timestamp) / 1000));

  if (diffSeconds < 60) {
    return `${diffSeconds}s ago`;
  }

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: new Date(value).getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  });
};

export const getNotificationItemClasses = (notification: AppNotification) =>
  cn(
    "group rounded-2xl border p-4 text-left transition-all duration-300",
    notification.read
      ? "border-[#2A2623]/8 bg-white hover:border-[#2A2623]/20 hover:shadow-sm"
      : "border-[#c98d64]/30 bg-[#fffaf6] shadow-[0_12px_35px_rgba(201,141,100,0.10)] hover:border-[#c98d64]/50",
  );
