"use client";

import React from "react";
import {
  Star,
  MessageSquare,
  CheckCircle,
  Building2,
  Calendar,
  Clock,
  Loader2,
  Send,
  Edit3,
  MapPin,
  ThumbsUp,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";

import { axiosInstance } from "@/lib/axios";
import { useSession } from "@/hooks/use-session";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────
type ServiceRequest = {
  id: string;
  date: string;
  createdAt: string;
  statusbystaff: string;
  statusbyadmin: string;
  service?: {
    id: string;
    name: string;
    office?: { id: string; name: string; address?: string; roomNumber?: string };
  };
  customerSatisfaction?: { id: string; rating: number; comment: string | null } | null;
};

type FeedbackRecord = {
  id: string;
  requestId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  serviceName: string | null;
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const RATING_LABELS = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];
const RATING_COLORS = ["", "text-red-500", "text-orange-500", "text-yellow-500", "text-lime-500", "text-emerald-500"];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

// ── Star Rating Input ─────────────────────────────────────────────────────────
function StarInput({
  value,
  onChange,
  size = "lg",
}: {
  value: number;
  onChange: (v: number) => void;
  size?: "sm" | "lg";
}) {
  const [hovered, setHovered] = React.useState(0);
  const active = hovered || value;
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110 focus:outline-none"
        >
          <Star
            className={cn(
              "transition-colors",
              size === "lg" ? "size-9" : "size-5",
              star <= active ? "fill-amber-400 text-amber-400" : "text-muted-foreground/25"
            )}
          />
        </button>
      ))}
    </div>
  );
}

