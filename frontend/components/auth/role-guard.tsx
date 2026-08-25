"use client";

import { ReactNode } from "react";
import { usePermissions } from "@/lib/hooks/use-permissions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

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
  const { t } = useTranslation();

  const { role, isLoading } = usePermissions();

  if (isLoading) {
    return <div className="animate-pulse">{t("Loading...")}</div>;
  }

  const hasAccess = role && allowedRoles.includes(role.name);

  if (!hasAccess) {
    if (showError) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t("Access Denied")}</AlertTitle>
          <AlertDescription>
            {t("You do not have the required role to access this content. Required roles:")} {allowedRoles.join(", ")}
          </AlertDescription>
        </Alert>
      );
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

