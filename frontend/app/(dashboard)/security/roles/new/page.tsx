"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

export default function NewRolePage() {
  const { t } = useTranslation();

  const router = useRouter();
  const securityStore = useSecurityStore();
  const [selectedPermissionCodes, setSelectedPermissionCodes] = React.useState<
    string[]
  >([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadPermissions();
  }, []);

  async function loadPermissions() {
    try {
      setLoading(true);
      await securityStore.fetchPermissions();
    } catch (error) {
      toast.error(t("Failed to load permissions"));
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const name = formData.get("role-name") as string;
    const description = formData.get("role-description") as string;

    try {
      await securityStore.createRole({
        name,
        description: description || undefined,
        permissions:
          selectedPermissionCodes.length > 0
            ? selectedPermissionCodes
            : undefined,
      });
      toast.success(t("Role created successfully"));
      router.push("/security/roles");
    } catch (error) {
      toast.error(t("Failed to create role"));
      console.error(error);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("Add role")}
        description={t(
          "Define a new access role and align the permissions required to support it.",
        )}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/security/roles">{t("Cancel")}</Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>{t("Role information")}</CardTitle>
          <CardDescription>
            {t(
              "Set the role profile and choose the capabilities it should grant.",
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
                placeholder={t("e.g. Compliance Officer")}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role-description">{t("Description")}</Label>
              <Textarea
                id="role-description"
                name="role-description"
                rows={3}
                placeholder={t(
                  "Briefly describe what this role is responsible for.",
                )}
              />
            </div>

            <div className="space-y-4 border-t pt-6">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">{t("Permissions")}</h2>
                <p className="text-sm text-muted-foreground">
                  {t(
                    "Select every permission that should be bundled with this role. ({count} selected)",
                    { count: selectedPermissionCodes.length },
                  )}
                </p>
              </div>
              {loading ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  {t("Loading permissions...")}
                </div>
              ) : (
                <PermissionPicker
                  permissions={securityStore.permissions}
                  selected={selectedPermissionCodes}
                  onChange={setSelectedPermissionCodes}
                  disabled={isSubmitting}
                />
              )}
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="outline" asChild>
                <Link href="/security/roles">{t("Cancel")}</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting || loading}>
                {isSubmitting ? t("Saving...") : t("Save role")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
