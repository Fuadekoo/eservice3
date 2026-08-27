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
import { useTranslation } from "@/lib/i18n";
import { axiosInstance } from "@/lib/axios";
import {
  bookingDateIssue,
  todayAsInputValue,
  officeHoursOf,
  type OfficeHours,
} from "@/lib/office-hours";

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
  const { t } = useTranslation();

  const { createAppointment } = useRequestStore();
  
  const [date, setDate] = React.useState("");
  const [time, setTime] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [dateError, setDateError] = React.useState("");
  // Which weekdays this office takes bookings on. Fetched per request,
  // since a request only carries its office id.
  const [schedule, setSchedule] = React.useState<OfficeHours | undefined>(
    undefined,
  );

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
      setDateError("");
      setSchedule(undefined);

      const officeId = request.service?.office?.id;
      if (officeId) {
        void (async () => {
          try {
            const res = (await axiosInstance.get(
              `/offices/${officeId}`,
            )) as unknown as {
              data?: Parameters<typeof officeHoursOf>[0];
            };
            setSchedule(officeHoursOf(res?.data));
          } catch {
            // Without a schedule the weekend counts as closed, which is the
            // safe default; the API validates the date regardless.
            setSchedule(undefined);
          }
        })();
      }
    }
  }, [open, request]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request) return;

    // The request's preferred date is pre-filled and may itself be in the
    // past by the time staff get to it, so this is checked on submit too.
    const issue = bookingDateIssue(date, schedule);
    if (issue) {
      const message = t(issue.key, issue.vars ?? {});
      setDateError(message);
      toast.error(message);
      return;
    }

    setIsSubmitting(true);
    try {
      await createAppointment(request.id, date, time || undefined, notes || undefined);
      toast.success(t("Appointment scheduled successfully"));
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || t("Failed to schedule appointment"));
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
              <DialogTitle>{t("Schedule Appointment")}</DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                {t("For {customer} ({service})", {
                  customer: request.user?.username ?? "",
                  service: request.service?.name ?? "",
                })}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-xs font-semibold uppercase text-muted-foreground">{t("Date")}</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="date"
                  type="date"
                  required
                  value={date}
                  aria-invalid={Boolean(dateError)}
                  onChange={(e) => {
                    const value = e.target.value;
                    setDate(value);
                    const next = value
                      ? bookingDateIssue(value, schedule)
                      : null;
                    setDateError(next ? t(next.key, next.vars ?? {}) : "");
                  }}
                  className="pl-9 rounded-xl"
                  min={todayAsInputValue()}
                />
              </div>
              {dateError ? (
                <p role="alert" className="text-xs font-medium text-destructive">
                  {dateError}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="time" className="text-xs font-semibold uppercase text-muted-foreground">{t("Time")}</Label>
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
            <Label htmlFor="notes" className="text-xs font-semibold uppercase text-muted-foreground">{t("Notes for customer (Optional)")}</Label>
            <Textarea
              id="notes"
              placeholder={t("e.g. Please bring original ID documents...")}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none rounded-xl"
              rows={3}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
              {t("Skip")}
            </Button>
            <Button type="submit" disabled={isSubmitting || !date} className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white">
              {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              {t("Schedule")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
