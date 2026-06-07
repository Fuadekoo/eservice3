"use client";

import * as React from "react";
import { Users, Info } from "lucide-react";
import { PageLayout, type PageTab } from "@/components/dashboard/page-layout";
import { AdministratorsTab } from "./_components/administrators-tab";
import { AboutContentTab } from "./_components/about-content-tab";

export default function AboutPage() {
  const [activeTab, setActiveTab] = React.useState("administrators");

  const tabs: PageTab[] = [
    { label: "Administrators", value: "administrators" },
    { label: "About Content", value: "content" },
  ];

  return (
    <PageLayout
      title="About Page Management"
      description="Manage administrators and about page content"
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
