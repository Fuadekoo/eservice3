"use client";

import React from "react";
import { usePermissions } from "@/lib/hooks/use-permissions";

interface PermissionGateProps {
  /**
   * The permission code required to render children.
   * e.g., "stock.view", "customers.create"
   */
  permission: string;
  /**
   * Optional fallback UI to show when access is denied.
   */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * PermissionGate — conditionally renders children based on permissions.
 * Admins and Managers always have access.
 */
export const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  fallback = null,
  children,
}) => {
  const { hasPermission, isLoading } = usePermissions();

  // Don't render anything while permissions are loading
  if (isLoading) {
    return null;
  }

  // hasPermission already handles admin/manager overrides
  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
