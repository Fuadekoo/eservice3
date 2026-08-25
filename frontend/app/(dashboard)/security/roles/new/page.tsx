"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { useSecurityStore, type Permission } from "@/lib/stores/security-store";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "@/lib/i18n";

export default function NewRolePage() {
  const { t } = useTranslation();

  const router = useRouter();
  const securityStore = useSecurityStore();
  const [selectedPermissionCodes, setSelectedPermissionCodes] = React.useState<string[]>([]);
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

  const handleTogglePermission = React.useCallback((code: string, checked: boolean) => {
    setSelectedPermissionCodes((previous) =>
      checked
        ? Array.from(new Set([...previous, code]))
        : previous.filter((permissionCode) => permissionCode !== code)
    );
  }, []);

  const groupedPermissions = React.useMemo(() => {
    const groups: Record<string, Permission[]> = {};
    securityStore.permissions.forEach((permission) => {
      let category = "Miscellaneous";
      if (permission.code?.includes(".")) {
        category = permission.code.split(".")[0];
      } else if (permission.code?.includes("_")) {
        category = permission.code.split("_")[0];
      }

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

      const groupName = categoryMap[category] || category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, " ");

      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(permission);
    });

    return Object.keys(groups)
      .sort()
      .reduce((acc, key) => {
        acc[key] = groups[key];
        return acc;
      }, {} as Record<string, Permission[]>);
  }, [securityStore.permissions]);

  const allSelected = securityStore.permissions.length > 0 && selectedPermissionCodes.length === securityStore.permissions.length;
  const someSelected = selectedPermissionCodes.length > 0 && selectedPermissionCodes.length < securityStore.permissions.length;

  const handleSelectAll = React.useCallback((checked: boolean) => {
    if (checked) {
      setSelectedPermissionCodes(securityStore.permissions.map((p) => p.code));
    } else {
      setSelectedPermissionCodes([]);
    }
  }, [securityStore.permissions]);

  const handleToggleGroup = React.useCallback((groupPermissions: Permission[], checked: boolean) => {
    const codes = groupPermissions.map(p => p.code);
    setSelectedPermissionCodes((previous) => {
      if (checked) {
        return Array.from(new Set([...previous, ...codes]));
      } else {
        return previous.filter((code) => !codes.includes(code));
      }
    });
  }, []);

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
        permissions: selectedPermissionCodes.length > 0 ? selectedPermissionCodes : undefined,
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
        description={t("Define a new access role and align the permissions required to support it.")}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/security/roles">{t("Cancel")}</Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>{t("Role information")}</CardTitle>
          <CardDescription>{t("Set the role profile and choose the capabilities it should grant.")}</CardDescription>
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
                placeholder={t("Briefly describe what this role is responsible for.")}
              />
            </div>

            <div className="space-y-4 border-t pt-6">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">{t("Permissions")}</h2>
                <p className="text-sm text-muted-foreground">
                  {t("Select every permission that should be bundled with this role. ({count} selected)", { count: selectedPermissionCodes.length })}
                </p>
              </div>
              {loading ? (
                <div className="py-8 text-center text-sm text-muted-foreground">{t("Loading permissions...")}</div>
              ) : securityStore.permissions.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">{t("No permissions available")}</div>
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
                      {selectedPermissionCodes.length} / {securityStore.permissions.length} {t("selected")}
                    </Badge>
                  </div>

                  <Accordion type="multiple" defaultValue={Object.keys(groupedPermissions)} className="w-full">
                    {Object.entries(groupedPermissions).map(([groupName, groupPermissions]) => {
                      const groupCodes = groupPermissions.map(p => p.code);
                      const selectedInGroup = groupCodes.filter(code => selectedPermissionCodes.includes(code));
                      const allGroupSelected = selectedInGroup.length === groupPermissions.length;
                      const someGroupSelected = selectedInGroup.length > 0 && selectedInGroup.length < groupPermissions.length;

                      return (
                        <AccordionItem key={groupName} value={groupName} className="border-none">
                          <div className="flex items-center gap-3 px-2">
                            <Checkbox
                              id={`group-${groupName}`}
                              checked={someGroupSelected ? "indeterminate" : allGroupSelected}
                              onCheckedChange={(checked) => handleToggleGroup(groupPermissions, checked === true)}
                              aria-label={t("Select {group} permissions", { group: groupName })}
                              className={someGroupSelected ? "data-[state=unchecked]:bg-primary data-[state=unchecked]:text-primary-foreground" : ""}
                            />
                            <AccordionTrigger className="flex-1 py-2 hover:no-underline">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{t(groupName)}</span>
                                <Badge variant="secondary" className="h-4 px-1.5 py-0 text-[10px] font-normal">
                                  {selectedInGroup.length}/{groupPermissions.length}
                                </Badge>
                              </div>
                            </AccordionTrigger>
                          </div>
                          <AccordionContent>
                            <div className="grid gap-3 pt-2 sm:grid-cols-2">
                              {groupPermissions.map((permission) => {
                                const isChecked = selectedPermissionCodes.includes(permission.code);
                                return (
                                  <label
                                    key={permission.id}
                                    className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/70 bg-background p-3 transition hover:border-primary/60 hover:bg-muted/50"
                                  >
                                    <Checkbox
                                      checked={isChecked}
                                      onCheckedChange={(checked) =>
                                        handleTogglePermission(permission.code, checked === true)
                                      }
                                      aria-label={permission.name}
                                    />
                                    <div className="flex-1">
                                      <span className="text-sm font-medium leading-tight">{permission.name}</span>
                                      {permission.description && (
                                        <p className="mt-1 text-xs text-muted-foreground">{permission.description}</p>
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
                    })}
                  </Accordion>
                </div>
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
