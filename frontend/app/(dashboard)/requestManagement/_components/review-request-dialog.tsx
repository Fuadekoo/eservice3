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
  Eye,
  Download,
  Upload,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

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
  const { approveRequestStaff, approveRequestManager, rejectRequest } = useRequestStore();

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
      <DialogContent className="max-w-xl rounded-2xl p-6 gap-6 overflow-hidden">
        {/* Header matching the screenshot style */}
        <DialogHeader className="gap-1">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <FileText className="size-5 text-blue-600 shrink-0" />
            Request Details
          </DialogTitle>
          <DialogDescription>
            View detailed information about this request
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-xl mb-4 bg-muted/50 p-1">
            <TabsTrigger value="details" className="rounded-lg">Details</TabsTrigger>
            <TabsTrigger value="files" className="rounded-lg">
              Files ({request.fileData?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6 mt-0 border border-border/50 rounded-xl p-5 shadow-sm">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{request.service?.name}</h3>
                  <p className="text-sm text-muted-foreground">{request.user?.username} • {request.user?.phoneNumber}</p>
                </div>
              </div>

              <div className="space-y-3 text-sm border-y border-border py-4">
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

              {canApprove && !showRejectForm && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-muted-foreground">Approval Notes</h4>
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
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-red-500">Rejection Reason</h4>
                  <Textarea
                    placeholder="Enter reason for rejection (required)..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="resize-none rounded-xl border-red-500/30 focus-visible:ring-red-500/30"
                    rows={3}
                  />
                </div>
              )}

              <div className="pt-2">
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
          </TabsContent>

          <TabsContent value="files" className="space-y-4 mt-0">
            {/* List of files matching screenshot exactly */}
            {request.fileData?.map((file: any, index: number) => (
              <div key={file.id} className="border border-border/50 rounded-xl p-5 shadow-sm bg-card space-y-4">
                <div className="flex items-center gap-3">
                  <FileText className="size-6 text-red-500 shrink-0" />
                  <p className="font-bold text-sm truncate">{file.name}</p>
                </div>
                
                <div className="flex items-center gap-4 text-sm font-semibold">
                  <Badge variant="outline" className="rounded-lg px-3 py-1 font-semibold text-xs border-border/80">
                    PDF
                  </Badge>
                  
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setViewingFileId(file.id);
                      setViewingFileName(file.name);
                      setViewingFilepath(file.filepath);
                    }}
                    className="flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
                  >
                    <Eye className="size-4" />
                    <span>View</span>
                  </button>
                  
                  <a
                    href={`http://localhost:4000/files/${file.filepath}`}
                    download
                    className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                  >
                    <Download className="size-4" />
                    <span>Download</span>
                  </a>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                  <span>File {index + 1}</span>
                  <span>Size: Unknown MB</span>
                  <span>{new Date(file.createdAt || request.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}

            {(!request.fileData || request.fileData.length === 0) && (
              <div className="border border-border/50 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-2">
                <FileText className="size-8 text-muted-foreground/30" />
                <p className="text-sm font-semibold text-muted-foreground">No files attached</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>

      {/* PDF Viewer Modal */}
      <PdfViewerModal
        open={!!viewingFileId}
        onOpenChange={(open) => !open && setViewingFileId(null)}
        fileId={viewingFileId!}
        filepath={viewingFilepath}
        fileName={viewingFileName}
      />
    </Dialog>
  );
}
