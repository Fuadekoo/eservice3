"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";

import { PageHeader } from "@/components/dashboard/page-header";
import { ProtectedRoute } from "@/components/auth/protected-route";
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
import { useSecurityStore, type Permission } from "@/lib/stores/security-store";
import { useTranslation } from "@/lib/i18n";

export default function EditPermissionPage() {
  const { t } = useTranslation();

  const router = useRouter();
  const params = useParams();
  const permissionId = params.permissionId as string;
  const securityStore = useSecurityStore();

  const [permission, setPermission] = React.useState<Permission | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (permissionId) {
      loadPermission();
    }
  }, [permissionId]);

  async function loadPermission() {
    try {
      setLoading(true);
      await securityStore.fetchPermissions();
      const foundPermission = securityStore.permissions.find(
        (p) => p.id === permissionId
      );
      if (!foundPermission) {
        toast.error(t("Permission not found"));
        router.push("/security/permissions");
        return;
      }
      setPermission(foundPermission);
    } catch (error) {
      toast.error(t("Failed to load permission"));
      console.error(error);
      router.push("/security/permissions");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!permission) return;

    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const code = formData.get("permission-code") as string;
    const name = formData.get("permission-name") as string;
    const description = formData.get("permission-description") as string;

    try {
      await securityStore.updatePermission(permission.id, {
        code,
        name,
        description: description || undefined,
      });
      toast.success(t("Permission updated successfully"));
      router.push("/security/permissions");
    } catch (error) {
      toast.error(t("Failed to update permission"));
      console.error(error);
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <ProtectedRoute requiredPermission="permissions.update">
        <div className="space-y-8">
          <PageHeader title={t("Edit permission")} description={t("Loading...")} />
          <div className="py-8 text-center text-sm text-muted-foreground">
            {t("Loading permission data...")}
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!permission) {
    return null;
  }

  return (
    <ProtectedRoute requiredPermission="permissions.update">
      <div className="space-y-8">
        <PageHeader
          title={t("Edit permission – {name}", { name: permission.name })}
          description={t("Update permission details.")}
          actions={
            <Button variant="outline" size="sm" asChild>
              <Link href="/security/permissions">{t("Back to permissions")}</Link>
            </Button>
          }
        />

        <Card>
          <CardHeader>
            <CardTitle>{t("Permission details")}</CardTitle>
            <CardDescription>
              {t("Update the permission code, name, and description.")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="permission-code">{t("Permission code")}</Label>
                <Input
                  id="permission-code"
                  name="permission-code"
                  placeholder={t("e.g. students.create")}
                  defaultValue={permission.code}
                  required
                  pattern="[a-z0-9._-]+"
                  title={t("Use lowercase letters, numbers, dots, underscores, or hyphens")}
                />
                <p className="text-xs text-muted-foreground">
                  {t("Unique identifier for this permission (lowercase, use dots or underscores)")}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="permission-name">{t("Permission name")}</Label>
                <Input
                  id="permission-name"
                  name="permission-name"
                  placeholder={t("e.g. Create Students")}
                  defaultValue={permission.name}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="permission-description">{t("Description")}</Label>
                <Textarea
                  id="permission-description"
                  name="permission-description"
                  rows={3}
                  placeholder={t("Briefly describe what this permission allows.")}
                  defaultValue={permission.description || ""}
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button type="button" variant="outline" asChild>
                  <Link href="/security/permissions">{t("Cancel")}</Link>
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? t("Saving...") : t("Save changes")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
