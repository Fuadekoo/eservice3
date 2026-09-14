"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, BellOff, CheckCheck, Loader2, Settings2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverOverlay,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { usePushStore } from "@/lib/stores/push-store";
import {
  useNotificationStore,
  type AppNotification,
} from "@/lib/stores/notification-store";
import { NotificationItem } from "./notification-item";
import { useTranslation } from "@/lib/i18n";

/** Past this the badge stops being a count and becomes "a lot". */
const BADGE_CAP = 99;

/**
 * The header bell: unread badge, the ten most recent notifications, and the
 * one place a user is offered browser notifications.
 *
 * The permission prompt lives here rather than firing on page load — a
 * notification request that arrives before anyone has seen the feature is the
 * fastest way to get permanently blocked.
 */
export function NotificationBell() {
  const { t } = useTranslation();

  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  const notifications = useNotificationStore((state) => state.notifications);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const isLoading = useNotificationStore((state) => state.isLoading);
  const fetchNotifications = useNotificationStore(
    (state) => state.fetchNotifications,
  );
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);

  const pushSupported = usePushStore((state) => state.isSupported);
  const pushServerEnabled = usePushStore((state) => state.isServerEnabled);
  const pushSubscribed = usePushStore((state) => state.isSubscribed);
  const pushPermission = usePushStore((state) => state.permission);
  const pushBusy = usePushStore((state) => state.isBusy);
  const refreshPush = usePushStore((state) => state.refresh);
  const enablePush = usePushStore((state) => state.enable);

  // The list is only fetched when the panel is actually opened; the badge
  // count is kept current separately and far more cheaply.
  React.useEffect(() => {
    if (open) void fetchNotifications({ page: 1, pageSize: 10 });
  }, [open, fetchNotifications]);

  // Probed once, on first open, so the permission state behind the prompt
  // below is current without costing anything on pages nobody opens it on.
  React.useEffect(() => {
    if (open) void refreshPush();
  }, [open, refreshPush]);

  const handleSelect = React.useCallback(
    (notification: AppNotification) => {
      setOpen(false);
      void markAsRead(notification.id);
      if (notification.url) router.push(notification.url);
    },
    [markAsRead, router],
  );

  const recent = notifications.slice(0, 10);

  // Offer the prompt only when it can actually succeed: supported browser,
  // configured server, and a permission that has not already been decided.
  const canOfferPush =
    pushSupported &&
    pushServerEnabled &&
    !pushSubscribed &&
    pushPermission !== "denied";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative size-8"
          aria-label={
            unreadCount > 0
              ? `Notifications (${unreadCount} unread)`
              : t("Notifications")
          }
        >
          <Bell className="size-4.5" />
          {unreadCount > 0 && (
            <span
              className={cn(
                "absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1",
                "bg-destructive text-[10px] font-bold leading-none text-white tabular-nums",
                "ring-2 ring-background",
              )}
            >
              {unreadCount > BADGE_CAP ? `${BADGE_CAP}+` : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverOverlay />

      {/*
        The panel is a column that never outgrows the space below the bell:
        `--radix-popover-content-available-height` is the gap Radix measured to
        the bottom of the viewport. Everything but the list is `shrink-0`, so the
        list is the only part that gives, and `overflow-hidden` keeps the rounded
        corners clipping it.
      */}
      <PopoverContent
        align="end"
        sideOffset={8}
        className="flex max-h-[min(32rem,var(--radix-popover-content-available-height))] w-[min(24rem,calc(100vw-1.5rem))] flex-col overflow-hidden p-0"
      >
        {/* ── Header ─────────────────────────────────────── */}
        <div className="flex shrink-0 items-center justify-between gap-2 px-3 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="text-sm font-semibold">{t("Notifications")}</h2>
            {unreadCount > 0 && (
              <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary tabular-nums">
                {unreadCount} new
              </span>
            )}
          </div>

          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => void markAllAsRead()}
            >
              <CheckCheck className="mr-1 size-3.5" />
              {t("Mark all read")}
            </Button>
          )}
        </div>

        <Separator className="shrink-0" />

        {/* ── Enable-push prompt ─────────────────────────── */}
        {canOfferPush && (
          <div className="flex shrink-0 items-start gap-3 bg-primary/[0.06] px-3 py-3">
            <Bell className="mt-0.5 size-4 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium">{t("Get notified instantly")}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {t("Receive alerts for approvals and appointments even when this tab is closed.")}
              </p>
              <Button
                size="sm"
                className="mt-2 h-7 text-xs"
                disabled={pushBusy}
                onClick={() => void enablePush()}
              >
                {pushBusy && <Loader2 className="mr-1 size-3.5 animate-spin" />}
                {t("Enable notifications")}
              </Button>
            </div>
          </div>
        )}

        {pushPermission === "denied" && (
          <div className="flex shrink-0 items-start gap-2 bg-muted/50 px-3 py-2.5">
            <BellOff className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
            <p className="text-[11px] text-muted-foreground">
              {t("Browser notifications are blocked for this site. Re-enable them in your browser's site settings to get instant alerts.")}
            </p>
          </div>
        )}

        {/* ── List ───────────────────────────────────────── */}
        {isLoading && recent.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            {t("Loading…")}
          </div>
        ) : recent.length === 0 ? (
          <div className="flex flex-col items-center gap-1.5 px-6 py-10 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-muted">
              <Bell className="size-4.5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">{t("You're all caught up")}</p>
            <p className="text-xs text-muted-foreground">
              {t("Updates about your requests and appointments show up here.")}
            </p>
          </div>
        ) : (
          /*
            A plain scroll container rather than ScrollArea. Radix sizes its
            viewport with `height: 100%`, which against a parent that only has a
            `max-height` resolves to `auto` — the viewport grew to the full list
            and spilled out over the page instead of scrolling, which is why the
            footer used to appear halfway up the list.

            `min-h-0` is what lets this flex child shrink below its content, and
            `overscroll-contain` keeps a flick at the end of the list from
            scrolling the page behind the panel.
          */
          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain">
            {recent.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onSelect={handleSelect}
                dense
              />
            ))}
          </div>
        )}

        <Separator className="shrink-0" />

        {/* ── Footer ─────────────────────────────────────── */}
        <div className="flex shrink-0 items-center justify-between gap-2 px-2 py-1.5">
          <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
            <Link href="/notifications" onClick={() => setOpen(false)}>
              {t("View all")}
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("Notification settings")}
            className="size-7 text-muted-foreground"
            asChild
          >
            <Link
              href="/settings?tab=preferences"
              onClick={() => setOpen(false)}
            >
              <Settings2 className="size-3.5" />
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
