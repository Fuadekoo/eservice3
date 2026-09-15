"use client";

import * as React from "react";
import {
  FileText,
  Calendar,
  MapPin,
  Building2,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  Download,
  User,
  Phone,
  MessageSquare,
  UserCheck,
  ShieldCheck,
  Users,
  GitMerge,
  Ban,
  CalendarPlus,
  Clock,
  Activity,
  Star,
  Paperclip,
} from "lucide-react";
import { toast } from "sonner";

import {
  deciderName,
  getOverallStatus,
  useRequestStore,
  type OverallStatus,
  type ServiceRequest,
} from "@/lib/stores/request-store";
import { PdfViewerModal } from "@/components/ui/pdf-viewer-modal";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { getUploadUrl } from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { RequestNumber } from "@/components/dashboard/request-number";

type TabValue = "details" | "files";

/** The fields of a booked slot this sheet actually reads. */
type BookedSlot = {
  id: string;
  date: string;
  time?: string | null;
  status: string;
};

/**
 * The same four states the queue shows, so a request does not change status
 * when you open it. "processing" is the half-approved middle — past staff
 * review, waiting on the manager.
 */
const STATUS_CONFIG: Record<
  OverallStatus,
  { label: string; icon: React.ElementType; badge: string }
> = {
  pending: {
    label: "Pending",
    icon: Clock,
    badge: "border-amber-500/20 bg-amber-500/10 text-amber-600",
  },
  processing: {
    label: "Processing",
    icon: Activity,
    badge: "border-blue-500/20 bg-blue-500/10 text-blue-600",
  },
  approved: {
    label: "Approved",
    icon: CheckCircle,
    badge: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    badge: "border-red-500/20 bg-red-500/10 text-red-600",
  },
};

const GATE_COLORS = {
  pending: { dot: "bg-amber-500", text: "text-amber-600", bg: "bg-amber-500/10" },
  approved: {
    dot: "bg-emerald-500",
    text: "text-emerald-600",
    bg: "bg-emerald-500/10",
  },
  rejected: { dot: "bg-red-500", text: "text-red-600", bg: "bg-red-500/10" },
} as const;

/** One gate of the two-step approval, and who closed it. */
function PipelineStep({
  label,
  status,
  who,
}: {
  label: string;
  status: "pending" | "approved" | "rejected";
  who?: string | null;
}) {
  const { t } = useTranslation();
  const colors = GATE_COLORS[status] ?? GATE_COLORS.pending;
  const stateLabel =
    status === "approved"
      ? t("Approved")
      : status === "rejected"
        ? t("Rejected")
        : t("Waiting");

  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          "size-3 shrink-0 rounded-full ring-2 ring-background",
          colors.dot,
        )}
      />
      <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
        <span className="truncate text-sm font-medium">{label}</span>
        <div className="flex shrink-0 items-center gap-2">
          {who && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <User className="size-3" />
              <span className="max-w-28 truncate">{who}</span>
            </span>
          )}
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-bold",
              colors.bg,
              colors.text,
            )}
          >
            {stateLabel}
          </span>
        </div>
      </div>
    </div>
  );
}

interface ReviewRequestDialogProps {
  request: ServiceRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffId: string | null;
  role: "staff" | "manager" | null;
  onSuccess: () => void;
  onApproveSuccess: (request: ServiceRequest) => void;
  /** Book a slot for a request that has already passed staff review. */
  onSchedule: (request: ServiceRequest) => void;
}

