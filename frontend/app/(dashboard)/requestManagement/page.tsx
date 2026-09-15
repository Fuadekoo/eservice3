"use client";

import React from "react";
import {
  Search,
  ClipboardList,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  Loader2,
  RefreshCw,
  Eye,
  Building2,
  Filter,
  GitMerge,
  Users,
  UserCheck,
  ShieldCheck,
  X,
  CalendarPlus,
  Calendar,
  MapPin,
  Paperclip,
  List,
  LayoutGrid,
  Ban,
} from "lucide-react";
import { toast } from "sonner";

import {
  deciderName,
  getOverallStatus,
  useRequestStore,
  type OverallStatus,
  type ServiceRequest,
} from "@/lib/stores/request-store";
import { useOfficeStore } from "@/lib/stores/office-store";
import { useSession } from "@/hooks/use-session";
import { PageLayout, type PageTab } from "@/components/dashboard/page-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PaginationFooter } from "@/components/dashboard/pagination-footer";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import { ReviewRequestDialog } from "./_components/review-request-dialog";
import { ScheduleAppointmentDialog } from "./_components/schedule-appointment-dialog";
import { useTranslation } from "@/lib/i18n";
import { RequestNumber } from "@/components/dashboard/request-number";
import { BeneficiaryBadge } from "@/components/dashboard/beneficiary-badge";

// ── Status presentation ───────────────────────────────────────────────────────
// The four states a request can be in as far as anyone reading the queue is
// concerned. "processing" is the one the desk cares about most and the one
// this page used to have no name for: staff have signed it off, the manager
// has not, and it sits there until somebody notices.
const STATUS_CONFIG: Record<
  OverallStatus,
  { label: string; icon: React.ElementType; badge: string; dot: string }
> = {
  pending: {
    label: "Pending",
    icon: Clock,
    badge: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    dot: "bg-amber-500",
  },
  processing: {
    label: "Processing",
    icon: Activity,
    badge: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    dot: "bg-blue-500",
  },
  approved: {
    label: "Approved",
    icon: CheckCircle,
    badge: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    dot: "bg-emerald-500",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    badge: "bg-red-500/10 text-red-600 border-red-500/20",
    dot: "bg-red-500",
  },
};

const STATUS_VALUES: OverallStatus[] = [
  "pending",
  "processing",
  "approved",
  "rejected",
];

/** The overall outcome, as one badge. */
function StatusBadge({ status }: { status: OverallStatus }) {
  const { t } = useTranslation();
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 text-xs font-semibold", cfg.badge)}
    >
      <Icon className="size-3" />
      {t(cfg.label)}
    </Badge>
  );
}

