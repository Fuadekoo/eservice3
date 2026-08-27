/**
 * JWT-based authentication client
 * Replaces better-auth with simple JWT token management
 */

import React from "react";

const TOKEN_KEY = "auth_token";

export interface AuthUser {
  id: string;
  name: string;
  firstName?: string;
  fatherName?: string;
  lastName?: string;
  username: string;
  phone: string;
  email?: string;
  userType?: string;
  officeId?: string;
  staffId?: string;
  isAdmin?: boolean;
}

/**
 * A device/session record as returned by the API.
 * Mirrors `serializeAuthSession` in backend/src/lib/auth-session.ts.
 */
export interface DeviceSessionInfo {
  id: string;
  deviceName: string | null;
  deviceType: string | null;
  browser: string | null;
  operatingSystem: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  lastSeenAt: string;
  createdAt: string;
  updatedAt: string;
  /** Only present when the API knows which session is making the request. */
  isCurrent?: boolean;
}

export interface AuthSession {
  user: AuthUser;
  role: {
    id: string;
    name: string;
  };
  permissions: string[];
  officeId?: string;
  office?: {
    id: string;
    name: string;
    address?: string;
    subdomain?: string;
    subscriptionExpiry?: string;
  };
  currentSession?: DeviceSessionInfo | null;
  token: string;
}

/**
 * Store authentication token
 */
export function setToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

/**
 * Get authentication token
 */
export function getToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Remove authentication token and all session data
 */
export function removeToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("session");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    localStorage.removeItem("permissions");
    localStorage.removeItem("office");
    localStorage.removeItem("officeId");
    localStorage.removeItem("currentSession");
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getToken() !== null;
}

/**
 * 2FA Required response from login
 */
export interface TwoFactorRequired {
  requiresTwoFactor: true;
  userId: string;
}

/**
 * Login user with phone and password
 * Returns either a full session or a 2FA challenge
 */
export async function login(
  phone: string,
  password: string,
): Promise<AuthSession | TwoFactorRequired> {
  const NEXT_PUBLIC_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  const response = await fetch(`${NEXT_PUBLIC_API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ phone, password }),
  });

  // Check if response has content before parsing
  const contentType = response.headers.get("content-type");
  const hasJsonContent =
    contentType && contentType.includes("application/json");
  const text = await response.text();

  if (!response.ok) {
    let errorMessage = "Login failed";
    if (hasJsonContent && text) {
      try {
        const error = JSON.parse(text);
        errorMessage = error.message || error.error || "Login failed";
      } catch {
        errorMessage = text || "Login failed";
      }
    } else if (text) {
      errorMessage = text;
    }
    throw new Error(errorMessage);
  }

  if (!hasJsonContent || !text) {
    throw new Error("Invalid response from server");
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch (error) {
    throw new Error("Failed to parse server response");
  }

  if (!data || !data.data) {
    throw new Error("Invalid response format from server");
  }

  // Check if 2FA is required
  if (data.data.requiresTwoFactor) {
    return {
      requiresTwoFactor: true,
      userId: data.data.userId,
    };
  }

  const session: AuthSession = data.data;

  if (!session || !session.token) {
    throw new Error("Token not received from server");
  }

  // Store token and session data
  setToken(session.token);

  // Store additional session data in localStorage for quick access
  if (typeof window !== "undefined") {
    localStorage.setItem("user", JSON.stringify(session.user));
    localStorage.setItem("role", JSON.stringify(session.role));
    localStorage.setItem(
      "permissions",
      JSON.stringify(session.permissions || []),
    );
    // Clear rather than keep a previous session's values: signing in over an
    // existing session must not leave a stale office on display.
    if (session.officeId) {
      localStorage.setItem("officeId", session.officeId);
    } else {
      localStorage.removeItem("officeId");
    }
    if (session.office) {
      localStorage.setItem("office", JSON.stringify(session.office));
    } else {
      localStorage.removeItem("office");
    }
    if (session.currentSession) {
      localStorage.setItem(
        "currentSession",
        JSON.stringify(session.currentSession),
      );
    }
  }

  return session;
}

/**
 * Verify 2FA code during login
 * Completes the login flow when the user has 2FA enabled
 */
export async function verifyTwoFactor(
  userId: string,
  token: string,
): Promise<AuthSession> {
  const NEXT_PUBLIC_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  const response = await fetch(
    `${NEXT_PUBLIC_API_BASE_URL}/auth/2fa/validate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, token }),
    },
  );

  const contentType = response.headers.get("content-type");
  const hasJsonContent =
    contentType && contentType.includes("application/json");
  const text = await response.text();

  if (!response.ok) {
    let errorMessage = "Verification failed";
    if (hasJsonContent && text) {
      try {
        const error = JSON.parse(text);
        errorMessage = error.message || error.error || "Verification failed";
      } catch {
        errorMessage = text || "Verification failed";
      }
    }
    throw new Error(errorMessage);
  }

  if (!hasJsonContent || !text) {
    throw new Error("Invalid response from server");
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Failed to parse server response");
  }

  if (!data || !data.data) {
    throw new Error("Invalid response format from server");
  }

  const session: AuthSession = data.data;

  if (!session || !session.token) {
    throw new Error("Token not received from server");
  }

  // Store token and session data
  setToken(session.token);

  if (typeof window !== "undefined") {
    localStorage.setItem("user", JSON.stringify(session.user));
    localStorage.setItem("role", JSON.stringify(session.role));
    localStorage.setItem(
      "permissions",
      JSON.stringify(session.permissions || []),
    );
    // Clear rather than keep a previous session's values: signing in over an
    // existing session must not leave a stale office on display.
    if (session.officeId) {
      localStorage.setItem("officeId", session.officeId);
    } else {
      localStorage.removeItem("officeId");
    }
    if (session.office) {
      localStorage.setItem("office", JSON.stringify(session.office));
    } else {
      localStorage.removeItem("office");
    }
    if (session.currentSession) {
      localStorage.setItem(
        "currentSession",
        JSON.stringify(session.currentSession),
      );
    }
  }

  return session;
}

