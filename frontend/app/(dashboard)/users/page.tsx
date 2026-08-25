"use client";

import * as React from "react";
import { Plus, Search, RotateCw, UserCog } from "lucide-react";
import { toast } from "sonner";

import { useUserStore, type User } from "@/lib/stores/user-store";
import { useSecurityStore } from "@/lib/stores/security-store";
import { dedupeRolesByName } from "@/lib/roles";
import { PageLayout } from "@/components/dashboard/page-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserTable } from "./_components/user-table";
import { UserCreateDialog } from "@/components/dashboard/user-create-dialog";
import { PaginationFooter } from "@/components/dashboard/pagination-footer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useTranslation } from "@/lib/i18n";

export default function UsersPage() {
  const { t } = useTranslation();

  const {
    users,
    isLoading,
    fetchUsers,
    deleteUser,
    updateUser,
    pagination,
  } = useUserStore();
  const { roles, fetchRoles } = useSecurityStore();

  const [searchQuery, setSearchQuery] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [selectedRole, setSelectedRole] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "active" | "inactive">("all");

  // Roles are stored per-office and share names (e.g. many "MANAGER" records),
  // so collapse them to distinct names for the filter. Filtering then happens
  // by name so it matches users across every office that has that role.
  const distinctRoles = React.useMemo(() => dedupeRolesByName(roles), [roles]);

  React.useEffect(() => {
    void fetchRoles();
  }, [fetchRoles]);

  React.useEffect(() => {
    void fetchUsers({
      page: currentPage,
      pageSize,
      search: searchQuery || undefined,
      roleName: selectedRole !== "all" ? selectedRole : undefined,
      isActive: statusFilter === "active" ? true : statusFilter === "inactive" ? false : undefined,
    });
  }, [currentPage, fetchUsers, pageSize, searchQuery, selectedRole, statusFilter]);

  React.useEffect(() => {
    if (selectedRole === "all") return;
    const selectedRoleStillExists = distinctRoles.some((role) => role.key === selectedRole);
    if (!selectedRoleStillExists) {
      setSelectedRole("all");
      setCurrentPage(1);
    }
  }, [distinctRoles, selectedRole]);

  const handleCreate = () => {
    setSelectedUser(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteUser(deletingId);
      toast.success(t("User deleted successfully"));
    } catch (error) {
      toast.error(t("Failed to delete user"));
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      await updateUser(user.id, { isActive: !user.isActive });
      toast.success(user.isActive ? t("User deactivated") : t("User activated"));
    } catch {
      toast.error(t("Failed to update user status"));
    }
  };

  const handleRefresh = () => {
    void fetchUsers({
      page: currentPage,
      pageSize,
      search: searchQuery || undefined,
      roleName: selectedRole !== "all" ? selectedRole : undefined,
      isActive: statusFilter === "active" ? true : statusFilter === "inactive" ? false : undefined,
    });
    toast.success(t("User list refreshed"));
  };

  return (
    <PageLayout
      title={t("User Management")}
      description={t("Manage users, assign roles, and assign offices")}
      icon={UserCog}
      actions={
        <>
          <Button
            variant="outline"
            onClick={handleRefresh}
            className="rounded-xl h-10"
          >
            <RotateCw className={`mr-2 size-4 ${isLoading ? "animate-spin" : ""}`} />
            {t("Refresh")}
          </Button>
          <Button
            onClick={handleCreate}
            className="bg-primary hover:bg-primary/90 rounded-xl h-10 px-6 font-semibold"
          >
            <Plus className="mr-2 size-4" />
            {t("Add User")}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder={t("Search users by name, phone, role, or office...")}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-11 border-border focus:ring-primary rounded-xl h-11"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={selectedRole}
              onValueChange={(value) => {
                setSelectedRole(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-40 h-11 rounded-xl">
                <SelectValue placeholder={t("All Roles")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("All Roles")}</SelectItem>
                {distinctRoles.map((role) => (
                  <SelectItem key={role.key} value={role.key}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center rounded-xl border border-border overflow-hidden h-11 bg-muted/30">
              {(["all", "active", "inactive"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => { setStatusFilter(s); setCurrentPage(1); }}
                  className={`px-4 h-full text-xs font-semibold capitalize transition-colors ${
                    statusFilter === s
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {s === "all" ? t("All") : s === "active" ? t("Active") : t("Inactive")}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{t("Show:")}</span>
              <Select
                value={pageSize.toString()}
                onValueChange={(v) => {
                  setPageSize(parseInt(v));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-20 h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <UserTable
          users={users}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          onToggleActive={handleToggleActive}
        />

        {pagination && pagination.total > 0 && (
          <div className="mt-4">
            <PaginationFooter
              currentPage={currentPage}
              pageSize={pageSize}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              startIndex={(currentPage - 1) * pageSize}
              endIndex={currentPage * pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              canGoNext={currentPage < pagination.totalPages}
              canGoPrevious={currentPage > 1}
              itemLabel={t("users")}
            />
          </div>
        )}
      </div>

      <UserCreateDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        user={selectedUser}
      />

      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Are you absolutely sure?")}</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {t("This action cannot be undone. This will permanently delete the user account and remove their data from our servers.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">{t("Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl"
            >
              {t("Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  );
}
