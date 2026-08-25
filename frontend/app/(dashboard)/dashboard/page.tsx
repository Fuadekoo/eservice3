"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, LayoutDashboard } from "lucide-react";

import { PageLayout } from "@/components/dashboard/page-layout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { usePermissions } from "@/lib/hooks/use-permissions";
import { getRoleOverviewPath } from "@/lib/role-overview";
import { useTranslation } from "@/lib/i18n";

export default function DashboardPage() {
  const { t } = useTranslation();

  const router = useRouter();
  const { role, isLoading } = usePermissions();
  const overviewPath = getRoleOverviewPath(role?.name);

  React.useEffect(() => {
    if (isLoading || !overviewPath) return;
    router.replace(overviewPath);
  }, [isLoading, overviewPath, router]);

  if (isLoading || overviewPath) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="size-7 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <PageLayout
      title={t("Dashboard")}
      description={t("No role-specific overview is configured for this account.")}
      icon={LayoutDashboard}
    >
      <Alert>
        <AlertTitle>{t("Overview unavailable")}</AlertTitle>
        <AlertDescription>
          {t("Your role")}{role?.name ? ` (${role.name})` : ""} {t("does not have an overview page configured. Please contact an administrator.")}
        </AlertDescription>
      </Alert>
    </PageLayout>
  );
}
