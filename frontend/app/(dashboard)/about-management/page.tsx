"use client";

import * as React from "react";
import { Info } from "lucide-react";
import { PageLayout, type PageTab } from "@/components/dashboard/page-layout";
import { AdministratorsTab } from "./_components/administrators-tab";
import { AboutContentTab } from "./_components/about-content-tab";
import { useTranslation } from "@/lib/i18n";

export default function AboutPage() {
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = React.useState("administrators");

  const tabs: PageTab[] = [
    { label: t("Administrators"), value: "administrators" },
    { label: t("About Content"), value: "content" },
  ];

  return (
    <PageLayout
      title={t("About Page Management")}
      description={t("Manage administrators and about page content")}
      icon={Info}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {activeTab === "administrators" && <AdministratorsTab />}
      {activeTab === "content" && <AboutContentTab />}
    </PageLayout>
  );
}