/**
 * Detach this browser's push subscription on the way out.
 *
 * Signing out has to stop the notifications too, or the next person to use a
 * shared machine keeps receiving the previous user's approvals on the lock
 * screen. Written against the raw APIs rather than importing `lib/push` so
 * this module stays free of dependencies that import it back.
 */
async function detachPushSubscription(token: string): Promise<void> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    if (!subscription) return;

    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "/back-api";
    await fetch(`${apiBase}/notifications/push/subscribe`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
      keepalive: true,
    }).catch(() => {
      /* The row is pruned anyway on its first failed delivery. */
    });

    await subscription.unsubscribe();
  } catch {
    // Never block sign-out on notification housekeeping.
  }
}

/**
 * Logout user.
 *
 * Revokes the current session on the server (POST /auth/logout deletes this
 * session's row) BEFORE clearing local auth state, so the token is still
 * present to authenticate the request. The server call is best-effort: if it
 * fails (offline, server down) we still clear the local session and redirect,
 * so the device always ends up signed out. `keepalive` lets the request finish
 * even though we navigate away immediately after.
 */
export async function logout(): Promise<void> {
  if (typeof window !== "undefined") {
    const token = getToken();
    if (token) {
      // Must run while the token is still valid.
      await detachPushSubscription(token);

      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "/back-api";
      try {
        await fetch(`${apiBase}/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          keepalive: true,
        });
      } catch {
        // Best-effort: ignore network/server errors and still sign out locally.
      }
    }
  }

  removeToken();
  if (typeof window !== "undefined") {
    window.location.href = "/";
  }
}

/**
 * Get current session (simplified - just checks if token exists)
 * For full user data, use the /auth/me endpoint
 */
export function getSession(): { data: { session: AuthSession | null } } | null {
  if (typeof window === "undefined") return null;

  const token = getToken();
  if (!token) {
    return { data: { session: null } };
  }

  try {
    const userStr = localStorage.getItem("user");
    const roleStr = localStorage.getItem("role");
    const permissionsStr = localStorage.getItem("permissions");
    const officeStr = localStorage.getItem("office");
    const officeId = localStorage.getItem("officeId");
    const currentSessionStr = localStorage.getItem("currentSession");

    const user = userStr ? JSON.parse(userStr) : null;
    const role = roleStr ? JSON.parse(roleStr) : null;
    const permissions = permissionsStr ? JSON.parse(permissionsStr) : [];
    const office = officeStr ? JSON.parse(officeStr) : null;
    const currentSession = currentSessionStr
      ? JSON.parse(currentSessionStr)
      : null;

    if (!user || !role) return { data: { session: null } };

    return {
      data: {
        session: {
          user,
          role,
          permissions,
          officeId: officeId || undefined,
          office: office || undefined,
          currentSession: currentSession || undefined,
          token,
        },
      },
    };
  } catch (error) {
    console.error("Failed to parse session from localStorage", error);
    return { data: { session: null } };
  }
}

/**
 * React hook to get session (compatible with better-auth API)
 */
export function useSession(): {
  data: { session: AuthSession | null } | null;
  isPending: boolean;
} {
  const [sessionData, setSessionData] = React.useState<{
    session: AuthSession | null;
  } | null>(null);
  const [isPending, setIsPending] = React.useState(true);

  React.useEffect(() => {
    const data = getSession();
    setSessionData(data?.data || null);
    setIsPending(false);
  }, []);

  return {
    data: sessionData,
    isPending,
  };
}