export function ReviewRequestDialog({
  request,
  open,
  onOpenChange,
  staffId,
  role,
  onSuccess,
  onApproveSuccess,
  onSchedule,
}: ReviewRequestDialogProps) {
  const { t } = useTranslation();

  const { approveRequestStaff, approveRequestManager, rejectRequest } =
    useRequestStore();

  const [activeTab, setActiveTab] = React.useState<TabValue>("details");
  const [notes, setNotes] = React.useState("");
  const [rejectReason, setRejectReason] = React.useState("");
  const [isApproving, setIsApproving] = React.useState(false);
  const [isRejecting, setIsRejecting] = React.useState(false);
  const [showRejectForm, setShowRejectForm] = React.useState(false);
  const [viewingFileId, setViewingFileId] = React.useState<string | null>(null);
  const [viewingFileName, setViewingFileName] = React.useState<string>("");
  const [viewingFilepath, setViewingFilepath] = React.useState<string>("");

  React.useEffect(() => {
    if (open && request) {
      setActiveTab("details");
      setNotes("");
      setRejectReason("");
      setShowRejectForm(false);
    }
  }, [open, request]);

  if (!request) return null;

  const handleApprove = async () => {
    if (!staffId) return;
    setIsApproving(true);
    try {
      if (role === "staff") {
        await approveRequestStaff(request.id, staffId, notes);
      } else if (role === "manager") {
        await approveRequestManager(request.id, staffId, notes);
      }
      toast.success(t("Request approved successfully"));
      onSuccess();
      onOpenChange(false);
      if (role === "staff") {
        onApproveSuccess(request);
      }
    } catch (err: any) {
      toast.error(err?.message || t("Failed to approve request"));
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error(t("Please enter a rejection reason"));
      return;
    }
    setIsRejecting(true);
    try {
      await rejectRequest(request.id, rejectReason.trim());
      toast.success(t("Request rejected"));
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || t("Failed to reject request"));
    } finally {
      setIsRejecting(false);
    }
  };

  // A duplicate that has been folded into another request is finished work:
  // the decision belongs on the request it was merged into.
  const isMerged = Boolean(request.mergedInto);

  const canApprove =
    isMerged
      ? false
      : role === "staff"
        ? request.statusbystaff === "pending"
        : role === "manager"
          ? // Manager sign-off is the second gate, so it only opens once staff
            // have passed the first — matching what the API now enforces.
            request.statusbyadmin === "pending" &&
            request.statusbystaff === "approved"
          : false;
  const canReject =
    isMerged
      ? false
      : role === "staff"
        ? request.statusbystaff === "pending"
        : role === "manager"
          ? request.statusbyadmin === "pending"
          : false;

  // Scheduling is the step after staff sign-off, and the reviewer is already
  // looking at the request — making them close the sheet to find the button
  // in the row behind it was the long way round.
  const canSchedule =
    !isMerged &&
    request.statusbystaff === "approved" &&
    request.statusbyadmin !== "rejected";

  const fileCount = request.fileData?.length || 0;
  const appointments = request.appointments ?? [];
  const satisfaction = request.customerSatisfaction;

  const status = getOverallStatus(request);
  const statusConfig = STATUS_CONFIG[status];
  const StatusIcon = statusConfig.icon;

  // Who actually decided. Recorded on every decision now, including
  // rejections, so the trail is complete rather than approvals-only.
  const staffDecider = deciderName(request.approveStaff);
  const managerDecider = deciderName(request.approveManager);
  const mergedDuplicates = request.mergedDuplicates ?? [];
  const decidedOn = request.decidedAt
    ? new Date(request.decidedAt).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  // The customer's note is stored as the `description` on the uploaded file
  // records (see request creation). Surface the first non-empty one.
  const customerNote = request.fileData
    ?.map((file: any) => file.description)
    .find((desc: string | null) => desc && desc.trim().length > 0);

  const tabs: { value: TabValue; label: string; badge?: number }[] = [
    { value: "details", label: t("Details") },
    { value: "files", label: t("Files"), badge: fileCount },
  ];

  const showFooter =
    activeTab === "details" &&
    (canApprove || canReject || canSchedule || showRejectForm);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-full! max-w-none! gap-0 overflow-hidden bg-background p-0 sm:w-[92vw]! sm:rounded-l-2xl lg:w-152!"
        >
          <div className="flex h-full min-h-0 flex-col">
            {/* ── Header ──────────────────────────────────── */}
            <div className="shrink-0 border-b border-border/60 bg-background">
              <div className="px-5 pt-5 pb-0 sm:px-6">
                <SheetHeader className="mb-4 gap-0.5 p-0 pr-12">
                  <SheetTitle className="flex items-center gap-2 text-lg font-bold sm:text-xl">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <FileText className="size-4" />
                    </div>
                    {t("Request Details")}
                  </SheetTitle>
                  <SheetDescription className="pl-10">
                    {t("View detailed information about this request")}
                  </SheetDescription>
                  <div className="mt-2 ml-10 flex flex-wrap items-center gap-2">
                    <RequestNumber
                      value={request.requestNumber}
                      variant="badge"
                      copyable
                      className="w-fit"
                    />
                    {/* The overall outcome, so the sheet and the row behind it
                        agree on what state the request is in. */}
                    <Badge
                      variant="outline"
                      className={cn(
                        "gap-1.5 text-xs font-bold",
                        statusConfig.badge,
                      )}
                    >
                      <StatusIcon className="size-3" />
                      {t(statusConfig.label)}
                    </Badge>
                  </div>
                </SheetHeader>

                {/* Underline tab bar */}
                <div
                  className="scrollbar-hide -mb-px flex overflow-x-auto"
                  role="tablist"
                >
                  {tabs.map((tab) => {
                    const isActive = activeTab === tab.value;
                    return (
                      <button
                        key={tab.value}
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => setActiveTab(tab.value)}
                        className={cn(
                          "flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all duration-150",
                          "focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none",
                          isActive
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
                        )}
                      >
                        {tab.label}
                        {tab.badge !== undefined && (
                          <span
                            className={cn(
                              "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
                              isActive
                                ? "bg-primary/15 text-primary"
                                : "bg-muted text-muted-foreground",
                            )}
                          >
                            {tab.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── Body ────────────────────────────────────── */}
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
              {/* Details tab */}
              {activeTab === "details" && (
                <div className="space-y-4">
                  {/* Applicant + status */}
                  <div className="min-w-0 rounded-xl border border-border/50 bg-muted/30 p-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                        {(request.user?.username || "U")
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1.5 text-sm font-bold">
                          <User className="size-3.5 shrink-0 text-muted-foreground" />
                          <span className="truncate">
                            {request.user?.username}
                          </span>
                        </p>
                        <a
                          href={`tel:${request.user?.phoneNumber ?? ""}`}
                          className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
                        >
                          <Phone className="size-3.5 shrink-0" />
                          <span className="truncate">
                            {request.user?.phoneNumber}
                          </span>
                        </a>
                      </div>
                      <Badge
                        className={cn(
                          "shrink-0 rounded-full border-none text-[10px] font-bold uppercase",
                          request.statusbystaff === "approved"
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                            : request.statusbystaff === "rejected"
                              ? "bg-destructive/15 text-destructive"
                              : "bg-amber-500/15 text-amber-700 dark:text-amber-400",
                        )}
                      >
                        {request.statusbystaff || t("pending")}
                      </Badge>
                    </div>

                    {/* Service name gets the full width — it is the longest field */}
                    <div className="mt-3 border-t border-border/50 pt-3">
                      <p className="text-xs font-medium text-muted-foreground">
                        {t("Service")}
                      </p>
                      <h3 className="mt-0.5 text-base leading-snug font-bold wrap-break-word">
                        {request.service?.name || t("Service")}
                      </h3>
                    </div>
                  </div>

                  {/* Request info grid */}
                  <div className="space-y-3 rounded-xl border border-border/50 bg-muted/10 px-4 py-3">
                    <div className="flex items-start gap-3 py-2 border-b border-border/40 last:border-0">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-muted-foreground">
                        <Calendar className="size-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">
                          {t("Preferred Date")}
                        </p>
                        <p className="text-sm font-semibold">
                          {new Date(request.date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 py-2 border-b border-border/40 last:border-0">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-muted-foreground">
                        <MapPin className="size-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">
                          {t("Current Address")}
                        </p>
                        <p className="text-sm font-semibold">
                          {request.currentAddress}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 py-2">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-muted-foreground">
                        <Building2 className="size-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">
                          {t("Office & Room")}
                        </p>
                        <p className="text-sm font-semibold">
                          {request.service?.office?.name}
                          {request.service?.office?.roomNumber &&
                            ` — ${request.service.office.roomNumber}`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Who the request is actually for */}
                  {request.beneficiary && (
                    <div className="space-y-2 rounded-xl border border-border/50 bg-muted/10 px-4 py-3">
                      <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                        <Users className="size-3.5" />
                        {t("Applying on behalf of")}
                      </p>
                      <div className="space-y-0.5 text-sm">
                        <p className="font-semibold">
                          {request.beneficiary.name}
                        </p>
                        <p className="text-muted-foreground">
                          {request.beneficiary.relationship}
                          {request.beneficiary.phoneNumber
                            ? ` · ${request.beneficiary.phoneNumber}`
                            : ""}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Where the request has got to. Two gates, in order —
                      the sheet used to show only the staff column, so a
                      reviewer could not tell a request waiting on the manager
                      from one that was finished. */}
                  <div className="space-y-3 rounded-xl border border-border/50 bg-muted/10 px-4 py-3">
                    <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                      <Activity className="size-3.5" />
                      {t("Approval Pipeline")}
                    </p>
                    <div className="space-y-2">
                      <PipelineStep
                        label={t("Staff Review")}
                        status={request.statusbystaff}
                        who={staffDecider}
                      />
                      <div className="ml-1.5 h-4 w-px bg-border" />
                      <PipelineStep
                        label={t("Manager Review")}
                        status={request.statusbyadmin}
                        who={managerDecider}
                      />
                    </div>
                  </div>

                  {/* Appointments already booked against this request.
                      Without them, the desk had no way of telling whether a
                      slot had been given before offering another. */}
                  {appointments.length > 0 && (
                    <div className="space-y-2 rounded-xl border border-border/50 bg-muted/10 px-4 py-3">
                      <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                        <Calendar className="size-3.5" />
                        {t("Appointments ({count})", {
                          count: appointments.length,
                        })}
                      </p>
                      <div className="space-y-2">
                        {appointments.map((appointment: BookedSlot) => (
                          <div
                            key={appointment.id}
                            className="flex items-center justify-between gap-2 text-sm"
                          >
                            <div className="flex min-w-0 items-center gap-2">
                              <Calendar className="size-4 shrink-0 text-violet-500" />
                              <span className="truncate font-medium">
                                {new Date(appointment.date).toLocaleDateString(
                                  "en-US",
                                  {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  },
                                )}
                              </span>
                              {appointment.time && (
                                <span className="shrink-0 text-muted-foreground">
                                  {appointment.time}
                                </span>
                              )}
                            </div>
                            <Badge
                              variant="outline"
                              className={cn(
                                "shrink-0 text-xs font-semibold",
                                appointment.status === "approved"
                                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
                                  : appointment.status === "rejected"
                                    ? "border-red-500/20 bg-red-500/10 text-red-600"
                                    : "bg-muted text-muted-foreground",
                              )}
                            >
                              {appointment.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Decision trail — who decided what, and what they said.
                      A manager could previously see only that a request had
                      been approved, never by whom. */}
                  {(staffDecider ||
                    managerDecider ||
                    request.approveNote ||
                    request.rejectionReason ||
                    request.mergedInto) && (
                    <div className="space-y-3 rounded-xl border border-border/50 bg-muted/10 px-4 py-3">
                      <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                        <ShieldCheck className="size-3.5" />
                        {t("Decision History")}
                      </p>

                      <div className="space-y-2.5">
                        {staffDecider && (
                          <div className="flex items-start gap-2.5">
                            <UserCheck
                              className={cn(
                                "mt-0.5 size-4 shrink-0",
                                request.statusbystaff === "approved"
                                  ? "text-emerald-600"
                                  : "text-destructive",
                              )}
                            />
                            <div className="min-w-0 text-sm">
                              <p className="font-semibold">
                                {request.statusbystaff === "approved"
                                  ? t("Approved by staff")
                                  : t("Rejected by staff")}
                              </p>
                              <p className="text-muted-foreground">
                                {staffDecider}
                              </p>
                            </div>
                          </div>
                        )}

                        {managerDecider && (
                          <div className="flex items-start gap-2.5">
                            <ShieldCheck
                              className={cn(
                                "mt-0.5 size-4 shrink-0",
                                request.statusbyadmin === "approved"
                                  ? "text-emerald-600"
                                  : "text-destructive",
                              )}
                            />
                            <div className="min-w-0 text-sm">
                              <p className="font-semibold">
                                {request.statusbyadmin === "approved"
                                  ? t("Approved by manager")
                                  : t("Rejected by manager")}
                              </p>
                              <p className="text-muted-foreground">
                                {managerDecider}
                              </p>
                            </div>
                          </div>
                        )}

                        {decidedOn && (
                          <p className="text-xs text-muted-foreground">
                            {t("Last decision")}: {decidedOn}
                          </p>
                        )}
                      </div>

                      {request.approveNote && (
                        <div className="border-t border-border/40 pt-2.5">
                          <p className="mb-1 text-xs font-semibold text-muted-foreground">
                            {t("Reviewer notes")}
                          </p>
                          <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                            {request.approveNote}
                          </p>
                        </div>
                      )}

                      {request.rejectionReason && (
                        <div className="border-t border-border/40 pt-2.5">
                          <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-destructive">
                            <Ban className="size-3.5" />
                            {t("Reason for rejection")}
                          </p>
                          <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                            {request.rejectionReason}
                          </p>
                        </div>
                      )}

                      {request.mergedInto && (
                        <div className="border-t border-border/40 pt-2.5">
                          <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                            <GitMerge className="size-3.5" />
                            {t("Merged into")}
                          </p>
                          <p className="text-sm font-semibold">
                            {request.mergedInto.requestNumber}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Duplicates folded into this one */}
                  {mergedDuplicates.length > 0 && (
                    <div className="space-y-2 rounded-xl border border-border/50 bg-muted/10 px-4 py-3">
                      <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                        <GitMerge className="size-3.5" />
                        {t("Duplicates merged in")}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {mergedDuplicates.map((duplicate) => (
                          <Badge
                            key={duplicate.id}
                            variant="outline"
                            className="font-mono text-[11px]"
                          >
                            {duplicate.requestNumber || duplicate.id.slice(0, 8)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Customer note */}
                  {customerNote && (
                    <div className="space-y-2 rounded-xl border border-border/50 bg-muted/10 px-4 py-3">
                      <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        <MessageSquare className="size-3.5" />
                        {t("Customer Note")}
                      </p>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {customerNote}
                      </p>
                    </div>
                  )}

                  {/* How the customer rated the service afterwards. It was
                      collected and stored but never shown to the office. */}
                  {satisfaction && (
                    <div className="space-y-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                      <p className="text-xs font-semibold tracking-wider text-amber-600 uppercase">
                        {t("Customer Rating")}
                      </p>
                      <div className="flex items-center gap-1.5">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star
                            key={index}
                            className={cn(
                              "size-4",
                              index < (satisfaction.rating ?? 0)
                                ? "fill-amber-400 text-amber-400"
                                : "text-muted-foreground/30",
                            )}
                          />
                        ))}
                        <span className="ml-1 text-sm font-bold text-amber-600">
                          {satisfaction.rating}/5
                        </span>
                      </div>
                      {satisfaction.comment && (
                        <p className="text-sm leading-relaxed break-words whitespace-pre-wrap text-muted-foreground italic">
                          &quot;{satisfaction.comment}&quot;
                        </p>
                      )}
                    </div>
                  )}

                  {/* Notes / reject form */}
                  {canApprove && !showRejectForm && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {t("Approval Notes")}
                      </p>
                      <Textarea
                        placeholder={t("Add optional notes for the customer...")}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="resize-none rounded-xl"
                        rows={2}
                      />
                    </div>
                  )}

                  {showRejectForm && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-destructive uppercase tracking-wider">
                        {t("Rejection Reason")}
                      </p>
                      <Textarea
                        placeholder={t("Enter reason for rejection (required)...")}
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="resize-none rounded-xl border-destructive/30 focus-visible:ring-destructive/30"
                        rows={3}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Files tab */}
              {activeTab === "files" && (
                <div className="space-y-3">
                  {fileCount > 0 ? (
                    request.fileData?.map((file: any, index: number) => {
                      const ext = (
                        String(file.name ?? "")
                          .split(".")
                          .pop() ?? ""
                      ).toUpperCase();
                      const isPdf = ext === "PDF";
                      return (
                        <div
                          key={file.id}
                          className="min-w-0 space-y-3 rounded-xl border border-border/50 bg-card p-4"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div
                              className={cn(
                                "flex size-9 shrink-0 items-center justify-center rounded-lg",
                                isPdf ? "bg-red-500/10" : "bg-primary/10",
                              )}
                            >
                              <FileText
                                className={cn(
                                  "size-4",
                                  isPdf ? "text-red-500" : "text-primary",
                                )}
                              />
                            </div>
                            <p className="min-w-0 flex-1 truncate text-sm font-semibold">
                              {file.name}
                            </p>
                            {ext && (
                              <Badge
                                variant="outline"
                                className="shrink-0 text-[10px] font-bold"
                              >
                                {ext}
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <span>{t("File")} {index + 1}</span>
                            <span className="mx-1">·</span>
                            <span>
                              {new Date(
                                file.createdAt || request.createdAt,
                              ).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 border-t border-border/40 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 flex-1 rounded-lg text-xs font-semibold"
                              onClick={() => {
                                setViewingFileId(file.id);
                                setViewingFileName(file.name);
                                setViewingFilepath(file.filepath);
                              }}
                            >
                              <Eye className="mr-1.5 size-4" />
                              {t("View")}
                            </Button>
                            <Button
                              asChild
                              variant="outline"
                              size="sm"
                              className="h-9 flex-1 rounded-lg text-xs font-semibold"
                            >
                              {/* Proxied through /api/uploads so the link works
                                  on any host, not just a local backend. */}
                              <a
                                href={getUploadUrl(file.filepath)}
                                download={file.name}
                              >
                                <Download className="mr-1.5 size-4" />
                                {t("Download")}
                              </a>
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/20">
                      <FileText className="mb-2 size-8 text-muted-foreground/30" />
                      <p className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
                        <Paperclip className="size-3.5" />
                        {t("No files attached")}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground/60">
                        {t("The applicant did not upload any documents")}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Footer (actions) ────────────────────────── */}
            {showFooter && (
              <div className="shrink-0 border-t border-border bg-muted/30 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-4">
                {showRejectForm ? (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="h-11 flex-1 rounded-xl font-semibold"
                      onClick={() => setShowRejectForm(false)}
                      disabled={isRejecting}
                    >
                      {t("Cancel")}
                    </Button>
                    <Button
                      variant="destructive"
                      className="h-11 flex-1 rounded-xl font-semibold"
                      onClick={handleReject}
                      disabled={isRejecting || !rejectReason.trim()}
                    >
                      {isRejecting && (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      )}
                      {t("Confirm Reject")}
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {canSchedule && (
                      <Button
                        variant="outline"
                        className="h-11 flex-1 rounded-xl border-violet-500/30 font-semibold text-violet-600 hover:bg-violet-500/5 hover:text-violet-600"
                        onClick={() => onSchedule(request)}
                      >
                        <CalendarPlus className="mr-1.5 size-4" />
                        {appointments.length > 0
                          ? t("Book again")
                          : t("Schedule")}
                      </Button>
                    )}
                    {canReject && (
                      <Button
                        variant="outline"
                        className="h-11 flex-1 rounded-xl border-destructive/30 font-semibold text-destructive hover:bg-destructive/5 hover:text-destructive"
                        onClick={() => setShowRejectForm(true)}
                      >
                        <XCircle className="mr-1.5 size-4" />
                        {t("Reject")}
                      </Button>
                    )}
                    {canApprove && (
                      <Button
                        className="h-11 flex-1 rounded-xl bg-emerald-600 font-semibold text-white hover:bg-emerald-700"
                        onClick={handleApprove}
                        disabled={isApproving}
                      >
                        {isApproving ? (
                          <Loader2 className="mr-2 size-4 animate-spin" />
                        ) : (
                          <CheckCircle className="mr-1.5 size-4" />
                        )}
                        {t("Approve")}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <PdfViewerModal
        open={!!viewingFileId}
        onOpenChange={(open) => !open && setViewingFileId(null)}
        fileId={viewingFileId!}
        filepath={viewingFilepath}
        fileName={viewingFileName}
      />
    </>
  );
}
