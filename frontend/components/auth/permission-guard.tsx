"use client";

import { ReactNode } from "react";
import { usePermissions } from "@/lib/hooks/use-permissions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface PermissionGuardProps {
  children: ReactNode;
  requiredPermission?: string;
  requiredPermissions?: string[];
  requireAll?: boolean; // If true, requires all permissions; if false, requires any
  fallback?: ReactNode;
  showError?: boolean;
}

/**
 * Component to protect content based on user permissions
 */
export function PermissionGuard({
  children,
  requiredPermission,
  requiredPermissions,
  requireAll = false,
  fallback = null,
  showError = false,
}: PermissionGuardProps) {
  const { permissions, role, isLoading, hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  if (isLoading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  // SUPERADMIN and MANAGER restrictions are handled in hasPermission/hasAnyPermission/hasAllPermissions
  // No need for bypass here - the permission check functions handle role restrictions

  let hasAccess = false;

  if (requiredPermission) {
    hasAccess = hasPermission(requiredPermission);
  } else if (requiredPermissions) {
    hasAccess = requireAll
      ? hasAllPermissions(requiredPermissions)
      : hasAnyPermission(requiredPermissions);
  } else {
    // No permission requirement, allow access
    hasAccess = true;
  }

  if (!hasAccess) {
    if (showError) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You do not have permission to access this content.
            {requiredPermission && ` Required: ${requiredPermission}`}
            {requiredPermissions && ` Required: ${requiredPermissions.join(", ")}`}
          </AlertDescription>
        </Alert>
      );
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

