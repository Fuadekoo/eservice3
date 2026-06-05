"use client";

import { useCallback, useEffect, useState } from "react";
import { Clock, Save, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { useSession } from "@/hooks/use-session";
import { axiosInstance } from "@/lib/axios";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const DAYS = [
  { index: 0, label: "Sunday", short: "Sun" },
  { index: 1, label: "Monday", short: "Mon" },
  { index: 2, label: "Tuesday", short: "Tue" },
  { index: 3, label: "Wednesday", short: "Wed" },
  { index: 4, label: "Thursday", short: "Thu" },
  { index: 5, label: "Friday", short: "Fri" },
  { index: 6, label: "Saturday", short: "Sat" },
];

type DaySchedule = {
  enabled: boolean;
  start: string;
  end: string;
};

type WeeklySchedule = Record<string, DaySchedule>;

const DEFAULT_SCHEDULE: WeeklySchedule = {
  "0": { enabled: false, start: "09:00", end: "17:00" },
  "1": { enabled: true, start: "09:00", end: "17:00" },
  "2": { enabled: true, start: "09:00", end: "17:00" },
  "3": { enabled: true, start: "09:00", end: "17:00" },
  "4": { enabled: true, start: "09:00", end: "17:00" },
  "5": { enabled: true, start: "09:00", end: "17:00" },
  "6": { enabled: false, start: "09:00", end: "17:00" },
};

export default function AvailabilityPage() {
  const { data: sessionData, isPending: isSessionPending } = useSession();
  const officeId = sessionData?.session?.officeId;

  const [schedule, setSchedule] = useState<WeeklySchedule>(DEFAULT_SCHEDULE);
  const [slotDuration, setSlotDuration] = useState(30);
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [originalSettings, setOriginalSettings] = useState<Record<string, unknown>>({});

  const fetchOffice = useCallback(async (id: string) => {
    setIsFetching(true);
    try {
      const res = (await axiosInstance.get(`/offices/${id}`)) as unknown as {
        data: { settings: Record<string, unknown> };
      };
      const settings = res.data?.settings ?? {};
      setOriginalSettings(settings);

      const saved = settings.weeklySchedule as WeeklySchedule | undefined;
      if (saved && typeof saved === "object") {
        setSchedule({ ...DEFAULT_SCHEDULE, ...saved });
      }
      if (typeof settings.slotDuration === "number") {
        setSlotDuration(settings.slotDuration);
      }
    } catch {
      toast.error("Failed to load availability settings");
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    if (!isSessionPending && officeId) fetchOffice(officeId);
  }, [isSessionPending, officeId, fetchOffice]);

  const updateDay = (dayIndex: string, field: keyof DaySchedule, value: boolean | string) => {
    setSchedule((prev) => ({
      ...prev,
      [dayIndex]: { ...prev[dayIndex], [field]: value },
    }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!officeId) return;
    setIsSaving(true);
    try {
      await axiosInstance.put(`/offices/${officeId}`, {
        settings: {
          ...originalSettings,
          weeklySchedule: schedule,
          slotDuration,
        },
      });
      toast.success("Availability schedule saved");
      setIsDirty(false);
      fetchOffice(officeId);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save availability");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (officeId) fetchOffice(officeId);
    setIsDirty(false);
  };

  const enabledDaysCount = DAYS.filter((d) => schedule[String(d.index)]?.enabled).length;

  if (isFetching || isSessionPending) {
    return (
      <div className="flex items-center justify-center h-72">
        <Loader2 className="size-7 animate-spin text-primary" />
      </div>
    );
  }

  if (!officeId) {
    return (
      <div className="flex items-center justify-center h-72 text-muted-foreground text-sm">
        No office assigned to your account.
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 lg:p-8 max-w-3xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Availability Schedule"
          description="Set your office working hours and slot duration"
          icon={Clock}
        />
        <div className="flex items-center gap-2 shrink-0">
          {isDirty && (
            <Button variant="ghost" onClick={handleReset} className="h-10 rounded-xl">
              <RefreshCw className="mr-2 size-4" />
              Reset
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            className="h-10 rounded-xl font-bold shadow-sm"
          >
            {isSaving ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Save className="mr-2 size-4" />
            )}
            Save Schedule
          </Button>
        </div>
      </div>

      {/* Summary badge */}
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-semibold px-3 py-1">
          <Clock className="size-3.5 mr-1.5" />
          {enabledDaysCount} working days/week
        </Badge>
        <Badge variant="outline" className="bg-muted text-muted-foreground font-medium px-3 py-1">
          {slotDuration} min slots
        </Badge>
      </div>

      {/* Weekly Schedule */}
      <Card className="border-none shadow-sm ring-1 ring-border/50">
        <CardHeader className="pb-0">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Clock className="size-4 text-primary" />
            Weekly Schedule
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Toggle each day and set working hours. Disabled days are marked as closed.
          </p>
        </CardHeader>
        <CardContent className="mt-4">
          <div className="space-y-0 divide-y divide-border/50">
            {DAYS.map((day) => {
              const key = String(day.index);
              const dayData = schedule[key] ?? DEFAULT_SCHEDULE[key];

              return (
                <div
                  key={key}
                  className={cn(
                    "flex flex-col sm:flex-row sm:items-center gap-3 py-4 transition-colors",
                    !dayData.enabled && "opacity-50"
                  )}
                >
                  {/* Day toggle */}
                  <div className="flex items-center gap-3 sm:w-36 shrink-0">
                    <button
                      type="button"
                      onClick={() => updateDay(key, "enabled", !dayData.enabled)}
                      className={cn(
                        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
                        dayData.enabled ? "bg-primary" : "bg-muted-foreground/30"
                      )}
                    >
                      <span
                        className={cn(
                          "pointer-events-none inline-block size-4 rounded-full bg-white shadow transform transition-transform duration-200",
                          dayData.enabled ? "translate-x-4" : "translate-x-0"
                        )}
                      />
                    </button>
                    <span className="font-semibold text-sm w-20">{day.label}</span>
                  </div>

                  {/* Time inputs */}
                  {dayData.enabled ? (
                    <div className="flex items-center gap-2 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-8 text-right">From</span>
                        <Input
                          type="time"
                          value={dayData.start}
                          onChange={(e) => updateDay(key, "start", e.target.value)}
                          className="rounded-xl h-9 w-32 text-sm"
                        />
                      </div>
                      <span className="text-muted-foreground">—</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-5">To</span>
                        <Input
                          type="time"
                          value={dayData.end}
                          onChange={(e) => updateDay(key, "end", e.target.value)}
                          className="rounded-xl h-9 w-32 text-sm"
                        />
                      </div>
                      <span className="text-xs text-muted-foreground ml-1">
                        ({computeHours(dayData.start, dayData.end)} hrs)
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
                      Closed
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Slot Duration */}
      <Card className="border-none shadow-sm ring-1 ring-border/50">
        <CardHeader className="pb-0">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Clock className="size-4 text-primary" />
            Appointment Slot Duration
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            How long each appointment slot should last.
          </p>
        </CardHeader>
        <CardContent className="mt-4">
          <Separator className="mb-4" />
          <div className="flex flex-wrap gap-2">
            {[15, 20, 30, 45, 60, 90].map((min) => (
              <button
                key={min}
                type="button"
                onClick={() => {
                  setSlotDuration(min);
                  setIsDirty(true);
                }}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-bold border transition-all",
                  slotDuration === min
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-background border-border hover:border-primary/50 text-foreground"
                )}
              >
                {min} min
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Currently: <span className="font-bold text-foreground">{slotDuration} minutes</span> per appointment slot.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function computeHours(start: string, end: string): string {
  try {
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    const totalMins = eh * 60 + em - (sh * 60 + sm);
    if (totalMins <= 0) return "0";
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return m === 0 ? String(h) : `${h}.${m}`;
  } catch {
    return "?";
  }
}
