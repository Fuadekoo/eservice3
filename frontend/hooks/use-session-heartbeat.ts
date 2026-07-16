"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { axiosInstance, ApiError } from "@/lib/axios";
import { getToken, removeToken } from "@/lib/auth-client";

/**
 * How often (ms) to re-validate the current session against the backend.
 * When another device revokes this session from Settings → Security, the
 * backing session row is deleted and `/auth/me` starts returning 401. This
 * heartbeat detects that and signs the device out automatically, instead of
 * waiting for the next user-triggered request.
 */
const HEARTBEAT_INTERVAL_MS = 20_000;

/**
 * Keeps a signed-in device in sync with its server session.
 *
 * The axios response interceptor intentionally skips 401 handling for
 * `/auth/*` endpoints (so a bad login doesn't nuke an existing session), which
 * means a revoked session polled via `/auth/me` would not trigger a redirect on
 * its own. This hook owns that 401 → force-logout transition explicitly.
 */
export function useSessionHeartbeat() {
  const loggingOutRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const forceLogout = () => {
      if (loggingOutRef.current) {
        return;
      }
      loggingOutRef.current = true;

      removeToken();
      toast.error("You have been signed out", {
        description:
          "This device's session was ended. Please sign in again to continue.",
      });

      if (
        typeof window !== "undefined" &&
        window.location.pathname !== "/signin"
      ) {
        window.location.href = "/signin";
      }
    };

    const validate = async () => {
      if (cancelled || loggingOutRef.current) {
        return;
      }
      // No token means the app is already in a signed-out state.
      if (!getToken()) {
        return;
      }
      // Don't poll while the tab is hidden; we re-check on focus instead.
      if (
        typeof document !== "undefined" &&
        document.visibilityState === "hidden"
      ) {
        return;
      }

      try {
        await axiosInstance.get("/auth/me");
      } catch (error) {
        // Only a 401 means the session was revoked/expired. Network errors
        // (status 0) or other failures must not sign the user out.
        if (error instanceof ApiError && error.status === 401) {
          forceLogout();
        }
      }
    };

    const onVisibleOrFocus = () => {
      if (
        typeof document === "undefined" ||
        document.visibilityState === "visible"
      ) {
        void validate();
      }
    };

    const interval = setInterval(() => void validate(), HEARTBEAT_INTERVAL_MS);
    document.addEventListener("visibilitychange", onVisibleOrFocus);
    window.addEventListener("focus", onVisibleOrFocus);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibleOrFocus);
      window.removeEventListener("focus", onVisibleOrFocus);
    };
  }, []);
}
