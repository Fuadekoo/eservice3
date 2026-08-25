"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { usePermissions } from "@/lib/hooks/use-permissions";
import { PAGE_PERMISSIONS } from "@/config/navigation";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";

interface ProtectedPageProps {
  /**
   * Override the permission check with explicit permission codes.
   * If not provided, permissions are looked up from PAGE_PERMISSIONS
   * based on the current pathname.
   */
  permissions?: string[];
  /**
   * If true, ALL listed permissions are required (AND logic).
   * Default is false (ANY one permission grants access — OR logic).
   */
  requireAll?: boolean;
  children: React.ReactNode;
}

/**
 * ProtectedPage — wraps a page and blocks access if the
 * current user's role does not have the required permissions.
 *
 * Usage:
 * ```tsx
 * export default function SomePage() {
 *   return (
 *     <ProtectedPage>
 *       {/* page content *​/}
 *     </ProtectedPage>
 *   );
 * }
 * ```
 */
export function ProtectedPage({
  permissions: explicitPermissions,
  requireAll = false,
  children,
}: ProtectedPageProps) {
  const { t } = useTranslation();

  const pathname = usePathname();
  const router = useRouter();
  const {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
    isManager,
    isLoading,
    role,
  } = usePermissions();

  // Determine which permissions to check
  const requiredPermissions =
    explicitPermissions ?? PAGE_PERMISSIONS[pathname] ?? [];

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">
            {t("Checking permissions...")}
          </p>
        </div>
      </div>
    );
  }

  // Admin & Manager always have access
  if (isAdmin || isManager) {
    return <>{children}</>;
  }

  // If no permissions are required, allow access
  if (requiredPermissions.length === 0) {
    return <>{children}</>;
  }

  // Check permissions
  const hasAccess = requireAll
    ? hasAllPermissions(requiredPermissions)
    : hasAnyPermission(requiredPermissions);

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-[500px] ">
        <div className="max-w-md w-full mx-auto text-center space-y-6 p-8">
          {/* Icon */}
          <div className="mx-auto w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldAlert className="h-10 w-10 text-destructive" />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {t("Access Denied")}
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {t("You don't have the required permissions to access this page.")}
              <br />
              {t("Contact your administrator to request access.")}
            </p>
          </div>

          {/* Role Info */}
          <div className="rounded-lg border bg-muted/50 p-4 text-left space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("Your Role")}</span>
              <span className="font-medium capitalize">
                {role?.name || t("Unknown")}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("Required Permission")}</span>
              <span className="font-mono text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded">
                {requiredPermissions.join(" | ")}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("Go Back")}
            </Button>
            <Button onClick={() => router.push("/overview")} className="gap-2">
              <Home className="h-4 w-4" />
              {t("Home")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
