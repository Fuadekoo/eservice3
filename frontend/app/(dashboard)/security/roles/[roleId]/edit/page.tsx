"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";

import { PageHeader } from "@/components/dashboard/page-header";
import { PermissionPicker } from "@/components/dashboard/permission-picker";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSecurityStore } from "@/lib/stores/security-store";
import { useTranslation } from "@/lib/i18n";

export default function EditRolePage() {
  const { t } = useTranslation();

  const router = useRouter();
  const params = useParams();
  const roleId = params.roleId as string;

  const {
    roles,
    permissions,
    isLoading,
    fetchRoles,
    fetchPermissions,
    updateRole,
  } = useSecurityStore();
  const [selectedPermissionCodes, setSelectedPermissionCodes] = React.useState<
    string[]
  >([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const role = React.useMemo(
    () => roles.find((r) => r.id === roleId) || null,
    [roles, roleId],
  );

  // Access is decided by RouteGuard in the dashboard layout, which knows this
  // page needs `page:admin:roles` or `role:update` and shows a 403 when it is
  // missing. A second check here used to redirect on its own, and it ran
  // before usePermissions had read the stored role — so on the very first
  // render nobody was an administrator yet and everyone was bounced to
  // /dashboard, which then forwards to their own overview.
  React.useEffect(() => {
    if (roleId) {
      void Promise.all([fetchRoles(), fetchPermissions()]);
    }
  }, [roleId, fetchRoles, fetchPermissions]);

  React.useEffect(() => {
    if (role) {
      setSelectedPermissionCodes(
        role.permissions
          .map((p) => p.code)
          .filter((c): c is string => typeof c === "string" && c.length > 0),
      );
    } else if (roles.length > 0 && !isLoading) {
      toast.error(t("Role not found"));
      router.push("/security/roles");
    }
  }, [role, roles, isLoading, router]);

  // Selection lives here; PermissionPicker owns the grouping, the search and
  // every checkbox rule that goes with them.
  const handlePermissionsChange = React.useCallback((codes: string[]) => {
    setSelectedPermissionCodes(codes);
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!role) return;

    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const name = formData.get("role-name") as string;
    const description = formData.get("role-description") as string;

    try {
      await updateRole(role.id, {
        name,
        description: description || undefined,
        permissions: selectedPermissionCodes.filter(
          (c): c is string => typeof c === "string" && c.length > 0,
        ),
      });
      toast.success(t("Role updated successfully"));
      router.push("/security/roles");
    } catch (error) {
      toast.error(t("Failed to update role"));
      console.error(error);
      setIsSubmitting(false);
    }
  }

  if (isLoading || !role) {
    return (
      <div className="space-y-8">
        <PageHeader title={t("Edit role")} description={t("Loading...")} />
        <div className="py-8 text-center text-sm text-muted-foreground">
          {t("Loading role data...")}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("Edit role – {name}", { name: role.name })}
        description={t("Adjust role details and permission bundles.")}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/security/roles">{t("Back to roles")}</Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>{t("Role details")}</CardTitle>
          <CardDescription>
            {t(
              "Update the metadata and permissions associated with this role.",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="role-name">{t("Role name")}</Label>
              <Input
                id="role-name"
                name="role-name"
                placeholder={t("Role title")}
                defaultValue={role.name}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role-description">{t("Description")}</Label>
              <Textarea
                id="role-description"
                name="role-description"
                rows={3}
                placeholder={t("Brief summary of responsibilities")}
                defaultValue={role.description || ""}
              />
            </div>

            <div className="space-y-4 border-t pt-6">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">{t("Permissions")}</h2>
                <p className="text-sm text-muted-foreground">
                  {t(
                    "Toggle the permissions associated with this role. ({count} selected)",
                    { count: selectedPermissionCodes.length },
                  )}
                </p>
              </div>
              <PermissionPicker
                permissions={permissions}
                selected={selectedPermissionCodes}
                onChange={handlePermissionsChange}
                disabled={isSubmitting}
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="outline" asChild>
                <Link href="/security/roles">{t("Cancel")}</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t("Saving...") : t("Save changes")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
