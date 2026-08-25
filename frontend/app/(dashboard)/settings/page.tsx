"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Settings } from "lucide-react";
import { OfficeInfoTab } from "./_tabs/office-info-tab";
import { ProfileTab } from "./_tabs/profile-tab";
import { PreferencesTab } from "./_tabs/preferences-tab";
import { SecurityTab } from "./_tabs/security-tab";
import { useSession } from "@/hooks/use-session";
import { PageLayout, type PageTab } from "@/components/dashboard/page-layout";
import { useTranslation } from "@/lib/i18n";

export default function SettingsPage() {
  const { t } = useTranslation();

  return (
    <React.Suspense
      fallback={
        <div className="py-10 text-center text-sm text-muted-foreground">
          {t("Loading settings...")}
        </div>
      }
    >
      <SettingsContent />
    </React.Suspense>
  );
}

function SettingsContent() {
  const { t } = useTranslation();

  const searchParams = useSearchParams();
  const { data: sessionData } = useSession();
  const session = sessionData?.session;

  // Determine if user is an office Admin (not Super Admin)
  const roleName = session?.role?.name?.toLowerCase() || "";
  const userType = (session?.user as any)?.userType || "";
  const isOfficeAdmin = roleName === "admin" && userType === "OFFICE_USER";

  const [activeTab, setActiveTab] = React.useState(
    searchParams.get("tab") || "profile",
  );

  const tabs: PageTab[] = [
    { label: t("Profile"), value: "profile" },
    { label: t("Preferences"), value: "preferences" },
    { label: t("Security"), value: "security" },
    ...(isOfficeAdmin ? [{ label: t("Company Info"), value: "office-info" }] : []),
  ];

  return (
    <PageLayout
      title={t("Settings")}
      description={t("Manage your application settings and preferences")}
      icon={Settings}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {activeTab === "profile" && <ProfileTab />}
      {activeTab === "preferences" && <PreferencesTab />}
      {activeTab === "security" && <SecurityTab />}
      {activeTab === "office-info" && isOfficeAdmin && <OfficeInfoTab />}
    </PageLayout>
  );
}
