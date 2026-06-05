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
    if (session.officeId) {
      localStorage.setItem("officeId", session.officeId);
    }
    if (session.office) {
      localStorage.setItem("office", JSON.stringify(session.office));
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
    if (session.officeId) {
      localStorage.setItem("officeId", session.officeId);
    }
    if (session.office) {
      localStorage.setItem("office", JSON.stringify(session.office));
    }
  }

  return session;
}

/**
 * Logout user
 */
export function logout(): void {
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

    const user = userStr ? JSON.parse(userStr) : null;
    const role = roleStr ? JSON.parse(roleStr) : null;
    const permissions = permissionsStr ? JSON.parse(permissionsStr) : [];
    const office = officeStr ? JSON.parse(officeStr) : null;

    if (!user || !role) return { data: { session: null } };

    return {
      data: {
        session: {
          user,
          role,
          permissions,
          officeId: officeId || undefined,
          office: office || undefined,
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
