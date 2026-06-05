"use client";

import { getToken } from "@/lib/auth-client";
import { axiosInstance } from "@/lib/axios";
import React, { useEffect, useState } from "react";

export interface UserPermissions {
  permissions: string[];
  role: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    name: string;
    username: string;
    phone: string;
  };
}

/**
 * Hook to get current user permissions
 * Fetches permissions from the backend based on the user's role
 */
export function usePermissions() {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [role, setRole] = useState<{ id: string; name: string } | null>(null);
  const [user, setUser] = useState<UserPermissions["user"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasInitialized = React.useRef(false);

  useEffect(() => {
    // Prevent multiple initializations
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // Check token directly from localStorage
    const token = getToken();

    if (!token) {
      setIsLoading(false);
      setPermissions([]);
      setRole(null);
      return;
    }

    // Load from localStorage first (stored during login) - instant UI
    if (typeof window !== "undefined") {
      const storedRole = localStorage.getItem("role");
      const storedPermissions = localStorage.getItem("permissions");
      const storedUser = localStorage.getItem("user");

      if (storedRole && storedPermissions) {
        try {
          const role = JSON.parse(storedRole);
          const permissions = JSON.parse(storedPermissions);
          const user = storedUser ? JSON.parse(storedUser) : null;

          console.log("[usePermissions] Loaded from localStorage:", {
            role,
            permissionsCount: permissions?.length || 0,
            user,
          });

          // Set immediately from localStorage (fast, no loading)
          setRole(role);
          setPermissions(permissions || []);
          setUser(user);
          setIsLoading(false);
          setError(null);
        } catch (parseError) {
          console.error(
            "[usePermissions] Failed to parse localStorage data:",
            parseError,
          );
          // Fall through to fetch from backend
        }
      }
    }

    // Fetch user permissions from backend (either as refresh or if localStorage is empty)
    // Only set loading if we don't have data from localStorage
    const fetchPermissions = async () => {
      const hasLocalData =
        typeof window !== "undefined" &&
        localStorage.getItem("role") &&
        localStorage.getItem("permissions");

      try {
        // Only show loading if we don't have localStorage data
        if (!hasLocalData) {
          setIsLoading(true);
        }
        setError(null);

        console.log("[usePermissions] Fetching from /auth/me");

        // Get current user with permissions from backend
        const response = await axiosInstance.get<{
          data: {
            user: UserPermissions["user"];
            role: UserPermissions["role"];
            permissions: string[];
          };
        }>("/auth/me");

        console.log("[usePermissions] Response received (raw):", response);

        // Normalize server payload to `responseData` regardless of whether
        // `axiosInstance` returns the full AxiosResponse or the unwrapped data.
        const raw: any = response;
        let responseData: any;
        if (raw) {
          if (raw.data && raw.data.data) {
            // case: AxiosResponse { data: { data: { ... } } }
            responseData = raw.data.data;
          } else if (
            raw.data &&
            (raw.data.permissions || raw.data.role || raw.data.user)
          ) {
            // case: AxiosResponse { data: { permissions, role, ... } }
            responseData = raw.data;
          } else if (raw.permissions || raw.role || raw.user) {
            // case: interceptor returned unwrapped payload directly
            responseData = raw;
          } else {
            responseData = undefined;
          }
        } else {
          responseData = undefined;
        }

        if (responseData) {
          // Validate that we have the required data
          if (!responseData.role) {
            console.error(
              "[usePermissions] No role in response:",
              responseData,
            );
            throw new Error("Role not found in response");
          }

          if (
            !responseData.permissions ||
            !Array.isArray(responseData.permissions)
          ) {
            console.error(
              "[usePermissions] Invalid permissions in response:",
              responseData,
            );
            throw new Error("Permissions not found or invalid in response");
          }

          // Update state with fresh data from backend
          setPermissions(responseData.permissions || []);
          setRole(responseData.role || null);
          setUser(responseData.user || null);

          // Update localStorage with fresh data
          if (typeof window !== "undefined") {
            localStorage.setItem("role", JSON.stringify(responseData.role));
            localStorage.setItem(
              "permissions",
              JSON.stringify(responseData.permissions),
            );
            if (responseData.user) {
              localStorage.setItem("user", JSON.stringify(responseData.user));
            }
          }

          // Debug: Log role and permissions
          console.log("[usePermissions] Successfully loaded from backend:", {
            role: responseData.role,
            roleName: responseData.role?.name,
            permissionsCount: responseData.permissions?.length || 0,
          });
        } else {
          console.error(
            "[usePermissions] Invalid response structure:",
            response,
          );
          throw new Error("Invalid response structure from server");
        }
      } catch (err: any) {
        console.error("[usePermissions] Failed to fetch permissions:", err);
        console.error("[usePermissions] Error details:", {
          message: err?.message,
          response: err?.response?.data,
          status: err?.response?.status,
          statusText: err?.response?.statusText,
        });
        setError(err?.message || "Failed to load permissions");
        // Don't clear role/permissions if we already have them from localStorage
        // Only clear if we don't have localStorage data
        if (typeof window === "undefined" || !localStorage.getItem("role")) {
          setPermissions([]);
          setRole(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchPermissions();
  }, []); // Only run once on mount - we'll manually refresh when needed

  const roleNameUpper = role?.name?.toUpperCase();
  const isAdmin =
    roleNameUpper === "ADMIN" ||
    roleNameUpper === "ADMINISTRATOR" ||
    roleNameUpper === "SUPERADMIN";
  const isManager =
    roleNameUpper === "MANAGER" || roleNameUpper === "OFFICE_MANAGER";
  const isStaff = roleNameUpper === "STAFF";
  const isCustomer = roleNameUpper === "CUSTOMER";

  return {
    permissions,
    role,
    user,
    isLoading,
    error,
    hasPermission: (permission: string) => {
      // Admin has all permissions
      if (isAdmin) return true;

      // For other roles, check normal permissions
      const hasPerm = permissions.includes(permission);
      return hasPerm;
    },
    hasAnyPermission: (permissionList: string[]) => {
      // Admin has all permissions
      if (isAdmin) return true;

      return permissionList.some((p) => permissions.includes(p));
    },
    hasAllPermissions: (permissionList: string[]) => {
      // Admin has all permissions
      if (isAdmin) return true;

      return permissionList.every((p) => permissions.includes(p));
    },
    isAdmin,
    isManager,
    isStaff,
    isCustomer,
  };
}
