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

import { useRequestStore, type ServiceRequest } from "@/lib/stores/request-store";
import { PdfViewerModal } from "@/components/ui/pdf-viewer-modal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

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
      toast.success("Request approved successfully");
      onSuccess();
      onOpenChange(false);
      if (role === "staff") {
        onApproveSuccess(request);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to approve request");
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("Please enter a rejection reason");
      return;
    }
    setIsRejecting(true);
    try {
      await rejectRequest(request.id, rejectReason.trim());
      toast.success("Request rejected");
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to reject request");
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
    { value: "details", label: "Details" },
    { value: "files", label: "Files", badge: fileCount },
  ];

  const showFooter =
    activeTab === "details" && (canApprove || canReject || showRejectForm);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-xl p-0 gap-0 rounded-2xl overflow-hidden flex flex-col">
          {/* ── Header ──────────────────────────────────── */}
          <div className="border-b border-border/60 bg-background shrink-0">
            <div className="px-6 pt-5 pb-0">
              <DialogHeader className="mb-4 space-y-0.5">
                <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileText className="size-4" />
                  </div>
                  Request Details
                </DialogTitle>
                <DialogDescription className="pl-10">
                  View detailed information about this request
                </DialogDescription>
              </DialogHeader>

              {/* Underline tab bar */}
              <div
                className="flex -mb-px overflow-x-auto scrollbar-hide"
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
                        "flex items-center gap-2 shrink-0 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-all duration-150",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                        isActive
                          ? "border-primary text-primary"
                          : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
                      )}
                    >
                      {tab.label}
                      {tab.badge !== undefined && (
                        <span
                          className={cn(
                            "inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-[10px] font-bold",
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
          <div className="flex-1 overflow-y-auto px-6 py-5 max-h-[60vh]">
            {/* Details tab */}
            {activeTab === "details" && (
              <div className="space-y-5">
                {/* Applicant info */}
                <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
                  <div className="size-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold text-lg">
                    {(request.user?.username || "U").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-base leading-tight">
                      {request.service?.name || "Service"}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <User className="size-3.5" />
                        {request.user?.username}
                      </span>
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Phone className="size-3.5" />
                        {request.user?.phoneNumber}
                      </span>
                    </div>
                  </div>
                  <Badge
                    className={cn(
                      "shrink-0 text-[10px] font-bold uppercase rounded-full border-none",
                      request.statusbystaff === "approved"
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                        : request.statusbystaff === "rejected"
                          ? "bg-destructive/15 text-destructive"
                          : "bg-amber-500/15 text-amber-700 dark:text-amber-400",
                    )}
                  >
                    {request.statusbystaff || "pending"}
                  </Badge>
                </div>

                {/* Request info grid */}
                <div className="space-y-3 rounded-xl border border-border/50 bg-muted/10 px-4 py-3">
                  <div className="flex items-start gap-3 py-2 border-b border-border/40 last:border-0">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-muted-foreground">
                      <Calendar className="size-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Preferred Date
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
                        Current Address
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
                        Office &amp; Room
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
                      Customer Note
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
                      Approval Notes
                    </p>
                    <Textarea
                      placeholder="Add optional notes for the customer..."
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
                      Rejection Reason
                    </p>
                    <Textarea
                      placeholder="Enter reason for rejection (required)..."
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
                  request.fileData?.map((file: any, index: number) => (
                    <div
                      key={file.id}
                      className="rounded-xl border border-border/50 bg-card p-4 space-y-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
                          <FileText className="size-4 text-red-500" />
                        </div>
                        <p className="font-semibold text-sm truncate flex-1">
                          {file.name}
                        </p>
                        <Badge
                          variant="outline"
                          className="text-[10px] font-bold shrink-0"
                        >
                          PDF
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span>File {index + 1}</span>
                        <span className="mx-1">·</span>
                        <span>
                          {new Date(
                            file.createdAt || request.createdAt,
                          ).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 pt-1 border-t border-border/40">
                        <button
                          onClick={() => {
                            setViewingFileId(file.id);
                            setViewingFileName(file.name);
                            setViewingFilepath(file.filepath);
                          }}
                          className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                        >
                          <Eye className="size-4" />
                          View
                        </button>
                        <a
                          href={`http://localhost:4000/files/${file.filepath}`}
                          download
                          className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                        >
                          <Download className="size-4" />
                          Download
                        </a>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/20">
                    <FileText className="size-8 text-muted-foreground/30 mb-2" />
                    <p className="text-sm font-semibold text-muted-foreground">
                      No files attached
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-0.5">
                      The applicant did not upload any documents
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Footer (actions) ────────────────────────── */}
          {showFooter && (
            <div className="shrink-0 border-t border-border bg-muted/30 px-6 py-4">
              {showRejectForm ? (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl"
                    onClick={() => setShowRejectForm(false)}
                    disabled={isRejecting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1 rounded-xl"
                    onClick={handleReject}
                    disabled={isRejecting || !rejectReason.trim()}
                  >
                    {isRejecting && (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    )}
                    Confirm Reject
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  {canReject && (
                    <Button
                      variant="outline"
                      className="flex-1 rounded-xl text-destructive border-destructive/30 hover:bg-destructive/5 hover:text-destructive"
                      onClick={() => setShowRejectForm(true)}
                    >
                      <XCircle className="size-4 mr-1.5" />
                      Reject
                    </Button>
                  )}
                  {canApprove && (
                    <Button
                      className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={handleApprove}
                      disabled={isApproving}
                    >
                      {isApproving ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      ) : (
                        <CheckCircle className="size-4 mr-1.5" />
                      )}
                      Approve
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

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
