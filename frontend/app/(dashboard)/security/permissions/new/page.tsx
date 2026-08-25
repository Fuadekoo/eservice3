"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { useSecurityStore } from "@/lib/stores/security-store";
import { useTranslation } from "@/lib/i18n";

export default function NewPermissionPage() {
  const { t } = useTranslation();

  const router = useRouter();
  const securityStore = useSecurityStore();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const code = formData.get("permission-code") as string;
    const name = formData.get("permission-name") as string;
    const description = formData.get("permission-description") as string;

    try {
      await securityStore.createPermission({
        code,
        name,
        description: description || undefined,
      });
      toast.success(t("Permission created successfully"));
      router.push("/security/permissions");
    } catch (error) {
      toast.error(t("Failed to create permission"));
      console.error(error);
      setIsSubmitting(false);
    }
  }

  return (
    <ProtectedRoute requiredPermission="permissions.create">
      <div className="space-y-8">
        <PageHeader
          title={t("Add permission")}
          description={t("Define a new access permission for Bekolas systems.")}
          actions={
            <Button variant="outline" size="sm" asChild>
              <Link href="/security/permissions">{t("Cancel")}</Link>
            </Button>
          }
        />

        <Card>
          <CardHeader>
            <CardTitle>{t("Permission information")}</CardTitle>
            <CardDescription>
              {t("Set the permission code, name, and description.")}
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
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button type="button" variant="outline" asChild>
                  <Link href="/security/permissions">{t("Cancel")}</Link>
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? t("Saving...") : t("Save permission")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
