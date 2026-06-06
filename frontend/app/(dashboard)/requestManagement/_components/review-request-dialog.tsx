"use client";

import * as React from "react";
import {
  FileText,
  Calendar,
  MapPin,
  Building2,
  Paperclip,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

import { useRequestStore, type ServiceRequest } from "@/lib/stores/request-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface ReviewRequestDialogProps {
  request: ServiceRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffId: string | null;
  role: "staff" | "manager" | null;
  onSuccess: () => void;
  onApproveSuccess: (request: ServiceRequest) => void; // Trigger appointment schedule
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
  const { approveRequestStaff, approveRequestManager, rejectRequest } = useRequestStore();

  const [notes, setNotes] = React.useState("");
  const [rejectReason, setRejectReason] = React.useState("");
  const [isApproving, setIsApproving] = React.useState(false);
  const [isRejecting, setIsRejecting] = React.useState(false);
  const [showRejectForm, setShowRejectForm] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<any>(null);

  React.useEffect(() => {
    if (open && request) {
      setNotes("");
      setRejectReason("");
      setShowRejectForm(false);
      setSelectedFile(request.fileData?.length > 0 ? request.fileData[0] : null);
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
      
      // If staff approves, ask to schedule appointment
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

  const canApprove = role === "staff" ? request.statusbystaff === "pending" : role === "manager" ? request.statusbyadmin === "pending" : false;
  const canReject = role === "staff" ? request.statusbystaff !== "rejected" : role === "manager" ? request.statusbyadmin !== "rejected" : false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl rounded-2xl p-0 gap-0 overflow-hidden flex flex-col h-[85vh]">
        {/* Header */}
        <div className="bg-muted/30 border-b border-border px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <FileText className="size-5 text-primary" />
              {request.service?.name}
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
              <span className="font-semibold text-foreground">{request.user?.username}</span>
              <span>•</span>
              <span>{request.user?.phoneNumber}</span>
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 text-sm font-semibold">
            <span className={cn("px-2.5 py-0.5 rounded-full", request.statusbystaff === "approved" ? "bg-emerald-500/10 text-emerald-600" : request.statusbystaff === "rejected" ? "bg-red-500/10 text-red-600" : "bg-amber-500/10 text-amber-600")}>
              Staff: {request.statusbystaff}
            </span>
            <span className={cn("px-2.5 py-0.5 rounded-full", request.statusbyadmin === "approved" ? "bg-emerald-500/10 text-emerald-600" : request.statusbyadmin === "rejected" ? "bg-red-500/10 text-red-600" : "bg-amber-500/10 text-amber-600")}>
              Manager: {request.statusbyadmin}
            </span>
          </div>
        </div>

        {/* Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel: Document Viewer */}
          <div className="flex-1 border-r border-border bg-black/5 flex flex-col min-w-0">
            {request.fileData?.length > 0 ? (
              <>
                <div className="h-12 border-b border-border bg-card flex items-center px-4 gap-2 overflow-x-auto shrink-0">
                  {request.fileData.map((f: any) => (
                    <button
                      key={f.id}
                      onClick={() => setSelectedFile(f)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5",
                        selectedFile?.id === f.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/50 hover:bg-muted text-muted-foreground"
                      )}
                    >
                      <Paperclip className="size-3" />
                      {f.name}
                    </button>
                  ))}
                </div>
                <div className="flex-1 relative">
                  {selectedFile ? (
                    selectedFile.filepath.endsWith(".pdf") ? (
                      <iframe
                        src={`http://localhost:4000/files/${selectedFile.filepath}`}
                        className="w-full h-full border-none"
                        title="Document Viewer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-card p-4">
                        <img
                          src={`http://localhost:4000/files/${selectedFile.filepath}`}
                          alt={selectedFile.name}
                          className="max-w-full max-h-full object-contain rounded-xl shadow-sm border border-border"
                        />
                      </div>
                    )
                  ) : null}
                  {selectedFile && (
                    <a
                      href={`http://localhost:4000/files/${selectedFile.filepath}`}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-sm hover:bg-background border border-border shadow-sm text-foreground px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
                    >
                      <ExternalLink className="size-3.5" />
                      Open in new tab
                    </a>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
                <FileText className="size-12 opacity-20" />
                <p className="font-medium">No documents attached</p>
              </div>
            )}
          </div>

          {/* Right Panel: Details & Actions */}
          <div className="w-80 lg:w-96 bg-card flex flex-col shrink-0">
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Request Details</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2.5">
                    <Calendar className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Preferred Date</p>
                      <p className="font-semibold">{new Date(request.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <MapPin className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Current Address</p>
                      <p className="font-semibold">{request.currentAddress}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Building2 className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Office & Room</p>
                      <p className="font-semibold">{request.service?.office?.name} - {request.service?.office?.roomNumber}</p>
                    </div>
                  </div>
                </div>
              </div>

              {canApprove && !showRejectForm && (
                <div className="space-y-3 pt-4 border-t border-border">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Approval Notes</h4>
                  <Textarea
                    placeholder="Add optional notes for the customer..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="resize-none rounded-xl"
                    rows={3}
                  />
                </div>
              )}

              {showRejectForm && (
                <div className="space-y-3 pt-4 border-t border-border">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-red-500">Rejection Reason</h4>
                  <Textarea
                    placeholder="Enter reason for rejection (required)..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="resize-none rounded-xl border-red-500/30 focus-visible:ring-red-500/30"
                    rows={4}
                  />
                </div>
              )}
            </div>

            {/* Actions Footer */}
            <div className="p-4 bg-muted/20 border-t border-border space-y-2 shrink-0">
              {showRejectForm ? (
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowRejectForm(false)} disabled={isRejecting}>
                    Cancel
                  </Button>
                  <Button variant="destructive" className="flex-1 rounded-xl" onClick={handleReject} disabled={isRejecting || !rejectReason.trim()}>
                    {isRejecting && <Loader2 className="mr-2 size-4 animate-spin" />}
                    Confirm Reject
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  {canReject && (
                    <Button
                      variant="outline"
                      className="flex-1 rounded-xl text-red-600 border-red-500/30 hover:bg-red-50 hover:text-red-700"
                      onClick={() => setShowRejectForm(true)}
                    >
                      <XCircle className="size-4 mr-1.5" /> Reject
                    </Button>
                  )}
                  {canApprove && (
                    <Button
                      className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={handleApprove}
                      disabled={isApproving}
                    >
                      {isApproving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <CheckCircle className="size-4 mr-1.5" />}
                      Approve
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
