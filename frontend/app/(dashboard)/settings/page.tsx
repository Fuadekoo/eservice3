"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Settings } from "lucide-react";
import { AppearanceTab } from "./_tabs/appearance-tab";
import { OfficeInfoTab } from "./_tabs/office-info-tab";
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

  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: sessionData, isPending } = useSession();
  const session = sessionData?.session;

  // Determine if user is an office Admin (not Super Admin)
  const roleName = session?.role?.name?.toLowerCase() || "";
  const userType = (session?.user as any)?.userType || "";
  const isOfficeAdmin = roleName === "admin" && userType === "OFFICE_USER";

  // The brand palette is system-wide: one colour every user of the office
  // sees, so only an administrator may change it. Matched to the API's own
  // admin test (roleName === "ADMIN") rather than a looser one, so the tab is
  // never offered to somebody whose save would come back a 403.
  const isAdmin = roleName === "admin";

  const requestedTab = searchParams.get("tab");

  // Personal details moved to their own page; keep old ?tab=profile links working.
  React.useEffect(() => {
    if (requestedTab === "profile") router.replace("/profile");
  }, [requestedTab, router]);

  const [activeTab, setActiveTab] = React.useState(
    requestedTab && requestedTab !== "profile" ? requestedTab : "preferences",
  );

  const tabs: PageTab[] = [
    { label: t("Preferences"), value: "preferences" },
    { label: t("Security"), value: "security" },
    ...(isAdmin ? [{ label: t("Appearance"), value: "appearance" }] : []),
    ...(isOfficeAdmin ? [{ label: t("Company Info"), value: "office-info" }] : []),
  ];

  // A link to a tab this account cannot open — a shared ?tab= URL, or a role
  // that changed since the link was saved — falls back to Preferences instead
  // of rendering an empty page. Held back until the session is known, so an
  // administrator's deep link is not bounced while their role is still loading.
  const currentTab =
    isPending || tabs.some((tab) => tab.value === activeTab)
      ? activeTab
      : "preferences";

  // Avoid flashing the settings body during the redirect above.
  if (requestedTab === "profile") {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        {t("Loading settings...")}
      </div>
    );
  }

  return (
    <PageLayout
      title={t("Settings")}
      description={t("Manage your application settings and preferences")}
      icon={Settings}
      tabs={tabs}
      activeTab={currentTab}
      onTabChange={setActiveTab}
    >
      {currentTab === "preferences" && <PreferencesTab />}
      {currentTab === "security" && <SecurityTab />}
      {currentTab === "appearance" && isAdmin && <AppearanceTab />}
      {currentTab === "office-info" && isOfficeAdmin && <OfficeInfoTab />}
    </PageLayout>
  );
}
