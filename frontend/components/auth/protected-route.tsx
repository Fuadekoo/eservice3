"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePermissions } from "@/lib/hooks/use-permissions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermission?: string;
  requiredPermissions?: string[];
  requireAll?: boolean;
  allowedRoles?: string[];
  redirectTo?: string;
  showError?: boolean;
}

/**
 * Component to protect entire routes/pages based on permissions or roles
 * Redirects to home or shows error if user doesn't have access
 */
export function ProtectedRoute({
  children,
  requiredPermission,
  requiredPermissions,
  requireAll = false,
  allowedRoles,
  redirectTo = "/overview",
  showError = true,
}: ProtectedRouteProps) {
  const router = useRouter();
  const {
    permissions,
    role,
    isLoading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
  } = usePermissions();

  // Debug logging
  useEffect(() => {
    if (role) {
      const roleNameUpper = role.name?.toUpperCase();
      console.log("[ProtectedRoute] Debug:", {
        roleName: role.name,
        roleNameUpper,
        isAdmin,
        requiredPermission,
        permissions: permissions.length,
      });
    }
  }, [role, isAdmin, requiredPermission, permissions]);

  useEffect(() => {
    if (isLoading) return;

    let hasAccess = false;

    // Check role-based access first
    let hasRoleAccess = true;
    if (allowedRoles && allowedRoles.length > 0) {
      const roleNameUpper = role?.name?.toUpperCase();
      hasRoleAccess = role
        ? allowedRoles.map((r) => r.toUpperCase()).includes(roleNameUpper || "")
        : false;
    }

    // Check permission-based access (handles SUPERADMIN/MANAGER restrictions internally)
    const hasPermissionRestriction =
      !!requiredPermission ||
      (requiredPermissions && requiredPermissions.length > 0);
    let hasPermissionAccess = true;
    if (hasPermissionRestriction) {
      if (requiredPermission) {
        hasPermissionAccess = hasPermission(requiredPermission);
      } else if (requiredPermissions) {
        hasPermissionAccess = requireAll
          ? hasAllPermissions(requiredPermissions)
          : hasAnyPermission(requiredPermissions);
      }
    }

    // Grant access rules:
    // - If roles are specified and permissions are also required: allow if either roles OR permissions pass
    // - If roles are specified but no permission requirement: require matching role only
    // - If no role restriction: rely purely on permissions
    if (allowedRoles && allowedRoles.length > 0) {
      hasAccess = hasPermissionRestriction
        ? hasRoleAccess || hasPermissionAccess
        : hasRoleAccess;
    } else {
      // No role restriction, check permissions only (or allow if no restrictions at all)
      hasAccess = hasPermissionRestriction ? hasPermissionAccess : true;
    }

    if (!hasAccess) {
      console.log("[ProtectedRoute] Access denied:", {
        role: role?.name,
        requiredPermission,
        requiredPermissions,
        allowedRoles,
        hasRoleAccess,
        hasPermissionAccess,
        redirectTo,
      });
      // For SUPERADMIN, redirect to /schools instead of /overview
      const targetRedirect = isAdmin ? redirectTo : redirectTo;
      router.push(targetRedirect);
    }
  }, [
    isLoading,
    permissions,
    role,
    requiredPermission,
    requiredPermissions,
    requireAll,
    allowedRoles,
    redirectTo,
    router,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
  ]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  let hasAccess = false;

  // Check role-based access first
  let hasRoleAccess = true;
  if (allowedRoles && allowedRoles.length > 0) {
    const allowedRolesUpper = allowedRoles.map((allowedRole) =>
      allowedRole.toUpperCase(),
    );
    hasRoleAccess = role
      ? allowedRolesUpper.includes(role.name.toUpperCase())
      : false;
  }

  // Check permission-based access
  const hasPermissionRestriction =
    !!requiredPermission ||
    (requiredPermissions && requiredPermissions.length > 0);
  let hasPermissionAccess = true;
  if (hasPermissionRestriction) {
    if (requiredPermission) {
      hasPermissionAccess = hasPermission(requiredPermission);
    } else if (requiredPermissions) {
      hasPermissionAccess = requireAll
        ? hasAllPermissions(requiredPermissions)
        : hasAnyPermission(requiredPermissions);
    }
  }

  // Grant access using same rules as in the effect above
  if (allowedRoles && allowedRoles.length > 0) {
    hasAccess = hasPermissionRestriction
      ? hasRoleAccess || hasPermissionAccess
      : hasRoleAccess;
  } else {
    hasAccess = hasPermissionRestriction ? hasPermissionAccess : true;
  }

  if (!hasAccess) {
    if (showError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-4">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription className="mt-2">
              You do not have permission to access this page.
              {requiredPermission && (
                <p className="mt-1 text-sm">Required: {requiredPermission}</p>
              )}
              {requiredPermissions && (
                <p className="mt-1 text-sm">
                  Required: {requiredPermissions.join(", ")}
                </p>
              )}
              {allowedRoles && (
                <p className="mt-1 text-sm">
                  Required roles: {allowedRoles.join(", ")}
                </p>
              )}
            </AlertDescription>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push(redirectTo)}
            >
              Go Back
            </Button>
          </Alert>
        </div>
      );
    }
    return null;
  }

  return <>{children}</>;
}
