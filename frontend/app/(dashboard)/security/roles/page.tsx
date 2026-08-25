"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { RoleCatalogPage } from "@/components/dashboard/role-catalog-page";
import { useTranslation } from "@/lib/i18n";

export default function SecurityRolesPage() {
  const { t } = useTranslation();

  return (
    <ProtectedRoute requiredPermission="roles.view">
      <RoleCatalogPage basePath="/security/roles" title={t("Security Roles")} />
    </ProtectedRoute>
  );
}
