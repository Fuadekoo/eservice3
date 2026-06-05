"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { RoleCatalogPage } from "@/components/dashboard/role-catalog-page";

export default function SecurityRolesPage() {
  return (
    <ProtectedRoute requiredPermission="roles.view">
      <RoleCatalogPage basePath="/security/roles" title="Security Roles" />
    </ProtectedRoute>
  );
}
