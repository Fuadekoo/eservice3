"use client";

import { User } from "lucide-react";

import { PageLayout } from "@/components/dashboard/page-layout";
import { useTranslation } from "@/lib/i18n";
import { ProfileView } from "./_components/profile-view";

/**
 * The signed-in user's own account: identity, photo, and personal details.
 * Kept separate from /settings, which covers application preferences,
 * security, and office configuration.
 */
export default function ProfilePage() {
  const { t } = useTranslation();

  return (
    <PageLayout
      title={t("My Profile")}
      description={t("View and update your personal details")}
      icon={User}
    >
      <ProfileView />
    </PageLayout>
  );
}
