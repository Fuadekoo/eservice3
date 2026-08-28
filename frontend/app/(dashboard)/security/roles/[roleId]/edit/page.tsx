"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";

import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useSecurityStore,
  type Permission,
  type Role,
} from "@/lib/stores/security-store";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
        role.permissions.map((p) => p.code).filter((c): c is string => typeof c === "string" && c.length > 0),
      );
    } else if (roles.length > 0 && !isLoading) {
      toast.error(t("Role not found"));
      router.push("/security/roles");
    }
  }, [role, roles, isLoading, router]);

  const handleTogglePermission = React.useCallback(
    (code: string, checked: boolean) => {
      setSelectedPermissionCodes((previous) =>
        checked
          ? Array.from(new Set([...previous, code]))
          : previous.filter((permissionCode) => permissionCode !== code),
      );
    },
    [],
  );

  const groupedPermissions = React.useMemo(() => {
    const groups: Record<string, Permission[]> = {};
    permissions.forEach((permission) => {
      let category = "Miscellaneous";
      if (permission.code?.includes(".")) {
        category = permission.code.split(".")[0];
      } else if (permission.code?.includes("_")) {
        category = permission.code.split("_")[0];
      }

      // Special cases or manual mapping can go here
      const categoryMap: Record<string, string> = {
        users: "User Management",
        officers: "User Management",
        roles: "Security & Access",
        permissions: "Security & Access",
        audit_logs: "Security & Access",
        offices: "Office Settings",
        services: "Service Management",
        inventory: "Inventory Management",
        products: "Product Management",
        categories: "Product Management",
        measurements: "Product Management",
        suppliers: "Contacts",
        customers: "Contacts",
        stock_in: "Stock Operations",
        stock_out: "Stock Operations",
        stock_transfers: "Stock Operations",
        stock_returns: "Stock Operations",
        bank_accounts: "Finance",
        bank_deposits: "Finance",
        bank_withdrawals: "Finance",
        payments: "Finance",
        finance: "Finance",
        subscriptions: "Platform Management",
        plans: "Platform Management",
        dashboard: "Dashboard & Reports",
        reports: "Dashboard & Reports",
        system: "System Administration",
      };

      const groupName =
        categoryMap[category] ||
        category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, " ");

      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(permission);
    });

    // Sort groups alphabetically
    return Object.keys(groups)
      .sort()
      .reduce(
        (acc, key) => {
          acc[key] = groups[key];
          return acc;
        },
        {} as Record<string, Permission[]>,
      );
  }, [permissions]);

  const allSelected =
    permissions.length > 0 &&
    selectedPermissionCodes.length === permissions.length;
  const someSelected =
    selectedPermissionCodes.length > 0 &&
    selectedPermissionCodes.length < permissions.length;

  const handleSelectAll = React.useCallback(
    (checked: boolean) => {
      if (checked) {
        setSelectedPermissionCodes(
          permissions.map((p) => p.code).filter((c): c is string => typeof c === "string" && c.length > 0),
        );
      } else {
        setSelectedPermissionCodes([]);
      }
    },
    [permissions],
  );

  const handleToggleGroup = React.useCallback(
    (groupPermissions: Permission[], checked: boolean) => {
      const codes = groupPermissions.map((p) => p.code);
      setSelectedPermissionCodes((previous) => {
        if (checked) {
          return Array.from(new Set([...previous, ...codes]));
        } else {
          return previous.filter((code) => !codes.includes(code));
        }
      });
    },
    [],
  );

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
        permissions: selectedPermissionCodes.filter((c): c is string => typeof c === "string" && c.length > 0),
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
            {t("Update the metadata and permissions associated with this role.")}
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
                  {t("Toggle the permissions associated with this role. ({count} selected)", { count: selectedPermissionCodes.length })}
                </p>
              </div>
              {permissions.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  {t("No permissions available")}
                </div>
              ) : (
                <div className="rounded-lg border bg-muted/30 p-4">
                  <div className="mb-4 flex items-center justify-between border-b pb-3 px-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="select-all"
                        checked={someSelected ? "indeterminate" : allSelected}
                        onCheckedChange={handleSelectAll}
                        aria-label={t("Select all permissions")}
                      />
                      <Label
                        htmlFor="select-all"
                        className="cursor-pointer text-sm font-semibold"
                      >
                        {t("Select All Permissions")}
                      </Label>
                    </div>
                    <Badge variant="outline" className="font-normal">
                      {selectedPermissionCodes.length} / {permissions.length}{" "}
                      {t("selected")}
                    </Badge>
                  </div>

                  <Accordion
                    type="multiple"
                    defaultValue={Object.keys(groupedPermissions)}
                    className="w-full"
                  >
                    {Object.entries(groupedPermissions).map(
                      ([groupName, groupPermissions]) => {
                        const groupCodes = groupPermissions.map((p) => p.code);
                        const selectedInGroup = groupCodes.filter((code) =>
                          selectedPermissionCodes.includes(code),
                        );
                        const allGroupSelected =
                          selectedInGroup.length === groupPermissions.length;
                        const someGroupSelected =
                          selectedInGroup.length > 0 &&
                          selectedInGroup.length < groupPermissions.length;

                        return (
                          <AccordionItem
                            key={groupName}
                            value={groupName}
                            className="border-none"
                          >
                            <div className="flex items-center gap-3 px-2">
                              <Checkbox
                                id={`group-${groupName}`}
                                checked={
                                  someGroupSelected
                                    ? "indeterminate"
                                    : allGroupSelected
                                }
                                onCheckedChange={(checked) =>
                                  handleToggleGroup(
                                    groupPermissions,
                                    checked === true,
                                  )
                                }
                                aria-label={t("Select {group} permissions", { group: groupName })}
                                className={
                                  someGroupSelected
                                    ? "data-[state=unchecked]:bg-primary data-[state=unchecked]:text-primary-foreground"
                                    : ""
                                }
                              />
                              <AccordionTrigger className="flex-1 py-2 hover:no-underline">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">
                                    {t(groupName)}
                                  </span>
                                  <Badge
                                    variant="secondary"
                                    className="h-4 px-1.5 py-0 text-[10px] font-normal"
                                  >
                                    {selectedInGroup.length}/
                                    {groupPermissions.length}
                                  </Badge>
                                </div>
                              </AccordionTrigger>
                            </div>
                            <AccordionContent>
                              <div className="grid gap-3 pt-2 sm:grid-cols-2">
                                {groupPermissions.map((permission) => {
                                  const isChecked =
                                    selectedPermissionCodes.includes(
                                      permission.code,
                                    );
                                  return (
                                    <label
                                      key={permission.id}
                                      className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/70 bg-background p-3 transition hover:border-primary/60 hover:bg-muted/50"
                                    >
                                      <Checkbox
                                        checked={isChecked}
                                        onCheckedChange={(checked) =>
                                          handleTogglePermission(
                                            permission.code,
                                            checked === true,
                                          )
                                        }
                                        aria-label={permission.name}
                                      />
                                      <div className="flex-1">
                                        <span className="text-sm font-medium leading-tight">
                                          {permission.name}
                                        </span>
                                        {permission.description && (
                                          <p className="mt-1 text-xs text-muted-foreground">
                                            {permission.description}
                                          </p>
                                        )}
                                      </div>
                                    </label>
                                  );
                                })}
                              </div>
                              <Separator className="mt-4" />
                            </AccordionContent>
                          </AccordionItem>
                        );
                      },
                    )}
                  </Accordion>
                </div>
              )}
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
