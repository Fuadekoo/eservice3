"use client";

import * as React from "react";
import {
  Bell,
  CalendarCheck,
  CalendarClock,
  CalendarX,
  CheckCircle2,
  ClipboardList,
  FileText,
  MessageSquare,
  Trash2,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type {
  AppNotification,
  NotificationKind,
} from "@/lib/stores/notification-store";
import { useTranslation } from "@/lib/i18n";

/**
 * Icon and colour per event kind.
 *
 * Colour carries the outcome — green for approved, red for rejected, amber for
 * something waiting on you — so the inbox is scannable without reading a word
 * of it. Everything routine stays in the muted default.
 */
const KIND_PRESENTATION: Record<
  NotificationKind,
  { icon: LucideIcon; className: string }
> = {
  request: {
    icon: ClipboardList,
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  request_approved: {
    icon: CheckCircle2,
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  request_rejected: {
    icon: XCircle,
    className: "bg-destructive/10 text-destructive",
  },
  appointment: {
    icon: CalendarClock,
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  appointment_approved: {
    icon: CalendarCheck,
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  appointment_cancelled: {
    icon: CalendarX,
    className: "bg-destructive/10 text-destructive",
  },
  appointment_reminder: {
    icon: CalendarClock,
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  report: {
    icon: FileText,
    className: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  feedback: {
    icon: MessageSquare,
    className: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
  system: {
    icon: Bell,
    className: "bg-muted text-muted-foreground",
  },
};

/**
 * "3m ago" up to a day, then a plain date. Relative time past a day stops
 * being informative — "13 days ago" makes you do arithmetic anyway.
 */
export function formatRelativeTime(
  iso: string,
  t: (key: string, vars?: Record<string, string | number>) => string = (k) => k
): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";

  const seconds = Math.round((Date.now() - then) / 1000);

  if (seconds < 60) return t("just now");
  if (seconds < 3600) return t("{count}m ago", { count: Math.floor(seconds / 60) });
  if (seconds < 86_400) return t("{count}h ago", { count: Math.floor(seconds / 3600) });
  if (seconds < 172_800) return t("yesterday");

  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    ...(new Date(iso).getFullYear() === new Date().getFullYear()
      ? {}
      : { year: "numeric" }),
  });
}

type NotificationItemProps = {
  notification: AppNotification;
  onSelect: (notification: AppNotification) => void;
  onDelete?: (id: string) => void;
  /** Compact rows for the bell popover; roomier ones for the full page. */
  dense?: boolean;
};

export function NotificationItem({
  notification,
  onSelect,
  onDelete,
  dense = false,
}: NotificationItemProps) {
  const { t } = useTranslation();

  const presentation =
    KIND_PRESENTATION[notification.kind] ?? KIND_PRESENTATION.system;
  const Icon = presentation.icon;

  return (
    <div
      className={cn(
        "group relative flex w-full min-w-0 items-start gap-3 border-b border-border/50 transition-colors last:border-b-0",
        "hover:bg-accent/50",
        dense ? "px-3 py-3" : "px-4 py-4",
        !notification.isRead && "bg-primary/[0.04]",
      )}
    >
      {/* Unread marker — a bar rather than a dot, so it survives truncation
          and stays visible at the smallest width. */}
      {!notification.isRead && (
        <span
          aria-hidden
          className="absolute left-0 top-0 h-full w-0.5 bg-primary"
        />
      )}

      <button
        type="button"
        onClick={() => onSelect(notification)}
        className="flex min-w-0 flex-1 items-start gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-md"
      >
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-lg",
            presentation.className,
            dense ? "size-8" : "size-9",
          )}
        >
          <Icon className={dense ? "size-4" : "size-4.5"} />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span
              className={cn(
                "truncate text-sm",
                notification.isRead
                  ? "font-medium text-foreground/90"
                  : "font-semibold text-foreground",
              )}
            >
              {notification.title}
            </span>
            <time
              dateTime={notification.createdAt}
              className="shrink-0 text-[11px] tabular-nums text-muted-foreground"
            >
              {formatRelativeTime(notification.createdAt, t)}
            </time>
          </span>

          <span
            className={cn(
              "mt-0.5 block text-xs text-muted-foreground",
              dense ? "line-clamp-2" : "line-clamp-3",
            )}
          >
            {notification.body}
          </span>
        </span>
      </button>

      {onDelete && (
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("Delete notification")}
          onClick={() => onDelete(notification.id)}
          className="size-7 shrink-0 self-center text-muted-foreground opacity-0 transition-opacity hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
        >
          <Trash2 className="size-3.5" />
        </Button>
      )}
    </div>
  );
}
