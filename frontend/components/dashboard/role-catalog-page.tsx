"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Edit2,
  KeyRound,
  LayoutGrid,
  List,
  Plus,
  Search,
  Shield,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { PermissionGuard } from "@/components/auth/permission-guard";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSecurityStore, type Role } from "@/lib/stores/security-store";

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: typeof Shield;
}) {
  return (
    <Card className="border-border/60">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="space-y-1">
          <CardDescription>{title}</CardDescription>
          <CardTitle className="text-2xl">{value}</CardTitle>
        </div>
        <div className="rounded-xl bg-primary/10 p-2 text-primary">
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export function RoleCatalogPage({
  basePath,
  title = "Roles",
  description = "Define access levels, permission coverage, and operational ownership for each team role.",
}: {
  basePath: string;
  title?: string;
  description?: string;
}) {
  const router = useRouter();
  const { roles, isLoading, fetchRoles, deleteRole } = useSecurityStore();
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [search, setSearch] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

  useEffect(() => {
    void fetchRoles();
  }, [fetchRoles]);

  const filteredRoles = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return roles;

    return roles.filter((role) => {
      const permissionMatch = (role.permissions || []).some(
        (permission) =>
          permission.name.toLowerCase().includes(query) ||
          permission.code.toLowerCase().includes(query),
      );

      return (
        role.name.toLowerCase().includes(query) ||
        (role.description || "").toLowerCase().includes(query) ||
        permissionMatch
      );
    });
  }, [roles, search]);

  const summary = useMemo(() => {
    const totalMembers = filteredRoles.reduce(
      (sum, role) => sum + (role.memberCount ?? 0),
      0,
    );
    const totalPermissions = filteredRoles.reduce(
      (sum, role) => sum + (role.permissions?.length ?? 0),
      0,
    );
    const assignedRoles = filteredRoles.filter(
      (role) => (role.memberCount ?? 0) > 0,
    ).length;

    return {
      totalRoles: filteredRoles.length,
      totalMembers,
      totalPermissions,
      assignedRoles,
    };
  }, [filteredRoles]);

  const handleEdit = (role: Role) => {
    router.push(`${basePath}/${role.id}/edit`);
  };

  const handleDeleteClick = (role: Role) => {
    setRoleToDelete(role);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!roleToDelete) return;

    try {
      await deleteRole(roleToDelete.id);
      toast.success("Role deleted successfully");
      setDeleteDialogOpen(false);
      setRoleToDelete(null);
    } catch (error) {
      toast.error("Failed to delete role");
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        icon={Shield}
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <div className="flex items-center rounded-lg bg-muted p-1">
              <Button
                variant={viewMode === "card" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("card")}
                title="Card view"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("table")}
                title="Table view"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <PermissionGuard requiredPermission="roles.create">
              <Button asChild className="w-full sm:w-auto">
                <Link href={`${basePath}/new`}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Role
                </Link>
              </Button>
            </PermissionGuard>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Visible Roles"
          value={String(summary.totalRoles)}
          description="Roles matching the current search"
          icon={Shield}
        />
        <SummaryCard
          title="Assigned Members"
          value={String(summary.totalMembers)}
          description="Users attached to visible roles"
          icon={Users}
        />
        <SummaryCard
          title="Granted Permissions"
          value={String(summary.totalPermissions)}
          description="Permission assignments across visible roles"
          icon={KeyRound}
        />
        <SummaryCard
          title="Active Roles"
          value={String(summary.assignedRoles)}
          description="Visible roles with at least one member"
          icon={Users}
        />
      </div>

      <Card className="border-border/60">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search role, description, or permission..."
                className="pl-9"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {filteredRoles.length} role
              {filteredRoles.length === 1 ? "" : "s"} visible
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>Role Catalogue</CardTitle>
          <CardDescription>
            Review permissions, member assignments, and edit access rules.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Loading role catalogue...
            </div>
          ) : filteredRoles.length === 0 ? (
            <div className="rounded-2xl border border-dashed px-6 py-12 text-center">
              <Shield className="mx-auto h-12 w-12 text-muted-foreground/30" />
              <h3 className="mt-4 text-lg font-semibold">No roles found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Adjust your search or create a new role.
              </p>
            </div>
          ) : viewMode === "card" ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredRoles.map((role) => (
                <Card
                  key={role.id}
                  className="border-border/60 transition-shadow hover:shadow-md"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="rounded-xl bg-primary/10 p-2 text-primary">
                          <Shield className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{role.name}</CardTitle>
                          <CardDescription className="mt-1">
                            {role.memberCount ?? 0} member
                            {(role.memberCount ?? 0) === 1 ? "" : "s"}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="min-h-[40px] text-sm text-muted-foreground">
                      {role.description || "No description provided."}
                    </p>
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Permissions
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {(role.permissions || []).length > 0 ? (
                          <>
                            {(role.permissions || []).slice(0, 4).map((permission) => (
                              <Badge
                                key={permission.id}
                                variant="secondary"
                                className="text-[10px]"
                              >
                                {permission.name}
                              </Badge>
                            ))}
                            {(role.permissions || []).length > 4 ? (
                              <Badge variant="outline" className="text-[10px]">
                                +{(role.permissions || []).length - 4} more
                              </Badge>
                            ) : null}
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            No permissions assigned
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  <div className="flex border-t">
                    <PermissionGuard requiredPermission="roles.update">
                      <Button
                        variant="ghost"
                        className="flex-1 rounded-none"
                        onClick={() => handleEdit(role)}
                      >
                        <Edit2 className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    </PermissionGuard>
                    <PermissionGuard requiredPermission="roles.delete">
                      <Button
                        variant="ghost"
                        className="flex-1 rounded-none text-destructive hover:text-destructive"
                        onClick={() => handleDeleteClick(role)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </PermissionGuard>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead className="w-[96px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRoles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell>
                        <div className="flex items-center gap-2 font-medium">
                          <Shield className="h-4 w-4 text-primary" />
                          {role.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {role.description || "No description provided."}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5">
                          {(role.permissions || []).length > 0 ? (
                            <>
                              {(role.permissions || []).slice(0, 3).map((permission) => (
                                <Badge key={permission.id} variant="outline">
                                  {permission.name}
                                </Badge>
                              ))}
                              {(role.permissions || []).length > 3 ? (
                                <Badge variant="outline">
                                  +{(role.permissions || []).length - 3} more
                                </Badge>
                              ) : null}
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              No permissions assigned
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{role.memberCount ?? 0}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <PermissionGuard requiredPermission="roles.update">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(role)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </PermissionGuard>
                          <PermissionGuard requiredPermission="roles.delete">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDeleteClick(role)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </PermissionGuard>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{roleToDelete?.name}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
