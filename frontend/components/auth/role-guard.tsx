"use client";

import { ReactNode } from "react";
import { usePermissions } from "@/lib/hooks/use-permissions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: string[];
  fallback?: ReactNode;
  showError?: boolean;
}

/**
 * Component to protect content based on user roles
 */
export function RoleGuard({
  children,
  allowedRoles,
  fallback = null,
  showError = false,
}: RoleGuardProps) {
  const { role, isLoading } = usePermissions();

  if (isLoading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  const hasAccess = role && allowedRoles.includes(role.name);

  if (!hasAccess) {
    if (showError) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You do not have the required role to access this content.
            Required roles: {allowedRoles.join(", ")}
          </AlertDescription>
        </Alert>
      );
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

