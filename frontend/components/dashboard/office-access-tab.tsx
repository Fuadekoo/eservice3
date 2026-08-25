"use client";

import * as React from "react";
import {
  Shield,
  MoreHorizontal,
  Settings2,
  CheckCircle2,
  Plus,
  Search,
  Key,
  Trash2,
} from "lucide-react";
import { useSecurityStore } from "@/lib/stores/security-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { RolePermissionDialog } from "./role-permission-dialog";
import { RoleCreateDialog } from "./role-create-dialog";
import { useTranslation } from "@/lib/i18n";

interface OfficeAccessTabProps {
  officeId: string;
}

export function OfficeAccessTab({ officeId }: OfficeAccessTabProps) {
  const { t } = useTranslation();

  // Implementation of OfficeAccessTab
  const { roles, isLoading, fetchRoles, deleteRole } = useSecurityStore();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [editingRoleId, setEditingRoleId] = React.useState<string | null>(null);
  const [permissionDialogOpen, setPermissionDialogOpen] = React.useState(false);
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);

  React.useEffect(() => {
    fetchRoles({ search: searchQuery, officeId });
  }, [fetchRoles, searchQuery, officeId]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this role?")) return;
    try {
      await deleteRole(id);
      toast.success(t("Role deleted successfully"));
    } catch (error) {
      toast.error(t("Failed to delete role"));
    }
  };

  const handleEditPermissions = (id: string) => {
    setEditingRoleId(id);
    setPermissionDialogOpen(true);
  };

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="px-0 pt-0 pb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between space-y-0">
        <div className="flex min-w-0 items-start gap-3 sm:items-center">
          <div className="p-2 bg-primary/10 text-primary rounded-lg">
            <Shield className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-bold sm:text-xl">
                {t("Access Control")}
              </CardTitle>
              <Badge
                variant="secondary"
                className="bg-secondary text-secondary-foreground border-transparent font-medium"
              >
                {roles.length} {t("Roles")}
              </Badge>
            </div>
            <CardDescription>
              {t("Manage user roles and their associated permissions")}
            </CardDescription>
          </div>
        </div>
        <Button
          className="gap-2 w-full sm:w-auto"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="size-4" />
          {t("Create Role")}
        </Button>
      </CardHeader>

      <CardContent className="px-0">
        <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:items-center sm:gap-4">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder={t("Search roles...")}
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[300px] font-semibold text-foreground">
                  {t("Role Name")}
                </TableHead>
                <TableHead className="font-semibold text-foreground">
                  {t("Permissions")}
                </TableHead>
                <TableHead className="font-semibold text-foreground">
                  {t("Assigned Users")}
                </TableHead>
                <TableHead className="font-semibold text-foreground">
                  {t("Status")}
                </TableHead>
                <TableHead className="text-right font-semibold text-foreground">
                  {t("Actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-12 w-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-8 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : roles.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground"
                  >
                    {t("No roles found.")}
                  </TableCell>
                </TableRow>
              ) : (
                roles.map((role) => (
                  <TableRow
                    key={role.id}
                    className="group hover:bg-muted/40 transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <Key className="size-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground">
                            {role.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {t("ID:")} {role.id.substring(0, 8)}...
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="size-4 text-primary" />
                        <span className="text-sm font-medium text-muted-foreground">
                          {role.permissions?.length || 0} {t("Modules")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {role.memberCount || 0} {t("Users")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-transparent rounded-md px-2 py-0.5 text-[10px] font-bold">
                        {t("ACTIVE")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 hover:bg-accent hover:shadow-sm border-transparent hover:border-border border"
                          >
                            <MoreHorizontal className="size-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>{t("Role Management")}</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="gap-2"
                            onClick={() => handleEditPermissions(role.id)}
                          >
                            <Settings2 className="size-4" /> {t("Edit Permissions")}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2">
                            <Plus className="size-4" /> {t("Duplicate Role")}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="gap-2 text-red-600 focus:text-red-600 focus:bg-red-50"
                            onClick={() => handleDelete(role.id)}
                            disabled={
                              role.name.toUpperCase() === "MANAGER" ||
                              role.name.toUpperCase() === "ADMIN" ||
                              role.name.toUpperCase() === "SUPERADMIN"
                            }
                          >
                            <Trash2 className="size-4" /> {t("Delete Role")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <RolePermissionDialog
          open={permissionDialogOpen}
          onOpenChange={setPermissionDialogOpen}
          roleId={editingRoleId}
          onSuccess={() => fetchRoles({ search: searchQuery, officeId })}
        />

        <RoleCreateDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          officeId={officeId}
          onSuccess={() => fetchRoles({ search: searchQuery, officeId })}
        />
      </CardContent>
    </Card>
  );
}
