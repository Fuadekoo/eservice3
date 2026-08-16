"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { axiosInstance } from "@/lib/axios";
import { getToken } from "@/lib/auth-client";
import { syncSubscription } from "@/lib/push";
import { useNotificationStore } from "@/lib/stores/notification-store";

/** How often the badge re-checks the server while the tab is in the foreground. */
const POLL_INTERVAL_MS = 45_000;

/**
 * Keeps the notification bell honest.
 *
 * Push is the fast path, polling is the safety net, and the two are needed
 * together: a user who declined the browser permission prompt — or is on a
 * browser that has no push at all — must still see their badge update, and a
 * push that arrives while the tab is backgrounded must not be missed.
 *
 * Mounted once, from the dashboard shell.
 */
export function useNotifications() {
  const router = useRouter();
  const fetchUnreadCount = useNotificationStore(
    (state) => state.fetchUnreadCount,
  );
  const fetchNotifications = useNotificationStore(
    (state) => state.fetchNotifications,
  );
  const markAsRead = useNotificationStore((state) => state.markAsRead);

  // ── Initial load + re-registering this browser's push subscription ────────
  React.useEffect(() => {
    if (!getToken()) return;

    void fetchUnreadCount();

    // The server may have lost the subscription (restore from backup, row
    // pruned after a delivery failure) while the browser still holds it.
    // Re-sending it costs one idempotent upsert and repairs that silently.
    void syncSubscription();
  }, [fetchUnreadCount]);

  // ── Poll, but only while the tab is actually being looked at ──────────────
  React.useEffect(() => {
    if (!getToken()) return;

    let timer: number | undefined;

    const start = () => {
      if (timer !== undefined) return;
      timer = window.setInterval(() => {
        void fetchUnreadCount();
      }, POLL_INTERVAL_MS);
    };

    const stop = () => {
      if (timer === undefined) return;
      window.clearInterval(timer);
      timer = undefined;
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Catch up immediately on return, then resume the cadence.
        void fetchUnreadCount();
        start();
      } else {
        stop();
      }
    };

    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [fetchUnreadCount]);

  // ── Messages from the service worker ──────────────────────────────────────
  React.useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const onMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== "object") return;

      switch (data.type) {
        case "PUSH_RECEIVED": {
          void fetchUnreadCount();
          // Refresh the list too, so an open bell reflects the new arrival
          // rather than showing a badge with nothing behind it.
          void fetchNotifications({ page: 1 });

          // The tray notification has already fired — `userVisibleOnly`
          // subscriptions must always show one, and browsers give no way to
          // suppress it. So the toast is only worth adding when the user is
          // actually looking at the app, where a corner-of-the-screen system
          // notification is the easiest thing in the world to miss. Hidden
          // tabs skip it, or a morning's pushes all pile up on return.
          const payload = data.payload ?? {};
          if (payload.title && document.visibilityState === "visible") {
            toast(payload.title, {
              description: payload.body,
              action: payload.url
                ? {
                    label: "View",
                    onClick: () => router.push(payload.url),
                  }
                : undefined,
            });
          }
          break;
        }

        case "NAVIGATE": {
          // Sent when the worker could not navigate the tab itself.
          if (typeof data.url === "string") router.push(data.url);
          break;
        }

        case "PUSH_SUBSCRIPTION_CHANGED": {
          // The push service rotated our endpoint; the worker already
          // re-subscribed and is handing the new one over to be stored.
          if (data.subscription) {
            void axiosInstance
              .post("/notifications/push/subscribe", data.subscription)
              .catch(() => {
                /* Retried by syncSubscription on the next load. */
              });
          }
          break;
        }
      }
    };

    navigator.serviceWorker.addEventListener("message", onMessage);
    return () =>
      navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [fetchNotifications, fetchUnreadCount, router]);

  // ── `?notification=<id>` deep link from a clicked push ────────────────────
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    const notificationId = url.searchParams.get("notification");
    if (!notificationId) return;

    void markAsRead(notificationId);

    // Strip the marker so a refresh or a shared link doesn't carry it along.
    url.searchParams.delete("notification");
    window.history.replaceState(
      {},
      "",
      url.pathname + url.search + url.hash,
    );
  }, [markAsRead]);
}
