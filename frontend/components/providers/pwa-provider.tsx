"use client";

import React from "react";

/**
 * Registers the service worker in production, and actively tears down stale
 * registrations in development.
 *
 * The dev-mode cleanup matters: a worker registered by an earlier build keeps
 * controlling localhost across restarts, re-fetching /sw.js on its own and
 * serving cached Next.js chunks that no longer match the running dev server.
 */
export function PwaProvider() {
  React.useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
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