/** One gate of the approval pipeline — staff review, or manager sign-off. */
function GateBadge({ status }: { status: "pending" | "approved" | "rejected" }) {
  const { t } = useTranslation();

  const map = {
    pending: {
      label: t("Waiting"),
      className: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    },
    approved: {
      label: t("Approved"),
      className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    },
    rejected: {
      label: t("Rejected"),
      className: "bg-red-500/10 text-red-600 border-red-500/20",
    },
  };
  const cfg = map[status] ?? map.pending;

  return (
    <Badge
      variant="outline"
      className={cn("text-xs font-semibold", cfg.className)}
    >
      {cfg.label}
    </Badge>
  );
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** What a given role is allowed to do with a request, right now. */
function permissions(req: ServiceRequest, role: "staff" | "manager" | null) {
  // A duplicate already folded into another request is settled: the decision
  // belongs on the survivor.
  const isMerged = Boolean(req.mergedInto);

  const canApprove =
    !isMerged &&
    (role === "staff"
      ? req.statusbystaff === "pending"
      : role === "manager"
        ? req.statusbyadmin === "pending" && req.statusbystaff === "approved"
        : false);

  const canReject =
    !isMerged &&
    (role === "staff"
      ? req.statusbystaff === "pending"
      : role === "manager"
        ? req.statusbyadmin === "pending"
        : false);

  // Booking a slot used to be possible only in the moment after approving —
  // the dialog opened itself, and closing it was final. Any request that has
  // passed staff review and is not closed can be scheduled, whenever the desk
  // gets to it.
  const canSchedule =
    !isMerged &&
    req.statusbystaff === "approved" &&
    req.statusbyadmin !== "rejected";

  return { isMerged, canApprove, canReject, canSchedule };
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function RequestManagementPage() {
  const { t } = useTranslation();

  const { data: sessionData, isPending: isSessionPending } = useSession();
  const session = sessionData?.session;
  const managerStaffId = session?.user?.staffId ?? null;
  const sessionOfficeId = session?.officeId ?? session?.office?.id ?? null;
  const sessionOfficeName = session?.office?.name ?? null;

  const roleNameUpper = session?.role?.name?.toUpperCase() || "";
  const isAdmin =
    roleNameUpper === "ADMIN" ||
    roleNameUpper === "ADMINISTRATOR" ||
    roleNameUpper === "SUPERADMIN";
  const isManager = roleNameUpper === "MANAGER";
  const isStaff = roleNameUpper === "STAFF";
  const activeRole: "staff" | "manager" | null = isStaff
    ? "staff"
    : isManager
      ? "manager"
      : null;

  const { requests, isLoading, pagination, stats, fetchRequests, fetchStats } =
    useRequestStore();
  const { offices, fetchOffices } = useOfficeStore();

  const [search, setSearch] = React.useState("");
  // Deep links land on a tab: the staff overview points "Pending Queue" here
  // rather than at a second page showing the same rows.
  const [statusFilter, setStatusFilter] = React.useState(() => {
    if (typeof window === "undefined") return "";
    const value = new URLSearchParams(window.location.search).get("status");
    return value && STATUS_VALUES.includes(value as OverallStatus) ? value : "";
  });
  const [officeFilter, setOfficeFilter] = React.useState("all");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [view, setView] = React.useState<"table" | "card">("table");

  const [reviewingRequest, setReviewingRequest] =
    React.useState<ServiceRequest | null>(null);
  const [schedulingRequest, setSchedulingRequest] =
    React.useState<ServiceRequest | null>(null);

  const [approvingId, setApprovingId] = React.useState<string | null>(null);
  const [rejectingId, setRejectingId] = React.useState<string | null>(null);
  const [rejectReason, setRejectReason] = React.useState("");
  const [isRejecting, setIsRejecting] = React.useState(false);

  // ── Merging duplicates ────────────────────────────────────────────────
  // Customers routinely apply twice. Selecting the copies and folding them
  // into one keeps every reference number working while leaving a single
  // piece of work in the queue.
  const [pickedIds, setPickedIds] = React.useState<string[]>([]);
  const [isMergeOpen, setIsMergeOpen] = React.useState(false);
  const [mergePrimaryId, setMergePrimaryId] = React.useState<string | null>(null);
  const [mergeNote, setMergeNote] = React.useState("");
  const [isMerging, setIsMerging] = React.useState(false);

  // A row that has left the page — approved away, merged, filtered out — must
  // not stay ticked, or the merge dialog offers requests nobody can see. The
  // selection is therefore derived from what is on screen rather than stored
  // and pruned afterwards.
  const selectedRequests = React.useMemo(
    () => requests.filter((request) => pickedIds.includes(request.id)),
    [requests, pickedIds],
  );

  const selectedIds = React.useMemo(
    () => selectedRequests.map((request) => request.id),
    [selectedRequests],
  );

  // Only requests from one customer can be merged — folding two people's
  // applications together would hand one of them the other's documents.
  const selectionCustomerIds = React.useMemo(
    () => new Set(selectedRequests.map((request) => request.user?.id)),
    [selectedRequests],
  );
  const canMergeSelection =
    selectedRequests.length >= 2 && selectionCustomerIds.size === 1;

  const toggleSelected = (id: string) => {
    setPickedIds((current) =>
      current.includes(id)
        ? current.filter((entry) => entry !== id)
        : [...current, id],
    );
  };

  const clearSelection = () => {
    setPickedIds([]);
    setMergePrimaryId(null);
    setMergeNote("");
  };

  const openMergeDialog = () => {
    if (!canMergeSelection) return;
    // Default to keeping the earliest application — it holds the queue
    // position the customer has already waited for.
    const earliest = [...selectedRequests].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )[0];
    setMergePrimaryId(earliest?.id ?? null);
    setIsMergeOpen(true);
  };

  const effectiveOfficeId = React.useMemo(() => {
    if (isAdmin) {
      return officeFilter !== "all" ? officeFilter : undefined;
    }
    return undefined;
  }, [isAdmin, officeFilter]);

  const officeOptions = React.useMemo(() => {
    if (isAdmin) return offices;
    if (sessionOfficeId && sessionOfficeName) {
      return [{ id: sessionOfficeId, name: sessionOfficeName }];
    }
    return offices.filter((office) => office.id === sessionOfficeId);
  }, [isAdmin, offices, sessionOfficeId, sessionOfficeName]);

  React.useEffect(() => {
    if (isSessionPending) return;
    if (isAdmin) {
      void fetchOffices();
    }
  }, [isSessionPending, isAdmin, fetchOffices]);

  React.useEffect(() => {
    if (isSessionPending || isAdmin || !sessionOfficeId) return;
    setOfficeFilter(sessionOfficeId);
  }, [isSessionPending, isAdmin, sessionOfficeId]);

  const refresh = React.useCallback(() => {
    fetchRequests({
      page: currentPage,
      pageSize,
      search: search || undefined,
      status: statusFilter || undefined,
      officeId: effectiveOfficeId,
    });
    // Counts cover the whole queue, so they answer to the search and the
    // office but never to the tab — otherwise every tab but the open one
    // would read zero.
    fetchStats({
      search: search || undefined,
      officeId: effectiveOfficeId,
    });
  }, [
    fetchRequests,
    fetchStats,
    currentPage,
    pageSize,
    search,
    statusFilter,
    effectiveOfficeId,
  ]);

  React.useEffect(() => {
    if (isSessionPending) return;
    refresh();
  }, [isSessionPending, refresh]);

  const handleApprove = async (id: string) => {
    setApprovingId(id);
    try {
      if (activeRole === "staff") {
        if (!managerStaffId) {
          toast.error(t("Your staff record was not found. Please re-login."));
          return;
        }
        await useRequestStore.getState().approveRequestStaff(id, managerStaffId, "");
        toast.success(t("Request approved by staff"));
        refresh();
        const req = requests.find((r) => r.id === id);
        if (req) setSchedulingRequest(req);
      } else if (activeRole === "manager") {
        if (!managerStaffId) {
          toast.error(t("Your manager record was not found. Please re-login."));
          return;
        }
        await useRequestStore.getState().approveRequestManager(id, managerStaffId, "");
        toast.success(t("Request approved by manager"));
        refresh();
      }
    } catch (err: any) {
      toast.error(err?.message ?? t("Failed to approve request"));
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectingId || !rejectReason.trim()) {
      toast.error(t("Please enter a rejection reason"));
      return;
    }
    setIsRejecting(true);
    try {
      await useRequestStore.getState().rejectRequest(rejectingId, rejectReason.trim());
      toast.success(t("Request rejected"));
      setRejectingId(null);
      setRejectReason("");
      refresh();
    } catch (err: any) {
      toast.error(err?.message ?? t("Failed to reject request"));
    } finally {
      setIsRejecting(false);
    }
  };

  const handleMerge = async () => {
    if (!mergePrimaryId) return;

    const duplicateIds = selectedIds.filter((id) => id !== mergePrimaryId);
    if (duplicateIds.length === 0) {
      toast.error(t("Choose which request to keep, and at least one duplicate."));
      return;
    }

    setIsMerging(true);
    try {
      const merged = await useRequestStore
        .getState()
        .mergeRequests(mergePrimaryId, duplicateIds, mergeNote.trim() || undefined);

      toast.success(
        t("{count} duplicate request(s) merged", { count: merged }),
      );
      setIsMergeOpen(false);
      clearSelection();
      refresh();
    } catch (err: any) {
      toast.error(err?.message ?? t("Failed to merge requests"));
    } finally {
      setIsMerging(false);
    }
  };

  const tabsWithBadges: PageTab[] = [
    { label: t("All"), value: "", badge: stats.total || undefined },
    { label: t("Pending"), value: "pending", badge: stats.pending || undefined },
    {
      label: t("Processing"),
      value: "processing",
      badge: stats.processing || undefined,
    },
    { label: t("Approved"), value: "approved", badge: stats.approved || undefined },
    { label: t("Rejected"), value: "rejected", badge: stats.rejected || undefined },
  ];

  const tiles = [
    {
      label: t("Total Requests"),
      value: stats.total,
      icon: ClipboardList,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: t("Pending Review"),
      value: stats.pending,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-500/10",
    },
    {
      label: t("Processing"),
      value: stats.processing,
      icon: Activity,
      color: "text-blue-600",
      bg: "bg-blue-500/10",
    },
    {
      label: t("Approved"),
      value: stats.approved,
      icon: CheckCircle,
      color: "text-emerald-600",
      bg: "bg-emerald-500/10",
    },
    {
      label: t("Rejected"),
      value: stats.rejected,
      icon: XCircle,
      color: "text-red-600",
      bg: "bg-red-500/10",
    },
  ];

  const rowProps = {
    role: activeRole,
    selectedIds,
    approvingId,
    showOffice: isAdmin && officeFilter === "all",
    onToggleSelected: toggleSelected,
    onApprove: handleApprove,
    onReject: (id: string) => setRejectingId(id),
    onSchedule: (req: ServiceRequest) => setSchedulingRequest(req),
    onReview: (req: ServiceRequest) => setReviewingRequest(req),
  };

  return (
    <PageLayout
      title={t("Request Management")}
      description={t("Review and process service requests for your office")}
      icon={ClipboardList}
      tabs={tabsWithBadges}
      activeTab={statusFilter}
      onTabChange={(value) => { setStatusFilter(value); setCurrentPage(1); }}
      actions={
        <Button variant="outline" onClick={refresh} className="h-10 rounded-xl">
          <RefreshCw className={cn("mr-2 size-4", isLoading && "animate-spin")} />
          {t("Refresh")}
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Stats — the whole queue, not the page on screen */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {tiles.map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label} className="border-none bg-card/50 shadow-sm ring-1 ring-border/50 backdrop-blur-sm">
              <CardContent className="flex items-center gap-3 p-4">
                <div className={cn("shrink-0 rounded-xl p-2.5", bg)}>
                  <Icon className={cn("size-5", color)} />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-black leading-none">{value}</p>
                  <p className="mt-1 truncate text-xs font-medium text-muted-foreground">
                    {label}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search, office filter, view toggle */}
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative min-w-0 flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("Search by request number, customer or service...")}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 rounded-xl pl-9"
            />
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-3 py-1.5">
            <Filter className="size-4 shrink-0 text-muted-foreground" />
            <Building2 className="size-4 shrink-0 text-muted-foreground sm:hidden" />
            <Select
              value={officeFilter}
              onValueChange={(value) => {
                setOfficeFilter(value);
                setCurrentPage(1);
              }}
              disabled={!isAdmin}
            >
              <SelectTrigger className="h-9 w-[200px] border-none bg-transparent focus:ring-0">
                <SelectValue
                  placeholder={isAdmin ? t("All Offices") : t("Your Office")}
                />
              </SelectTrigger>
              <SelectContent>
                {isAdmin && <SelectItem value="all">{t("All Offices")}</SelectItem>}
                {officeOptions.map((office) => (
                  <SelectItem key={office.id} value={office.id}>
                    {office.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table or cards. The table carries more at a glance; the cards
              stay readable on a phone, where nine columns cannot. */}
          <div className="flex items-center gap-0.5 rounded-xl border border-border/50 bg-muted/50 p-1 sm:ml-auto">
            <Button
              variant={view === "table" ? "secondary" : "ghost"}
              size="icon"
              className="size-8 rounded-lg"
              onClick={() => setView("table")}
              title={t("Table view")}
            >
              <List className="size-4" />
            </Button>
            <Button
              variant={view === "card" ? "secondary" : "ghost"}
              size="icon"
              className="size-8 rounded-lg"
              onClick={() => setView("card")}
              title={t("Card view")}
            >
              <LayoutGrid className="size-4" />
            </Button>
          </div>

          {!isAdmin && sessionOfficeName && (
            <p className="w-full text-xs text-muted-foreground sm:w-auto">
              {t("Showing requests for")} <strong>{sessionOfficeName}</strong>
            </p>
          )}
        </div>

        {/* Selection bar — appears only once something is ticked */}
        {selectedIds.length > 0 && (
          <div className="flex flex-col gap-3 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-2 text-sm">
              <GitMerge className="size-4 shrink-0 text-primary" />
              <span className="font-semibold">
                {t("{count} selected", { count: selectedIds.length })}
              </span>
              {selectedIds.length >= 2 && !canMergeSelection && (
                <span className="text-muted-foreground">
                  · {t("Requests from different customers cannot be merged.")}
                </span>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                size="sm"
                onClick={openMergeDialog}
                disabled={!canMergeSelection}
                className="h-9 rounded-lg text-xs font-bold"
              >
                <GitMerge className="mr-1.5 size-3.5" />
                {t("Merge duplicates")}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={clearSelection}
                className="h-9 rounded-lg text-xs font-semibold"
              >
                <X className="mr-1.5 size-3.5" />
                {t("Clear")}
              </Button>
            </div>
          </div>
        )}

        {/* Queue */}
        {isLoading ? (
          <div className="flex h-48 items-center justify-center rounded-2xl border border-border/50 bg-card">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border/50 bg-card py-20 text-center">
            <div className="mb-4 rounded-full bg-muted/30 p-4">
              <ClipboardList className="size-10 text-muted-foreground/30" />
            </div>
            <p className="text-lg font-semibold">{t("No requests found")}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {search || statusFilter
                ? t("Try adjusting your filters")
                : t("No requests have been submitted yet")}
            </p>
          </div>
        ) : view === "table" ? (
          <TableView requests={requests} {...rowProps} />
        ) : (
          <CardView requests={requests} {...rowProps} />
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="pt-2">
            <PaginationFooter
              currentPage={currentPage}
              pageSize={pageSize}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              startIndex={(currentPage - 1) * pageSize + 1}
              endIndex={Math.min(currentPage * pageSize, pagination.total)}
              onPageChange={setCurrentPage}
              onPageSizeChange={(s) => {
                setPageSize(s);
                setCurrentPage(1);
              }}
              canGoNext={currentPage < pagination.totalPages}
              canGoPrevious={currentPage > 1}
              itemLabel={t("requests")}
            />
          </div>
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
        onSchedule={(req) => {
          setReviewingRequest(null);
          setSchedulingRequest(req);
        }}
      />

      {/* Opened automatically after a staff approval, and from the Schedule
          action on any approved request. Dismissing it is no longer final:
          the row keeps its button until the desk books a slot. */}
      <ScheduleAppointmentDialog
        request={schedulingRequest}
        open={!!schedulingRequest}
        onOpenChange={(o) => !o && setSchedulingRequest(null)}
        onSuccess={() => {
          setSchedulingRequest(null);
          refresh();
        }}
      />

      {/* ── Merge duplicates ─────────────────────────────────── */}
      <Dialog
        open={isMergeOpen}
        onOpenChange={(open) => {
          setIsMergeOpen(open);
          if (!open) setMergeNote("");
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("Merge duplicate requests")}</DialogTitle>
            <DialogDescription>
              {t("Choose the request to keep. The others are closed and marked as merged into it, and their attachments move across. Every reference number keeps working.")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              {t("Keep this request")}
            </p>

            <div className="space-y-2">
              {selectedRequests.map((request) => {
                const isPrimary = mergePrimaryId === request.id;
                return (
                  <button
                    key={request.id}
                    type="button"
                    onClick={() => setMergePrimaryId(request.id)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors",
                      isPrimary
                        ? "border-primary bg-primary/5"
                        : "border-border/50 hover:bg-muted/30",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2",
                        isPrimary
                          ? "border-primary bg-primary"
                          : "border-muted-foreground/40",
                      )}
                    >
                      {isPrimary && (
                        <span className="size-1.5 rounded-full bg-primary-foreground" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-mono text-sm font-semibold">
                        {request.requestNumber || request.id.slice(0, 8)}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {request.service?.name}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {t("Submitted")}{" "}
                        {new Date(request.createdAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </span>
                    {isPrimary && (
                      <Badge className="shrink-0 bg-primary text-[10px] font-bold uppercase">
                        {t("Keeping")}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="merge-note"
                className="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
              >
                {t("Note (optional)")}
              </label>
              <Textarea
                id="merge-note"
                rows={2}
                className="resize-none rounded-xl"
                placeholder={t("Why these are duplicates...")}
                value={mergeNote}
                onChange={(e) => setMergeNote(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {t("Recorded on each merged request, so anyone opening one later can see what happened.")}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setIsMergeOpen(false)}
              disabled={isMerging}
            >
              {t("Cancel")}
            </Button>
            <Button
              className="rounded-xl"
              onClick={handleMerge}
              disabled={isMerging || !mergePrimaryId || selectedIds.length < 2}
            >
              {isMerging && <Loader2 className="mr-2 size-4 animate-spin" />}
              {t("Merge {count} into this one", {
                count: Math.max(0, selectedIds.length - 1),
              })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <AlertDialogTitle>{t("Reject This Request")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("Please provide a reason. The customer will be notified.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder={t("Enter rejection reason...")}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="min-h-20 resize-none rounded-xl"
          />
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">{t("Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={isRejecting || !rejectReason.trim()}
              className="rounded-xl bg-destructive hover:bg-destructive/90"
            >
              {isRejecting && <Loader2 className="mr-2 size-4 animate-spin" />}
              {t("Reject Request")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  );
}

// ── Shared row props ──────────────────────────────────────────────────────────
type QueueViewProps = {
  requests: ServiceRequest[];
  role: "staff" | "manager" | null;
  selectedIds: string[];
  approvingId: string | null;
  showOffice: boolean;
  onToggleSelected: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onSchedule: (req: ServiceRequest) => void;
  onReview: (req: ServiceRequest) => void;
};

/** Approve / Reject / Schedule / Open, in whichever view is showing. */
function RowActions({
  req,
  role,
  approvingId,
  onApprove,
  onReject,
  onSchedule,
  onReview,
  className,
}: Pick<
  QueueViewProps,
  "role" | "approvingId" | "onApprove" | "onReject" | "onSchedule" | "onReview"
> & {
  req: ServiceRequest;
  className?: string;
}) {
  const { t } = useTranslation();
  const { canApprove, canReject, canSchedule } = permissions(req, role);
  const isThisApproving = approvingId === req.id;
  const appointmentCount = req.appointments?.length ?? 0;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {canApprove && (
        <Button
          size="sm"
          onClick={() => onApprove(req.id)}
          disabled={isThisApproving}
          className="h-8 shrink-0 rounded-lg bg-emerald-600 px-3 text-xs font-bold text-white hover:bg-emerald-700"
        >
          {isThisApproving ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <>
              <CheckCircle className="mr-1 size-3" />
              {t("Approve")}
            </>
          )}
        </Button>
      )}
      {canReject && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => onReject(req.id)}
          className="h-8 shrink-0 rounded-lg border-destructive/30 px-3 text-xs font-bold text-destructive hover:bg-destructive/5"
        >
          <XCircle className="mr-1 size-3" />
          {t("Reject")}
        </Button>
      )}
      {canSchedule && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => onSchedule(req)}
          className="h-8 shrink-0 rounded-lg border-violet-500/30 px-3 text-xs font-bold text-violet-600 hover:bg-violet-500/5"
          title={
            appointmentCount > 0
              ? t("Book another appointment")
              : t("Schedule an appointment")
          }
        >
          <CalendarPlus className="mr-1 size-3" />
          {appointmentCount > 0 ? t("Book again") : t("Schedule")}
        </Button>
      )}
      <Button
        size="icon"
        variant="ghost"
        onClick={() => onReview(req)}
        title={t("View details")}
        className="size-8 shrink-0 rounded-lg text-primary hover:bg-primary/10"
      >
        <Eye className="size-4" />
      </Button>
    </div>
  );
}

// ── Table view ────────────────────────────────────────────────────────────────
function TableView({
  requests,
  role,
  selectedIds,
  approvingId,
  showOffice,
  onToggleSelected,
  onApprove,
  onReject,
  onSchedule,
  onReview,
}: QueueViewProps) {
  const { t } = useTranslation();

  return (
    <div className="overflow-hidden rounded-2xl border border-border/50 bg-card">
      <div className="overflow-x-auto">
        {/* Wider than most viewports, so it scrolls inside its own box
            rather than stretching the page. */}
        <table className="w-full min-w-[1140px] text-left text-sm">
          <thead>
            <tr className="border-b border-border/50 bg-muted/30">
              <th className="w-10 p-4">
                <span className="sr-only">{t("Select")}</span>
              </th>
              <th className="p-4 text-xs font-bold tracking-wider text-muted-foreground uppercase">{t("Request No.")}</th>
              <th className="p-4 text-xs font-bold tracking-wider text-muted-foreground uppercase">{t("Customer")}</th>
              <th className="p-4 text-xs font-bold tracking-wider text-muted-foreground uppercase">{t("Service")}</th>
              <th className="p-4 text-xs font-bold tracking-wider text-muted-foreground uppercase">{t("Date")}</th>
              <th className="p-4 text-xs font-bold tracking-wider text-muted-foreground uppercase">{t("Status")}</th>
              <th className="p-4 text-xs font-bold tracking-wider text-muted-foreground uppercase">{t("Staff")}</th>
              <th className="p-4 text-xs font-bold tracking-wider text-muted-foreground uppercase">{t("Manager")}</th>
              <th className="p-4 text-right text-xs font-bold tracking-wider text-muted-foreground uppercase">{t("Actions")}</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => {
              const status = getOverallStatus(req);
              const { isMerged } = permissions(req, role);
              const isSelected = selectedIds.includes(req.id);

              // Who took each decision. A manager could previously see that a
              // request was approved but never by whom.
              const staffDecider = deciderName(req.approveStaff);
              const managerDecider = deciderName(req.approveManager);
              const appointmentCount = req.appointments?.length ?? 0;
              const fileCount = req.fileData?.length ?? 0;

              return (
                <tr
                  key={req.id}
                  className={cn(
                    "border-b border-border/50 transition-colors last:border-0 hover:bg-muted/10",
                    isSelected && "bg-primary/5",
                    isMerged && "opacity-60",
                  )}
                >
                  <td className="p-4">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onToggleSelected(req.id)}
                      disabled={isMerged}
                      aria-label={t("Select this request")}
                    />
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <RequestNumber value={req.requestNumber} copyable />
                      {isMerged && (
                        <Badge
                          variant="outline"
                          className="shrink-0 border-border text-[10px] font-bold uppercase"
                        >
                          <GitMerge className="mr-1 size-2.5" />
                          {t("Merged")}
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="font-semibold">{req.user?.username}</p>
                    <p className="text-xs text-muted-foreground">{req.user?.phoneNumber}</p>
                    {req.beneficiary && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="size-3 shrink-0" />
                        <span className="truncate">
                          {t("for")} {req.beneficiary.name}
                        </span>
                      </p>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2.5">
                      <span className={cn("size-2 shrink-0 rounded-full", STATUS_CONFIG[status].dot)} />
                      <div className="min-w-0">
                        <p className="font-medium">{req.service?.name}</p>
                        {/* With every office in view, which one a request
                            belongs to matters more than the applicant's
                            street address. */}
                        <p className="max-w-45 truncate text-xs text-muted-foreground">
                          {showOffice
                            ? req.service?.office?.name
                            : req.currentAddress}
                        </p>
                        {(appointmentCount > 0 || fileCount > 0) && (
                          <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                            {appointmentCount > 0 && (
                              <span className="flex items-center gap-1 font-semibold text-violet-600">
                                <Calendar className="size-3 shrink-0" />
                                {appointmentCount}
                              </span>
                            )}
                            {fileCount > 0 && (
                              <span className="flex items-center gap-1">
                                <Paperclip className="size-3 shrink-0" />
                                {fileCount}
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 whitespace-nowrap text-muted-foreground">
                    {fmtDate(req.date)}
                  </td>
                  <td className="p-4">
                    <StatusBadge status={status} />
                  </td>
                  <td className="p-4">
                    <GateBadge status={req.statusbystaff} />
                    {staffDecider && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <UserCheck className="size-3 shrink-0" />
                        <span className="max-w-32 truncate">{staffDecider}</span>
                      </p>
                    )}
                  </td>
                  <td className="p-4">
                    <GateBadge status={req.statusbyadmin} />
                    {managerDecider && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <ShieldCheck className="size-3 shrink-0" />
                        <span className="max-w-32 truncate">{managerDecider}</span>
                      </p>
                    )}
                  </td>
                  <td className="p-4">
                    <RowActions
                      req={req}
                      role={role}
                      approvingId={approvingId}
                      onApprove={onApprove}
                      onReject={onReject}
                      onSchedule={onSchedule}
                      onReview={onReview}
                      className="justify-end"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Card view ─────────────────────────────────────────────────────────────────
function CardView({
  requests,
  role,
  selectedIds,
  approvingId,
  showOffice,
  onToggleSelected,
  onApprove,
  onReject,
  onSchedule,
  onReview,
}: QueueViewProps) {
  const { t } = useTranslation();

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {requests.map((req) => {
        const status = getOverallStatus(req);
        const { isMerged } = permissions(req, role);
        const isSelected = selectedIds.includes(req.id);
        const staffDecider = deciderName(req.approveStaff);
        const managerDecider = deciderName(req.approveManager);
        const appointmentCount = req.appointments?.length ?? 0;
        const fileCount = req.fileData?.length ?? 0;

        return (
          <Card
            key={req.id}
            className={cn(
              "gap-0 overflow-hidden border-none p-0 shadow-sm ring-1 ring-border/50 transition-all",
              isSelected ? "ring-2 ring-primary" : "hover:ring-primary/20",
              isMerged && "opacity-60",
            )}
          >
            <div className={cn("h-1 w-full", STATUS_CONFIG[status].dot)} />

            <CardContent className="space-y-3 p-5">
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onToggleSelected(req.id)}
                  disabled={isMerged}
                  aria-label={t("Select this request")}
                  className="mt-1 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="leading-snug font-bold wrap-break-word">
                    {req.service?.name}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Building2 className="size-3 shrink-0" />
                    <span className="truncate">{req.service?.office?.name}</span>
                  </p>
                </div>
                <StatusBadge status={status} />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <RequestNumber value={req.requestNumber} copyable />
                <BeneficiaryBadge beneficiary={req.beneficiary} />
                {isMerged && (
                  <Badge
                    variant="outline"
                    className="shrink-0 border-border text-[10px] font-bold uppercase"
                  >
                    <GitMerge className="mr-1 size-2.5" />
                    {t("Merged")}
                  </Badge>
                )}
              </div>

              <Separator />

              {/* Applicant */}
              <div className="min-w-0 text-sm">
                <p className="truncate font-semibold">{req.user?.username}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {req.user?.phoneNumber}
                </p>
              </div>

              {/* Meta */}
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Calendar className="size-3.5 shrink-0" />
                  <span className="truncate">{fmtDate(req.date)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="size-3.5 shrink-0" />
                  <span className="truncate">
                    {showOffice
                      ? req.service?.office?.roomNumber || req.currentAddress
                      : req.currentAddress}
                  </span>
                </div>
                {appointmentCount > 0 && (
                  <div className="flex items-center gap-1.5 font-semibold text-violet-600">
                    <Calendar className="size-3.5 shrink-0" />
                    <span>
                      {appointmentCount} {t("appointment")}
                      {appointmentCount > 1 ? "s" : ""}
                    </span>
                  </div>
                )}
                {fileCount > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Paperclip className="size-3.5 shrink-0" />
                    <span>
                      {fileCount} {t("file")}
                      {fileCount > 1 ? "s" : ""}
                    </span>
                  </div>
                )}
              </div>

              {/* Both gates, and who closed them */}
              <div className="flex gap-2">
                <div className="min-w-0 flex-1 space-y-1 rounded-lg bg-muted/40 px-2 py-1.5 text-center">
                  <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                    {t("Staff")}
                  </p>
                  <GateBadge status={req.statusbystaff} />
                  {staffDecider && (
                    <p className="truncate text-[10px] text-muted-foreground">
                      {staffDecider}
                    </p>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-1 rounded-lg bg-muted/40 px-2 py-1.5 text-center">
                  <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                    {t("Manager")}
                  </p>
                  <GateBadge status={req.statusbyadmin} />
                  {managerDecider && (
                    <p className="truncate text-[10px] text-muted-foreground">
                      {managerDecider}
                    </p>
                  )}
                </div>
              </div>

              {/* Why it was turned down — on the card, not two clicks away */}
              {req.rejectionReason && (
                <div className="space-y-1 rounded-xl border border-red-500/20 bg-red-500/5 p-3">
                  <p className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-red-600 uppercase">
                    <Ban className="size-3.5 shrink-0" />
                    {req.mergedInto
                      ? t("Merged into another request")
                      : t("Reason for rejection")}
                  </p>
                  <p className="line-clamp-3 text-sm leading-relaxed wrap-break-word">
                    {req.rejectionReason}
                  </p>
                </div>
              )}

              <RowActions
                req={req}
                role={role}
                approvingId={approvingId}
                onApprove={onApprove}
                onReject={onReject}
                onSchedule={onSchedule}
                onReview={onReview}
                className="flex-wrap justify-end pt-1"
              />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
