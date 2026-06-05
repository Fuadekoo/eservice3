"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OfficeInfoTab } from "./_tabs/office-info-tab";
import { ProfileTab } from "./_tabs/profile-tab";
import { PreferencesTab } from "./_tabs/preferences-tab";
import { SecurityTab } from "./_tabs/security-tab";
import { useSession } from "@/hooks/use-session";

export default function SettingsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="py-10 text-center text-sm text-muted-foreground">
          Loading settings...
        </div>
      }
    >
      <SettingsContent />
    </React.Suspense>
  );
}

function SettingsContent() {
  const searchParams = useSearchParams();
  const { data: sessionData } = useSession();
  const session = sessionData?.session;

  // Determine if user is an office Admin (not Super Admin)
  const roleName = session?.role?.name?.toLowerCase() || "";
  const userType = (session?.user as any)?.userType || "";
  const isOfficeAdmin = roleName === "admin" && userType === "OFFICE_USER";

  const defaultTab = searchParams.get("tab") || "profile";

  return (
    <div className="space-y-8">
      <PageHeader
        title="Settings"
        description="Manage your application settings and preferences"
      />

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          {isOfficeAdmin && (
            <TabsTrigger value="office-info">Office</TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="profile" className="mt-6">
          <ProfileTab />
        </TabsContent>
        <TabsContent value="preferences" className="mt-6">
          <PreferencesTab />
        </TabsContent>
        <TabsContent value="security" className="mt-6">
          <SecurityTab />
        </TabsContent>
        {isOfficeAdmin && (
          <TabsContent value="office-info" className="mt-6">
            <OfficeInfoTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
