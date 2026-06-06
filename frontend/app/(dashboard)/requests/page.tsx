"use client";

import React from "react";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Activity,
  LayoutGrid,
  List,
  Search,
  RefreshCw,
  Eye,
  Trash2,
  Loader2,
  Calendar,
  MapPin,
  Building2,
  Star,
  ChevronRight,
  Paperclip,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { useRequestStore, type ServiceRequest } from "@/lib/stores/request-store";
import { useSession } from "@/hooks/use-session";
import { axiosInstance } from "@/lib/axios";
import { PageLayout, type PageTab } from "@/components/dashboard/page-layout";
import { PaginationFooter } from "@/components/dashboard/pagination-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

// ── Helpers ───────────────────────────────────────────────────────────────────
type OverallStatus = "pending" | "processing" | "approved" | "rejected";

function getOverallStatus(req: ServiceRequest): OverallStatus {
  if (req.statusbystaff === "rejected" || req.statusbyadmin === "rejected") return "rejected";
  if (req.statusbystaff === "approved" && req.statusbyadmin === "approved") return "approved";
  if (req.statusbystaff === "approved") return "processing";
  return "pending";
}

const STATUS_CONFIG: Record<OverallStatus, {
  label: string;
  icon: React.ElementType;
  badge: string;
  dot: string;
}> = {
  pending:    { label: "Pending",    icon: Clock,        badge: "bg-amber-500/10 text-amber-600 border-amber-500/20",   dot: "bg-amber-500" },
  processing: { label: "Processing", icon: Activity,     badge: "bg-blue-500/10 text-blue-600 border-blue-500/20",      dot: "bg-blue-500" },
  approved:   { label: "Approved",   icon: CheckCircle,  badge: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", dot: "bg-emerald-500" },
  rejected:   { label: "Rejected",   icon: XCircle,      badge: "bg-red-500/10 text-red-600 border-red-500/20",         dot: "bg-red-500" },
};

function StatusBadge({ status }: { status: OverallStatus }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={cn("font-semibold text-xs gap-1.5", cfg.badge)}>
      <Icon className="size-3" />
      {cfg.label}
    </Badge>
  );
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

const TABS = [
  { label: "All",        value: "" },
  { label: "Pending",    value: "pending" },
  { label: "Processing", value: "processing" },
  { label: "Approved",   value: "approved" },
  { label: "Rejected",   value: "rejected" },
];

// ── Page ──────────────────────────────────────────────────────────────────────
export default function MyRequestsPage() {
  const { isPending: isSessionPending } = useSession();
  const { requests, isLoading, pagination, fetchRequests } = useRequestStore();

  const [view, setView]             = React.useState<"table" | "card">("table");
  const [search, setSearch]         = React.useState("");
  const [statusTab, setStatusTab]   = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize]     = React.useState(10);

  const [detailReq, setDetailReq]   = React.useState<ServiceRequest | null>(null);
  const [deleteId, setDeleteId]     = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const refresh = React.useCallback(() => {
    fetchRequests({
      page: currentPage,
      pageSize,
      search: search || undefined,
      status: statusTab || undefined,
    });
  }, [fetchRequests, currentPage, pageSize, search, statusTab]);

  React.useEffect(() => {
    if (isSessionPending) return;
    refresh();
  }, [isSessionPending, currentPage, pageSize, search, statusTab]);

  // Stats from current page (approximate totals shown from pagination)
  const stats = React.useMemo(() => {
    const all = requests;
    return {
      total:      pagination?.total ?? all.length,
      pending:    all.filter(r => getOverallStatus(r) === "pending").length,
      processing: all.filter(r => getOverallStatus(r) === "processing").length,
      approved:   all.filter(r => getOverallStatus(r) === "approved").length,
      rejected:   all.filter(r => getOverallStatus(r) === "rejected").length,
    };
  }, [requests, pagination]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await axiosInstance.delete(`/requests/${deleteId}`);
      toast.success("Request cancelled successfully");
      setDeleteId(null);
      refresh();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to cancel request");
    } finally {
      setIsDeleting(false);
    }
  };

  const tabs: PageTab[] = TABS.map(tab => ({
    label: tab.label,
    value: tab.value,
    badge: tab.value === "" ? stats.total :
           tab.value === "pending" ? stats.pending :
           tab.value === "processing" ? stats.processing :
           tab.value === "approved" ? stats.approved :
           tab.value === "rejected" ? stats.rejected : undefined
  }));

  return (
    <PageLayout
      title="My Requests"
      description="Track and manage your service applications"
      icon={FileText}
      tabs={tabs}
      activeTab={statusTab}
      onTabChange={(val) => { setStatusTab(val); setCurrentPage(1); }}
      actions={
        <Button variant="outline" onClick={refresh} className="h-10 rounded-xl shrink-0">
          <RefreshCw className={cn("mr-2 size-4", isLoading && "animate-spin")} />
          Refresh
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Total",      value: stats.total,      icon: FileText,      color: "text-primary",     bg: "bg-primary/10" },
            { label: "Pending",    value: stats.pending,    icon: Clock,         color: "text-amber-600",   bg: "bg-amber-500/10" },
            { label: "Processing", value: stats.processing, icon: Activity,      color: "text-blue-600",    bg: "bg-blue-500/10" },
            { label: "Approved",   value: stats.approved,   icon: CheckCircle,   color: "text-emerald-600", bg: "bg-emerald-500/10" },
            { label: "Rejected",   value: stats.rejected,   icon: XCircle,       color: "text-red-600",     bg: "bg-red-500/10" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label} className="border-none shadow-sm ring-1 ring-border/50 bg-card/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={cn("p-2 rounded-lg shrink-0", bg)}>
                  <Icon className={cn("size-4", color)} />
                </div>
                <div>
                  <p className="text-xl font-black leading-none">{value}</p>
                  <p className="text-xs text-muted-foreground font-medium mt-0.5">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative flex-1 sm:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search requests..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className="pl-9 h-10 rounded-xl"
              />
            </div>

            {/* View toggle */}
            <div className="flex items-center gap-0.5 bg-muted/50 rounded-xl p-1 border border-border/50">
              <Button
                variant={view === "table" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => setView("table")}
                title="Table view"
              >
                <List className="size-4" />
              </Button>
              <Button
                variant={view === "card" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => setView("card")}
                title="Card view"
              >
                <LayoutGrid className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="size-7 animate-spin text-primary" />
        </div>
      ) : requests.length === 0 ? (
        <EmptyState search={search} statusTab={statusTab} />
      ) : view === "table" ? (
        <TableView
          requests={requests}
          onView={setDetailReq}
          onDelete={(id) => setDeleteId(id)}
        />
      ) : (
        <CardView
          requests={requests}
          onView={setDetailReq}
          onDelete={(id) => setDeleteId(id)}
        />
      )}

      {/* Pagination */}
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

      {/* Detail dialog */}
      <RequestDetailDialog
        request={detailReq}
        onClose={() => setDetailReq(null)}
      />

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this request?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your request. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl" disabled={isDeleting}>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-xl bg-destructive hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="size-4 animate-spin mr-2" />}
              Yes, cancel request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ search, statusTab }: { search: string; statusTab: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 rounded-2xl border-2 border-dashed border-border text-center">
      <div className="p-4 rounded-full bg-muted/30 mb-4">
        <FileText className="size-10 text-muted-foreground/30" />
      </div>
      <p className="font-bold text-lg">No requests found</p>
      <p className="text-sm text-muted-foreground mt-1">
        {search || statusTab ? "Try adjusting your filters." : "You haven't submitted any service requests yet."}
      </p>
    </div>
  );
}

