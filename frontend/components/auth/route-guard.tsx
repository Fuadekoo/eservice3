"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, Home, Loader2, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { usePermissions } from "@/lib/hooks/use-permissions";
import { resolvePageAccess } from "@/config/page-access";
import { getRoleOverviewPath } from "@/lib/role-overview";
import { useTranslation } from "@/lib/i18n";

/**
 * Blocks a dashboard page the signed-in user has no permission for, including
 * when they reach it by typing the URL.
 *
 * Applied once in the dashboard layout so every page is covered by default —
 * a new page is denied until it is declared in PAGE_ACCESS, rather than being
 * open until someone remembers to wrap it.
 *
 * This is a usability guard, not a security boundary: permissions come from
 * localStorage and can be edited by anyone with devtools. The API enforces the
 * same rules server-side, which is what actually stops unauthorized reads and
 * writes.
 */
export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const { hasAnyPermission, isAdmin, isLoading, role } = usePermissions();

  const required = resolvePageAccess(pathname);

  const homePath = React.useMemo(
    () => getRoleOverviewPath(role?.name) ?? "/dashboard",
    [role?.name],
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            {t("Checking permissions...")}
          </p>
        </div>
      </div>
    );
  }

  // An admin holds every permission by definition.
  const allowed =
    isAdmin ||
    (required !== undefined &&
      (required.length === 0 || hasAnyPermission(required)));

  if (allowed) return <>{children}</>;

  return (
    <div className="flex min-h-[500px] items-center justify-center p-6">
      <div className="mx-auto w-full max-w-md space-y-6 text-center">
        <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-destructive/10">
          <ShieldAlert className="size-10 text-destructive" />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-black uppercase tracking-widest text-destructive">
            {t("403 Forbidden")}
          </p>
          <h2 className="text-2xl font-bold tracking-tight">
            {t("Access Denied")}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("You don't have the required permissions to access this page.")}
            <br />
            {t("Contact your administrator to request access.")}
          </p>
        </div>

        <div className="space-y-2 rounded-lg border bg-muted/50 p-4 text-left">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">{t("Page")}</span>
            <span className="min-w-0 truncate font-mono text-xs">
              {pathname}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">{t("Your Role")}</span>
            <span className="font-medium capitalize">
              {role?.name ? t(role.name) : t("Unknown")}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" onClick={() => router.back()} className="gap-2">
            <ArrowLeft className="size-4" />
            {t("Go Back")}
          </Button>
          <Button onClick={() => router.replace(homePath)} className="gap-2">
            <Home className="size-4" />
            {t("Home")}
          </Button>
        </div>
      </div>
    </div>
  );
}
