"use client";

import * as React from "react";
import {
  Plus,
  Search,
  RotateCw,
  Users,
  Filter,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";

import { useStaffStore, type StaffMember } from "@/lib/stores/staff-store";
import { useOfficeStore } from "@/lib/stores/office-store";
import { useSecurityStore } from "@/lib/stores/security-store";
import { useSession } from "@/hooks/use-session";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StaffTable } from "./_components/staff-table";
import { StaffCreateDialog } from "@/components/dashboard/staff-create-dialog";
import { PaginationFooter } from "@/components/dashboard/pagination-footer";
import { Card, CardContent } from "@/components/ui/card";
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

export default function StaffPage() {
  const { data: sessionData, isPending: isSessionPending } = useSession();
  const sessionOfficeId = sessionData?.session?.officeId;
  const roleNameUpper = sessionData?.session?.role?.name?.toUpperCase() || "";
  const isAdmin =
    roleNameUpper === "ADMIN" ||
    roleNameUpper === "ADMINISTRATOR" ||
    roleNameUpper === "SUPERADMIN";

  const { staff, isLoading, fetchStaff, deleteStaff, pagination } =
    useStaffStore();
  const { offices, fetchOffices } = useOfficeStore();
  const { roles, fetchRoles } = useSecurityStore();

  const [searchQuery, setSearchQuery] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedMember, setSelectedMember] =
    React.useState<StaffMember | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [selectedOfficeId, setSelectedOfficeId] = React.useState<string>("all");
  const [selectedRoleId, setSelectedRoleId] = React.useState<string>("all");

  React.useEffect(() => {
    if (isSessionPending) return;

    if (isAdmin) {
      void fetchOffices();
    }

    void fetchRoles({
      officeId:
        selectedOfficeId !== "all"
          ? selectedOfficeId
          : !isAdmin
            ? sessionOfficeId
            : undefined,
    });
  }, [
    fetchOffices,
    fetchRoles,
    isAdmin,
    isSessionPending,
    selectedOfficeId,
    sessionOfficeId,
  ]);

  React.useEffect(() => {
    if (selectedRoleId === "all") return;
    const selectedRoleStillExists = roles.some(
      (role) => role.id === selectedRoleId,
    );
    if (!selectedRoleStillExists) {
      setSelectedRoleId("all");
      setCurrentPage(1);
    }
  }, [roles, selectedRoleId]);

  React.useEffect(() => {
    if (isSessionPending || isAdmin || !sessionOfficeId) return;
    setSelectedOfficeId(sessionOfficeId);
  }, [isAdmin, isSessionPending, sessionOfficeId]);

  React.useEffect(() => {
    if (isSessionPending) return;

    const effectiveOfficeId =
      selectedOfficeId !== "all"
        ? selectedOfficeId
        : !isAdmin
          ? sessionOfficeId
          : undefined;

    void fetchStaff({
      page: currentPage,
      pageSize,
      search: searchQuery || undefined,
      roleId: selectedRoleId !== "all" ? selectedRoleId : undefined,
      officeId: effectiveOfficeId,
    });
  }, [
    currentPage,
    fetchStaff,
    isAdmin,
    isSessionPending,
    pageSize,
    searchQuery,
    selectedOfficeId,
    selectedRoleId,
    sessionOfficeId,
  ]);

  const handleCreate = () => {
    setSelectedMember(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (member: StaffMember) => {
    setSelectedMember(member);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteStaff(deletingId);
      toast.success("Staff member deleted successfully");
    } catch (error) {
      toast.error("Failed to delete staff member");
    } finally {
      setDeletingId(null);
    }
  };

  const handleRefresh = () => {
    const effectiveOfficeId =
      selectedOfficeId !== "all"
        ? selectedOfficeId
        : !isAdmin
          ? sessionOfficeId
          : undefined;

    void fetchStaff({
      page: currentPage,
      pageSize,
      search: searchQuery || undefined,
      roleId: selectedRoleId !== "all" ? selectedRoleId : undefined,
      officeId: effectiveOfficeId,
    });
    toast.success("Staff list refreshed");
  };

  return (
    <div className="flex flex-col gap-6 p-6 sm:p-8 bg-background min-h-screen">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Staff Management"
          description="Manage your office staff members and roles"
        />
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            className="rounded-xl h-10 px-4 font-medium transition-all hover:bg-muted"
          >
            <RotateCw
              className={`mr-2 size-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button
            onClick={handleCreate}
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-10 px-6 font-semibold shadow-sm transition-all active:scale-95"
          >
            <Plus className="mr-2 size-4" />
            Add Staff
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-none bg-transparent">
        <CardContent className="p-0 space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search staff by office, role, phone, or username..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-11 bg-card border-border text-foreground focus:ring-primary rounded-xl h-11 transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-xl border border-border">
                <Filter className="size-4 text-muted-foreground" />
                <Select
                  value={selectedOfficeId}
                  onValueChange={(value) => {
                    setSelectedOfficeId(value);
                    setSelectedRoleId("all");
                    setCurrentPage(1);
                  }}
                  disabled={!isAdmin}
                >
                  <SelectTrigger className="w-[160px] border-none bg-transparent h-8 focus:ring-0">
                    <SelectValue placeholder="All Offices" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Offices</SelectItem>
                    {offices.map((office) => (
                      <SelectItem key={office.id} value={office.id}>
                        {office.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-xl border border-border">
                <SlidersHorizontal className="size-4 text-muted-foreground" />
                <Select
                  value={selectedRoleId}
                  onValueChange={(value) => {
                    setSelectedRoleId(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-[140px] border-none bg-transparent h-8 focus:ring-0">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 ml-auto lg:ml-0">
                <span className="text-xs font-medium text-muted-foreground">
                  Show:
                </span>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(v) => {
                    setPageSize(parseInt(v));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-[70px] bg-muted/50 border-border h-9 rounded-xl">
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

          <StaffTable
            staff={staff}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
          />

          {pagination && pagination.totalItems > 0 && (
            <div className="pt-2">
              <PaginationFooter
                currentPage={currentPage}
                pageSize={pageSize}
                totalPages={pagination.totalPages}
                totalItems={pagination.totalItems}
                startIndex={(currentPage - 1) * pageSize}
                endIndex={currentPage * pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
                canGoNext={pagination.hasNextPage}
                canGoPrevious={pagination.hasPreviousPage}
                itemLabel="staff"
              />
            </div>
          )}
        </CardContent>
      </Card>

      <StaffCreateDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        member={selectedMember}
        officeId={
          selectedOfficeId !== "all" ? selectedOfficeId : sessionOfficeId
        }
      />

      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent className="rounded-2xl border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">
              Are you absolutely sure?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This action cannot be undone. This will permanently remove this
              staff member from your office records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 mt-4">
            <AlertDialogCancel className="rounded-xl border-border hover:bg-muted">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl"
            >
              Delete Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