// ── Star Display ──────────────────────────────────────────────────────────────
function StarDisplay({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn(
            size === "md" ? "size-5" : "size-3.5",
            s <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"
          )}
        />
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function FeedbackPage() {
  const { isPending: isSessionPending } = useSession();

  const [tab, setTab] = React.useState<"pending" | "submitted">("pending");
  const [requests, setRequests] = React.useState<ServiceRequest[]>([]);
  const [feedbacks, setFeedbacks] = React.useState<FeedbackRecord[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Feedback dialog
  const [dialogReq, setDialogReq] = React.useState<ServiceRequest | null>(null);
  const [existingFeedback, setExistingFeedback] = React.useState<{ rating: number; comment: string | null } | null>(null);
  const [rating, setRating] = React.useState(0);
  const [comment, setComment] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const load = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [reqBody, fbBody] = await Promise.all([
        axiosInstance.get("/requests?pageSize=100") as unknown as Promise<{ data: ServiceRequest[] }>,
        axiosInstance.get("/feedbacks") as unknown as Promise<{ data: FeedbackRecord[] }>,
      ]);
      // Only show fully approved requests (eligible for feedback)
      const approved = (reqBody.data ?? []).filter(
        (r) => r.statusbystaff === "approved" && r.statusbyadmin === "approved"
      );
      setRequests(approved);
      setFeedbacks(fbBody.data ?? []);
    } catch {
      toast.error("Failed to load feedback data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (isSessionPending) return;
    void load();
  }, [isSessionPending, load]);

  // Split: requests without feedback vs those with feedback
  const feedbackMap = React.useMemo(() => {
    const map: Record<string, FeedbackRecord> = {};
    feedbacks.forEach((fb) => { map[fb.requestId] = fb; });
    return map;
  }, [feedbacks]);

  const pendingRequests  = requests.filter((r) => !feedbackMap[r.id]);
  const reviewedRequests = requests.filter((r) => !!feedbackMap[r.id]);

  const openDialog = (req: ServiceRequest, edit = false) => {
    const fb = feedbackMap[req.id];
    setDialogReq(req);
    setExistingFeedback(fb ? { rating: fb.rating, comment: fb.comment } : null);
    setRating(edit && fb ? fb.rating : 0);
    setComment(edit && fb ? (fb.comment ?? "") : "");
  };

  const handleSubmit = async () => {
    if (!dialogReq) return;
    if (rating === 0) { toast.error("Please select a rating."); return; }
    setIsSubmitting(true);
    try {
      await axiosInstance.put(`/feedbacks/${dialogReq.id}`, { rating, comment: comment || undefined });
      toast.success(existingFeedback ? "Feedback updated!" : "Thank you for your feedback!");
      setDialogReq(null);
      void load();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to submit feedback.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const avgRating = feedbacks.length > 0
    ? (feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length).toFixed(1)
    : null;

  return (
    <div className="space-y-6 p-6 lg:p-8 max-w-4xl">
      {/* Header */}
      <PageHeader
        title="Feedback"
        description="Rate your experience with completed service requests"
        icon={MessageSquare}
      />

      {/* Summary banner */}
      {!isLoading && (
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: "Awaiting Feedback",
              value: pendingRequests.length,
              icon: Inbox,
              color: "text-amber-600",
              bg: "bg-amber-500/10",
            },
            {
              label: "Reviews Given",
              value: reviewedRequests.length,
              icon: ThumbsUp,
              color: "text-emerald-600",
              bg: "bg-emerald-500/10",
            },
            {
              label: "Avg Rating",
              value: avgRating ? `${avgRating}/5` : "—",
              icon: Star,
              color: "text-amber-500",
              bg: "bg-amber-500/10",
            },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label} className="border-none shadow-sm ring-1 ring-border/50 bg-card/50">
              <CardContent className="p-4 flex items-center gap-3">
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
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-muted/50 rounded-xl p-1 border border-border/50 w-fit">
        {([
          { label: `Awaiting Feedback (${isLoading ? "…" : pendingRequests.length})`, value: "pending" },
          { label: `My Reviews (${isLoading ? "…" : reviewedRequests.length})`,       value: "submitted" },
        ] as const).map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
              tab === t.value ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="size-7 animate-spin text-primary" />
        </div>
      ) : tab === "pending" ? (
        pendingRequests.length === 0 ? (
          <EmptyState
            icon={ThumbsUp}
            title="All caught up!"
            body="You've rated all your completed service requests. Thank you!"
          />
        ) : (
          <div className="space-y-3">
            {pendingRequests.map((req) => (
              <PendingRequestCard key={req.id} req={req} onRate={() => openDialog(req)} />
            ))}
          </div>
        )
      ) : (
        reviewedRequests.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No reviews yet"
            body="Your submitted ratings will appear here once you rate a completed request."
          />
        ) : (
          <div className="space-y-4">
            {reviewedRequests.map((req) => {
              const fb = feedbackMap[req.id];
              return (
                <ReviewCard
                  key={req.id}
                  req={req}
                  feedback={fb}
                  onEdit={() => openDialog(req, true)}
                />
              );
            })}
          </div>
        )
      )}

      {/* Feedback Dialog */}
      <Dialog open={!!dialogReq} onOpenChange={(o) => !o && setDialogReq(null)}>
        <DialogContent className="max-w-md rounded-2xl p-0 gap-0 overflow-hidden">
          {dialogReq && (
            <>
              {/* Header */}
              <div className="bg-primary px-6 py-5">
                <DialogHeader>
                  <DialogTitle className="text-white font-black text-xl">
                    {existingFeedback ? "Update Your Review" : "Rate This Service"}
                  </DialogTitle>
                  <p className="text-primary-foreground/70 text-sm mt-0.5">
                    {dialogReq.service?.name}
                  </p>
                </DialogHeader>
              </div>

              <div className="p-6 space-y-6">
                {/* Service info */}
                <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
                  <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Building2 className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{dialogReq.service?.name}</p>
                    <p className="text-xs text-muted-foreground">{dialogReq.service?.office?.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{fmtDate(dialogReq.date)}</p>
                  </div>
                </div>

                {/* Star picker */}
                <div className="space-y-3 text-center">
                  <p className="text-sm font-bold text-muted-foreground">How was your experience?</p>
                  <div className="flex justify-center">
                    <StarInput value={rating} onChange={setRating} size="lg" />
                  </div>
                  {rating > 0 && (
                    <p className={cn("text-lg font-black", RATING_COLORS[rating])}>
                      {RATING_LABELS[rating]}
                    </p>
                  )}
                </div>

                <Separator />

                {/* Comment */}
                <div className="space-y-1.5">
                  <label className="text-sm font-bold">
                    Your Comment <span className="font-normal text-muted-foreground">(optional)</span>
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Tell us what went well or what could be improved..."
                    rows={4}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl h-11 font-bold"
                    onClick={() => setDialogReq(null)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 rounded-xl h-11 font-bold"
                    onClick={handleSubmit}
                    disabled={isSubmitting || rating === 0}
                  >
                    {isSubmitting ? (
                      <Loader2 className="size-4 animate-spin mr-2" />
                    ) : (
                      <Send className="size-4 mr-2" />
                    )}
                    {existingFeedback ? "Update Review" : "Submit Review"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Pending Request Card ──────────────────────────────────────────────────────
function PendingRequestCard({ req, onRate }: { req: ServiceRequest; onRate: () => void }) {
  return (
    <div className="flex items-center gap-4 p-5 rounded-2xl border border-border/60 bg-card hover:border-primary/30 hover:bg-muted/10 transition-all group">
      {/* Service icon */}
      <div className="size-12 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
        <Star className="size-6 text-amber-500" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-1">
        <p className="font-bold text-sm group-hover:text-primary transition-colors line-clamp-1">
          {req.service?.name ?? "Service"}
        </p>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
          {req.service?.office?.name && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Building2 className="size-3" /> {req.service.office.name}
            </span>
          )}
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="size-3" /> {fmtDate(req.date)}
          </span>
          {req.service?.office?.roomNumber && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3" /> Room {req.service.office.roomNumber}
            </span>
          )}
        </div>
      </div>

      {/* Badge + action */}
      <div className="flex items-center gap-3 shrink-0">
        <Badge
          variant="outline"
          className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-semibold text-xs hidden sm:flex"
        >
          <CheckCircle className="size-3 mr-1" /> Approved
        </Badge>
        <Button
          size="sm"
          className="h-9 rounded-xl font-bold px-4 bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20"
          onClick={onRate}
        >
          <Star className="size-3.5 mr-1.5 fill-white" /> Rate
        </Button>
      </div>
    </div>
  );
}

// ── Review Card ───────────────────────────────────────────────────────────────
function ReviewCard({
  req,
  feedback,
  onEdit,
}: {
  req: ServiceRequest;
  feedback: FeedbackRecord;
  onEdit: () => void;
}) {
  return (
    <Card className="border-none shadow-sm ring-1 ring-border/50 bg-card/60 hover:ring-primary/20 transition-all">
      <CardHeader className="p-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Rating badge */}
            <div className="size-12 rounded-xl bg-amber-500/10 flex flex-col items-center justify-center shrink-0">
              <p className="text-lg font-black text-amber-500 leading-none">{feedback.rating}</p>
              <p className="text-[9px] text-amber-500/70 font-bold">/ 5</p>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm line-clamp-1">{req.service?.name ?? "Service"}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{req.service?.office?.name}</p>
              <StarDisplay rating={feedback.rating} />
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge
              variant="outline"
              className={cn(
                "font-bold text-xs",
                RATING_COLORS[feedback.rating],
                "border-current bg-current/10"
              )}
            >
              {RATING_LABELS[feedback.rating]}
            </Badge>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary"
              onClick={onEdit}
              title="Edit review"
            >
              <Edit3 className="size-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-5 pb-5">
        <Separator className="mb-3" />
        {feedback.comment ? (
          <p className="text-sm text-muted-foreground italic border-l-2 border-primary/30 pl-3 leading-relaxed">
            "{feedback.comment}"
          </p>
        ) : (
          <p className="text-xs text-muted-foreground/50 italic">No written comment.</p>
        )}
        <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="size-3" /> Submitted {fmtDate(req.date)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="size-3" /> {fmtDate(feedback.createdAt)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ icon: Icon, title, body }: { icon: React.ElementType; title: string; body: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 rounded-2xl border-2 border-dashed border-border text-center">
      <div className="p-4 rounded-full bg-muted/30 mb-4">
        <Icon className="size-10 text-muted-foreground/30" />
      </div>
      <p className="font-bold text-lg">{title}</p>
      <p className="text-sm text-muted-foreground mt-1 max-w-xs">{body}</p>
    </div>
  );
}
