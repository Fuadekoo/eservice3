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
} from "lucide-react";
import { toast } from "sonner";

import {
  useRequestStore,
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

interface ReviewRequestDialogProps {
  request: ServiceRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffId: string | null;
  role: "staff" | "manager" | null;
  onSuccess: () => void;
  onApproveSuccess: (request: ServiceRequest) => void;
}

export function ReviewRequestDialog({
  request,
  open,
  onOpenChange,
  staffId,
  role,
  onSuccess,
  onApproveSuccess,
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

  const canApprove =
    role === "staff"
      ? request.statusbystaff === "pending"
      : role === "manager"
        ? request.statusbyadmin === "pending"
        : false;
  const canReject =
    role === "staff"
      ? request.statusbystaff !== "rejected"
      : role === "manager"
        ? request.statusbyadmin !== "rejected"
        : false;

  const fileCount = request.fileData?.length || 0;

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
    activeTab === "details" && (canApprove || canReject || showRejectForm);

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
                  <RequestNumber
                    value={request.requestNumber}
                    variant="badge"
                    copyable
                    className="ml-10 mt-2 w-fit"
                  />
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
                      <p className="text-sm font-semibold text-muted-foreground">
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
                  <div className="flex gap-2">
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
