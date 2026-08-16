"use client";

import React from "react";

/**
 * Registers the service worker in production, and actively tears down stale
 * registrations in development.
 *
 * The dev-mode cleanup matters: a worker registered by an earlier build keeps
 * controlling localhost across restarts, re-fetching /sw.js on its own and
 * serving cached Next.js chunks that no longer match the running dev server.
 *
 * Web Push needs that worker, though, and there is no way to try a push
 * notification without one. `NEXT_PUBLIC_ENABLE_SW_IN_DEV=true` opts a dev
 * machine into registering it — accepting the stale-chunk hazard above in
 * exchange for being able to test notifications locally.
 */
export function PwaProvider() {
  React.useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const enabledInDev = process.env.NEXT_PUBLIC_ENABLE_SW_IN_DEV === "true";

    if (process.env.NODE_ENV !== "production" && !enabledInDev) {
      void (async () => {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((r) => r.unregister()));
        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(
            keys
              .filter((key) => key.startsWith("eservice-"))
              .map((key) => caches.delete(key)),
          );
        }
      })();
      return;
    }

    const register = () => {
      void navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch((error) => {
          console.error("Service worker registration failed:", error);
        });
    };

    // Registering after load keeps the worker off the critical path.
    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