// ── Table View ────────────────────────────────────────────────────────────────
function TableView({
  requests,
  onView,
  onDelete,
}: {
  requests: ServiceRequest[];
  onView: (r: ServiceRequest) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 bg-muted/30">
              <th className="px-5 py-3.5 text-left font-bold text-xs uppercase tracking-wider text-muted-foreground">Service</th>
              <th className="px-5 py-3.5 text-left font-bold text-xs uppercase tracking-wider text-muted-foreground">Office</th>
              <th className="px-5 py-3.5 text-left font-bold text-xs uppercase tracking-wider text-muted-foreground hidden md:table-cell">Date</th>
              <th className="px-5 py-3.5 text-left font-bold text-xs uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Address</th>
              <th className="px-5 py-3.5 text-left font-bold text-xs uppercase tracking-wider text-muted-foreground">Status</th>
              <th className="px-5 py-3.5 text-right font-bold text-xs uppercase tracking-wider text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => {
              const status = getOverallStatus(req);
              const canDelete = status === "pending";
              return (
                <tr
                  key={req.id}
                  className="border-b border-border/50 last:border-0 hover:bg-muted/10 transition-colors"
                >
                  {/* Service */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className={cn("size-2 rounded-full shrink-0", STATUS_CONFIG[status].dot)} />
                      <div>
                        <p className="font-semibold line-clamp-1">{req.service?.name}</p>
                        {req.appointments?.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {req.appointments.length} appointment{req.appointments.length > 1 ? "s" : ""}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Office */}
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium line-clamp-1">{req.service?.office?.name}</p>
                  </td>

                  {/* Date */}
                  <td className="px-5 py-4 hidden md:table-cell text-muted-foreground whitespace-nowrap">
                    {fmtDate(req.date)}
                  </td>

                  {/* Address */}
                  <td className="px-5 py-4 hidden lg:table-cell">
                    <p className="text-muted-foreground line-clamp-1 max-w-44">{req.currentAddress}</p>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4">
                    <StatusBadge status={status} />
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1 justify-end">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-lg"
                        onClick={() => onView(req)}
                        title="View details"
                      >
                        <Eye className="size-4" />
                      </Button>
                      {canDelete && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => onDelete(req.id)}
                          title="Cancel request"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </div>
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

// ── Card View ─────────────────────────────────────────────────────────────────
function CardView({
  requests,
  onView,
  onDelete,
}: {
  requests: ServiceRequest[];
  onView: (r: ServiceRequest) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {requests.map((req) => {
        const status = getOverallStatus(req);
        const canDelete = status === "pending";

        return (
          <Card
            key={req.id}
            className="border-none shadow-sm ring-1 ring-border/50 hover:ring-primary/20 hover:shadow-md transition-all duration-200 bg-card/60 group"
          >
            {/* Color top bar */}
            <div className={cn("h-1 w-full rounded-t-xl", STATUS_CONFIG[status].dot)} />

            <CardHeader className="p-5 pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-bold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {req.service?.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Building2 className="size-3 text-muted-foreground shrink-0" />
                    <p className="text-xs text-muted-foreground line-clamp-1">{req.service?.office?.name}</p>
                  </div>
                </div>
                <StatusBadge status={status} />
              </div>
            </CardHeader>

            <CardContent className="px-5 pb-5 space-y-3">
              <Separator />

              {/* Meta */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="size-3.5 shrink-0" />
                  <span>{fmtDate(req.date)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="size-3.5 shrink-0" />
                  <span className="line-clamp-1">{req.currentAddress}</span>
                </div>
                {req.appointments?.length > 0 && (
                  <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
                    <Calendar className="size-3.5 shrink-0 text-violet-500" />
                    <span className="text-violet-600 font-semibold">
                      {req.appointments.length} appointment{req.appointments.length > 1 ? "s" : ""}
                    </span>
                  </div>
                )}
                {req.fileData?.length > 0 && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Paperclip className="size-3.5 shrink-0" />
                    <span>{req.fileData.length} file{req.fileData.length > 1 ? "s" : ""}</span>
                  </div>
                )}
                {req.customerSatisfaction?.rating && (
                  <div className="flex items-center gap-1 text-amber-500">
                    {Array.from({ length: req.customerSatisfaction.rating }).map((_, i) => (
                      <Star key={i} className="size-3 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                )}
              </div>

              {/* Staff / Admin status detail */}
              <div className="flex gap-2">
                <div className={cn(
                  "flex-1 text-center text-xs py-1.5 rounded-lg font-semibold",
                  req.statusbystaff === "approved" ? "bg-emerald-500/10 text-emerald-600" :
                  req.statusbystaff === "rejected" ? "bg-red-500/10 text-red-600" :
                  "bg-muted text-muted-foreground"
                )}>
                  Staff: {req.statusbystaff}
                </div>
                <div className={cn(
                  "flex-1 text-center text-xs py-1.5 rounded-lg font-semibold",
                  req.statusbyadmin === "approved" ? "bg-emerald-500/10 text-emerald-600" :
                  req.statusbyadmin === "rejected" ? "bg-red-500/10 text-red-600" :
                  "bg-muted text-muted-foreground"
                )}>
                  Manager: {req.statusbyadmin}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-9 rounded-xl text-xs font-bold gap-1.5"
                  onClick={() => onView(req)}
                >
                  <Eye className="size-3.5" /> View Details
                </Button>
                {canDelete && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 w-9 rounded-xl p-0 text-destructive border-destructive/30 hover:bg-destructive/5"
                    onClick={() => onDelete(req.id)}
                    title="Cancel request"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ── Request Detail Dialog ─────────────────────────────────────────────────────
function RequestDetailDialog({
  request,
  onClose,
}: {
  request: ServiceRequest | null;
  onClose: () => void;
}) {
  if (!request) return null;
  const status = getOverallStatus(request);
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;

  return (
    <Dialog open={!!request} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl rounded-2xl p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="bg-primary px-6 py-5">
          <DialogHeader>
            <DialogTitle className="text-white font-black text-xl leading-snug">
              {request.service?.name}
            </DialogTitle>
            <p className="text-primary-foreground/70 text-sm mt-0.5 flex items-center gap-1.5">
              <Building2 className="size-3.5" />
              {request.service?.office?.name}
            </p>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Overall status + submitted */}
          <div className="flex items-center justify-between">
            <Badge variant="outline" className={cn("font-bold text-sm gap-1.5 px-3 py-1", cfg.badge)}>
              <Icon className="size-4" /> {cfg.label}
            </Badge>
            <p className="text-xs text-muted-foreground">
              Submitted {fmtDate(request.createdAt)}
            </p>
          </div>

          {/* Details grid */}
          <div className="rounded-xl border border-border bg-muted/20 p-4 grid sm:grid-cols-2 gap-4 text-sm">
            <DetailRow icon={Calendar} label="Preferred Date" value={fmtDate(request.date)} />
            <DetailRow icon={MapPin} label="Address" value={request.currentAddress} />
            <DetailRow icon={Building2} label="Office" value={request.service?.office?.name ?? "—"} />
            <DetailRow icon={MapPin} label="Room" value={request.service?.office?.roomNumber ?? "—"} />
          </div>

          {/* Approval pipeline */}
          <div className="rounded-xl border border-border p-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Approval Pipeline</p>
            <div className="space-y-2">
              <PipelineStep
                label="Staff Review"
                status={request.statusbystaff}
                who={request.approveStaff?.user?.username}
              />
              <div className="h-4 w-px bg-border ml-4" />
              <PipelineStep
                label="Manager Review"
                status={request.statusbyadmin}
                who={request.approveManager?.user?.username}
              />
            </div>
          </div>

          {/* Appointments */}
          {request.appointments?.length > 0 && (
            <div className="rounded-xl border border-border p-4 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Appointments ({request.appointments.length})
              </p>
              <div className="space-y-2">
                {request.appointments.map((apt: any) => (
                  <div key={apt.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="size-4 text-violet-500" />
                      <span className="font-medium">{fmtDate(apt.date)}</span>
                      {apt.time && <span className="text-muted-foreground">{apt.time}</span>}
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs font-semibold",
                        apt.status === "approved" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                        apt.status === "rejected" ? "bg-red-500/10 text-red-600 border-red-500/20" :
                        "bg-muted text-muted-foreground"
                      )}
                    >
                      {apt.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* File attachments */}
          {request.fileData?.length > 0 && (
            <div className="rounded-xl border border-border p-4 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Attachments ({request.fileData.length})
              </p>
              <div className="space-y-2">
                {request.fileData.map((f: any) => (
                  <div key={f.id} className="flex items-center gap-2 text-sm">
                    <Paperclip className="size-4 text-muted-foreground shrink-0" />
                    <span className="font-medium line-clamp-1">{f.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customer satisfaction */}
          {request.customerSatisfaction && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-600">Your Rating</p>
              <div className="flex items-center gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "size-5",
                      i < (request.customerSatisfaction?.rating ?? 0)
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground/30"
                    )}
                  />
                ))}
                <span className="text-sm font-bold text-amber-600 ml-1">
                  {request.customerSatisfaction.rating}/5
                </span>
              </div>
              {request.customerSatisfaction.comment && (
                <p className="text-sm text-muted-foreground italic">
                  "{request.customerSatisfaction.comment}"
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function DetailRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="size-4 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-semibold">{value}</p>
      </div>
    </div>
  );
}

function PipelineStep({
  label,
  status,
  who,
}: {
  label: string;
  status: "pending" | "approved" | "rejected";
  who?: string;
}) {
  const colors = {
    pending:  { dot: "bg-amber-500",   text: "text-amber-600",   bg: "bg-amber-500/10" },
    approved: { dot: "bg-emerald-500", text: "text-emerald-600", bg: "bg-emerald-500/10" },
    rejected: { dot: "bg-red-500",     text: "text-red-600",     bg: "bg-red-500/10" },
  };
  const c = colors[status];

  return (
    <div className="flex items-center gap-3">
      <span className={cn("size-3 rounded-full shrink-0 ring-2 ring-background", c.dot)} />
      <div className="flex-1 flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <div className="flex items-center gap-2">
          {who && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <User className="size-3" /> {who}
            </span>
          )}
          <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", c.bg, c.text)}>
            {status}
          </span>
        </div>
      </div>
    </div>
  );
}
