"use client";

import React from "react";
import {
  Search,
  ClipboardList,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  RefreshCw,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

import { useRequestStore, type ServiceRequest } from "@/lib/stores/request-store";
import { useSession } from "@/hooks/use-session";
import { PageLayout, type PageTab } from "@/components/dashboard/page-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PaginationFooter } from "@/components/dashboard/pagination-footer";
import { Textarea } from "@/components/ui/textarea";
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
import { cn } from "@/lib/utils";

import { ReviewRequestDialog } from "./_components/review-request-dialog";
import { ScheduleAppointmentDialog } from "./_components/schedule-appointment-dialog";

function getOverallStatus(req: ServiceRequest) {
  const { statusbystaff, statusbyadmin } = req;
  if (statusbystaff === "rejected" || statusbyadmin === "rejected") return "rejected";
  if (statusbystaff === "approved" && statusbyadmin === "approved") return "approved";
  if (statusbystaff === "approved" && statusbyadmin === "pending") return "partial";
  return "pending";
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    pending: { label: "Pending", className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
    partial: { label: "Staff Approved", className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
    approved: { label: "Approved", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
    rejected: { label: "Rejected", className: "bg-red-500/10 text-red-600 border-red-500/20" },
  };
  const cfg = map[status] ?? map.pending;
  return (
    <Badge variant="outline" className={cn("font-semibold text-xs", cfg.className)}>
      {cfg.label}
    </Badge>
  );
}

const STATUS_TABS: PageTab[] = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

export default function RequestManagementPage() {
  const { data: sessionData, isPending: isSessionPending } = useSession();
  const session = sessionData?.session;
  const managerStaffId = session?.user?.staffId ?? null;

  const userRole = session?.role?.name?.toLowerCase() || null;
  const isManager = userRole === "manager";
  const isStaff = userRole === "staff";
  const activeRole = isStaff ? "staff" : isManager ? "manager" : null;

  const { requests, isLoading, pagination, fetchRequests } = useRequestStore();

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  const [reviewingRequest, setReviewingRequest] = React.useState<ServiceRequest | null>(null);
  const [schedulingRequest, setSchedulingRequest] = React.useState<ServiceRequest | null>(null);

  const [approvingId, setApprovingId] = React.useState<string | null>(null);
  const [rejectingId, setRejectingId] = React.useState<string | null>(null);
  const [rejectReason, setRejectReason] = React.useState("");
  const [isRejecting, setIsRejecting] = React.useState(false);

  const refresh = React.useCallback(() => {
    fetchRequests({
      page: currentPage,
      pageSize,
      search: search || undefined,
      status: statusFilter || undefined,
    });
  }, [fetchRequests, currentPage, pageSize, search, statusFilter]);

  React.useEffect(() => {
    if (isSessionPending) return;
    refresh();
  }, [isSessionPending, currentPage, pageSize, search, statusFilter]);

  const handleApprove = async (id: string) => {
    setApprovingId(id);
    try {
      if (activeRole === "staff") {
        if (!managerStaffId) {
          toast.error("Your staff record was not found. Please re-login.");
          return;
        }
        await useRequestStore.getState().approveRequestStaff(id, managerStaffId, "");
        toast.success("Request approved by staff");
        refresh();
        const req = requests.find((r) => r.id === id);
        if (req) setSchedulingRequest(req);
      } else if (activeRole === "manager") {
        if (!managerStaffId) {
          toast.error("Your manager record was not found. Please re-login.");
          return;
        }
        await useRequestStore.getState().approveRequestManager(id, managerStaffId, "");
        toast.success("Request approved by manager");
        refresh();
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to approve request");
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectingId || !rejectReason.trim()) {
      toast.error("Please enter a rejection reason");
      return;
    }
    setIsRejecting(true);
    try {
      await useRequestStore.getState().rejectRequest(rejectingId, rejectReason.trim());
      toast.success("Request rejected");
      setRejectingId(null);
      setRejectReason("");
      refresh();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to reject request");
    } finally {
      setIsRejecting(false);
    }
  };

  const stats = React.useMemo(
    () => ({
      total: pagination?.total ?? requests.length,
      pending: requests.filter(
        (r) => r.statusbyadmin === "pending" && r.statusbystaff !== "rejected"
      ).length,
      approved: requests.filter(
        (r) => r.statusbystaff === "approved" && r.statusbyadmin === "approved"
      ).length,
      rejected: requests.filter(
        (r) => r.statusbystaff === "rejected" || r.statusbyadmin === "rejected"
      ).length,
    }),
    [requests, pagination]
  );

  const tabsWithBadges: PageTab[] = [
    { label: "All", value: "", badge: stats.total },
    { label: "Pending", value: "pending", badge: stats.pending || undefined },
    { label: "Approved", value: "approved", badge: stats.approved || undefined },
    { label: "Rejected", value: "rejected", badge: stats.rejected || undefined },
  ];

  return (
    <PageLayout
      title="Request Management"
      description="Review and process service requests for your office"
      icon={ClipboardList}
      tabs={tabsWithBadges}
      activeTab={statusFilter}
      onTabChange={(value) => { setStatusFilter(value); setCurrentPage(1); }}
      actions={
        <Button variant="outline" onClick={refresh} className="h-10 rounded-xl">
          <RefreshCw className={cn("mr-2 size-4", isLoading && "animate-spin")} />
          Refresh
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Requests", value: stats.total, icon: ClipboardList, color: "text-primary", bg: "bg-primary/10" },
            { label: "Pending Review", value: stats.pending, icon: Clock, color: "text-amber-600", bg: "bg-amber-500/10" },
            { label: "Approved", value: stats.approved, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-500/10" },
            { label: "Rejected", value: stats.rejected, icon: XCircle, color: "text-red-600", bg: "bg-red-500/10" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label} className="border-none shadow-sm ring-1 ring-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-5 flex items-center gap-4">
                <div className={cn("p-2.5 rounded-xl shrink-0", bg)}>
                  <Icon className={cn("size-5", color)} />
                </div>
                <div>
                  <p className="text-2xl font-black">{value}</p>
                  <p className="text-xs text-muted-foreground font-medium">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by customer or service..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9 rounded-xl h-10"
          />
        </div>

        {/* Requests Table */}
        <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="p-4 rounded-full bg-muted/30 mb-4">
                <ClipboardList className="size-10 text-muted-foreground/30" />
              </div>
              <p className="font-semibold text-lg">No requests found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {search || statusFilter ? "Try adjusting your filters" : "No requests have been submitted yet"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30">
                    <th className="p-4 font-bold text-xs uppercase tracking-wider text-muted-foreground">Customer</th>
                    <th className="p-4 font-bold text-xs uppercase tracking-wider text-muted-foreground">Service</th>
                    <th className="p-4 font-bold text-xs uppercase tracking-wider text-muted-foreground">Date</th>
                    <th className="p-4 font-bold text-xs uppercase tracking-wider text-muted-foreground">Staff</th>
                    <th className="p-4 font-bold text-xs uppercase tracking-wider text-muted-foreground">Manager</th>
                    <th className="p-4 font-bold text-xs uppercase tracking-wider text-muted-foreground text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => {
                    const canApprove =
                      activeRole === "staff" ? req.statusbystaff === "pending" :
                      activeRole === "manager" ? req.statusbyadmin === "pending" && req.statusbystaff === "approved" : false;
                    const canReject =
                      activeRole === "staff" ? req.statusbystaff === "pending" :
                      activeRole === "manager" ? req.statusbyadmin === "pending" : false;
                    const isThisApproving = approvingId === req.id;

                    return (
                      <tr
                        key={req.id}
                        className="border-b border-border/50 last:border-0 hover:bg-muted/10 transition-colors"
                      >
                        <td className="p-4">
                          <p className="font-semibold">{req.user?.username}</p>
                          <p className="text-xs text-muted-foreground">{req.user?.phoneNumber}</p>
                        </td>
                        <td className="p-4">
                          <p className="font-medium">{req.service?.name}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-45">
                            {req.currentAddress}
                          </p>
                        </td>
                        <td className="p-4 whitespace-nowrap text-muted-foreground">
                          {new Date(req.date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="p-4">
                          <StatusBadge status={req.statusbystaff} />
                        </td>
                        <td className="p-4">
                          <StatusBadge status={req.statusbyadmin} />
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 justify-end">
                            {canApprove && (
                              <Button
                                size="sm"
                                onClick={() => handleApprove(req.id)}
                                disabled={isThisApproving}
                                className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3"
                              >
                                {isThisApproving ? (
                                  <Loader2 className="size-3 animate-spin" />
                                ) : (
                                  <>
                                    <CheckCircle className="size-3 mr-1" />
                                    Approve
                                  </>
                                )}
                              </Button>
                            )}
                            {canReject && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setRejectingId(req.id)}
                                className="h-8 rounded-lg text-destructive border-destructive/30 hover:bg-destructive/5 text-xs font-bold px-3"
                              >
                                <XCircle className="size-3 mr-1" />
                                Reject
                              </Button>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setReviewingRequest(req)}
                              className="h-8 w-8 rounded-lg text-primary hover:bg-primary/10 shrink-0"
                            >
                              <Eye className="size-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {pagination && pagination.total > pageSize && (
          <PaginationFooter
            currentPage={currentPage}
            pageSize={pageSize}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            startIndex={(currentPage - 1) * pageSize}
            endIndex={Math.min(currentPage * pageSize, pagination.total)}
            onPageChange={setCurrentPage}
            onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
            canGoNext={currentPage < pagination.totalPages}
            canGoPrevious={currentPage > 1}
            itemLabel="requests"
          />
        )}
      </div>

      {/* Modals */}
      <ReviewRequestDialog
        request={reviewingRequest}
        open={!!reviewingRequest}
        onOpenChange={(o) => !o && setReviewingRequest(null)}
        staffId={managerStaffId}
        role={activeRole}
        onSuccess={refresh}
        onApproveSuccess={(req) => setSchedulingRequest(req)}
      />

      <ScheduleAppointmentDialog
        request={schedulingRequest}
        open={!!schedulingRequest}
        onOpenChange={(o) => !o && setSchedulingRequest(null)}
        onSuccess={() => {
          setSchedulingRequest(null);
          refresh();
        }}
      />

      <AlertDialog
        open={!!rejectingId}
        onOpenChange={(open) => {
          if (!open) {
            setRejectingId(null);
            setRejectReason("");
          }
        }}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Reject This Request</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason. The customer will be notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Enter rejection reason..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="rounded-xl resize-none min-h-20"
          />
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={isRejecting || !rejectReason.trim()}
              className="rounded-xl bg-destructive hover:bg-destructive/90"
            >
              {isRejecting && <Loader2 className="size-4 animate-spin mr-2" />}
              Reject Request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  );
}
