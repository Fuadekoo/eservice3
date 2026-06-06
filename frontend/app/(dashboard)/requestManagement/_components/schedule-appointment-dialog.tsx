"use client";

import * as React from "react";
import {
  Calendar,
  Clock,
  Loader2,
  CalendarCheck,
  Building2,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";

import { useRequestStore, type ServiceRequest } from "@/lib/stores/request-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ScheduleAppointmentDialogProps {
  request: ServiceRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ScheduleAppointmentDialog({
  request,
  open,
  onOpenChange,
  onSuccess,
}: ScheduleAppointmentDialogProps) {
  const { createAppointment } = useRequestStore();
  
  const [date, setDate] = React.useState("");
  const [time, setTime] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open && request) {
      // Pre-fill with the preferred date from request
      if (request.date) {
        setDate(request.date.split("T")[0]);
      } else {
        setDate("");
      }
      setTime("09:00");
      setNotes("");
    }
  }, [open, request]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request || !date) return;

    setIsSubmitting(true);
    try {
      await createAppointment(request.id, date, time || undefined, notes || undefined);
      toast.success("Appointment scheduled successfully");
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to schedule appointment");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!request) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center size-10 rounded-xl bg-violet-500/10 text-violet-600">
              <CalendarCheck className="size-5" />
            </div>
            <div>
              <DialogTitle>Schedule Appointment</DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                For {request.user?.username} ({request.service?.name})
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-xs font-semibold uppercase text-muted-foreground">Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="date"
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="pl-9 rounded-xl"
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="time" className="text-xs font-semibold uppercase text-muted-foreground">Time</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="pl-9 rounded-xl"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-xs font-semibold uppercase text-muted-foreground">Notes for customer (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="e.g. Please bring original ID documents..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none rounded-xl"
              rows={3}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
              Skip
            </Button>
            <Button type="submit" disabled={isSubmitting || !date} className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white">
              {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Schedule
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
