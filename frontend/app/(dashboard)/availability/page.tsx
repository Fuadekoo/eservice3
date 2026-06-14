"use client";

import * as React from "react";
import {
  AlertCircle,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  RotateCcw,
  Save,
  Timer,
} from "lucide-react";
import { toast } from "sonner";

import { PageLayout } from "@/components/dashboard/page-layout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSession } from "@/hooks/use-session";
import { axiosInstance } from "@/lib/axios";
import { useTranslation } from "@/lib/i18n";
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

const SLOT_OPTIONS = [15, 20, 30, 45, 60, 90];

type DaySchedule = {
  enabled: boolean;
  start: string;
  end: string;
};

type LegacyDaySchedule = {
  enabled?: boolean;
  available?: boolean;
  start?: string;
  end?: string;
};

type WeeklySchedule = Record<string, DaySchedule>;

type OfficeResponse = {
  settings?: Record<string, unknown> | null;
  availability?: {
    defaultSchedule?: Record<string, LegacyDaySchedule> | null;
    slotDuration?: number | null;
  } | null;
};

type AvailabilityState = {
  schedule: WeeklySchedule;
  slotDuration: number;
};

type DayErrorMap = Record<string, string | undefined>;

const DEFAULT_SCHEDULE: WeeklySchedule = {
  "0": { enabled: false, start: "09:00", end: "17:00" },
  "1": { enabled: true, start: "09:00", end: "17:00" },
  "2": { enabled: true, start: "09:00", end: "17:00" },
  "3": { enabled: true, start: "09:00", end: "17:00" },
  "4": { enabled: true, start: "09:00", end: "17:00" },
  "5": { enabled: true, start: "09:00", end: "17:00" },
  "6": { enabled: false, start: "09:00", end: "17:00" },
};

const DEFAULT_STATE: AvailabilityState = {
  schedule: DEFAULT_SCHEDULE,
  slotDuration: 30,
};

function normalizeSchedule(
  schedule?: Record<string, LegacyDaySchedule> | null,
): WeeklySchedule {
  const next: WeeklySchedule = { ...DEFAULT_SCHEDULE };

  for (const day of DAYS) {
    const key = String(day.index);
    const saved = schedule?.[key];
    if (!saved) continue;

    next[key] = {
      enabled: Boolean(saved.enabled ?? saved.available ?? false),
      start: saved.start || DEFAULT_SCHEDULE[key].start,
      end: saved.end || DEFAULT_SCHEDULE[key].end,
    };
  }

  return next;
}

function minutesFromTime(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 0;
  return hours * 60 + minutes;
}

function computeMinutes(start: string, end: string) {
  return Math.max(0, minutesFromTime(end) - minutesFromTime(start));
}

function formatDuration(minutes: number) {
  if (minutes <= 0) return "0h";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (!hours) return `${mins}m`;
  if (!mins) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

function areStatesEqual(a: AvailabilityState, b: AvailabilityState) {
  if (a.slotDuration !== b.slotDuration) return false;
  return DAYS.every((day) => {
    const key = String(day.index);
    const left = a.schedule[key];
    const right = b.schedule[key];
    return (
      left.enabled === right.enabled &&
      left.start === right.start &&
      left.end === right.end
    );
  });
}

function buildStateFromOffice(data: OfficeResponse): AvailabilityState {
  const settings = data.settings ?? {};
  const settingsSchedule = settings.weeklySchedule as
    | Record<string, LegacyDaySchedule>
    | undefined;
  const relationSchedule = data.availability?.defaultSchedule ?? undefined;

  const schedule = normalizeSchedule(settingsSchedule ?? relationSchedule);
  const settingsSlotDuration = settings.slotDuration;
  const slotDuration =
    typeof settingsSlotDuration === "number"
      ? settingsSlotDuration
      : (data.availability?.slotDuration ?? DEFAULT_STATE.slotDuration);

  return { schedule, slotDuration };
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }
  return undefined;
}

async function getOfficeAvailability(officeId: string) {
  const res = (await axiosInstance.get(`/offices/${officeId}`)) as unknown as {
    data: OfficeResponse;
  };
  return res.data;
}

export default function AvailabilityPage() {
  const { t } = useTranslation();
  const { data: sessionData, isPending: isSessionPending } = useSession();
  const session = sessionData?.session;
  const officeId =
    session?.officeId || session?.user?.officeId || session?.office?.id;

  const [availability, setAvailability] =
    React.useState<AvailabilityState>(DEFAULT_STATE);
  const [originalAvailability, setOriginalAvailability] =
    React.useState<AvailabilityState>(DEFAULT_STATE);
  const [originalSettings, setOriginalSettings] = React.useState<
    Record<string, unknown>
  >({});
  const [dayErrors, setDayErrors] = React.useState<DayErrorMap>({});
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [isFetching, setIsFetching] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [hasLoaded, setHasLoaded] = React.useState(false);

  const isDirty = !areStatesEqual(availability, originalAvailability);
  const enabledDays = DAYS.filter(
    (day) => availability.schedule[String(day.index)]?.enabled,
  );
  const weeklyMinutes = enabledDays.reduce((total, day) => {
    const value = availability.schedule[String(day.index)];
    return total + computeMinutes(value.start, value.end);
  }, 0);
  const averageMinutes = enabledDays.length
    ? Math.round(weeklyMinutes / enabledDays.length)
    : 0;
  const firstOpenDay = enabledDays[0];

  const loadAvailability = React.useCallback(
    async (id: string, showSpinner = true) => {
      if (showSpinner) setIsFetching(true);
      setLoadError(null);
      try {
        const office = await getOfficeAvailability(id);
        const nextState = buildStateFromOffice(office);
        setAvailability(nextState);
        setOriginalAvailability(nextState);
        setOriginalSettings(office.settings ?? {});
        setDayErrors({});
        setHasLoaded(true);
      } catch (error: unknown) {
        const message =
          getErrorMessage(error) ?? t("Failed to load availability settings");
        setLoadError(message);
        toast.error(message);
      } finally {
        if (showSpinner) setIsFetching(false);
      }
    },
    [t],
  );

  React.useEffect(() => {
    if (isSessionPending || !officeId) return;

    let isCancelled = false;
    const targetOfficeId = officeId;

    async function loadInitial() {
      try {
        const office = await getOfficeAvailability(targetOfficeId);
        if (isCancelled) return;
        const nextState = buildStateFromOffice(office);
        setAvailability(nextState);
        setOriginalAvailability(nextState);
        setOriginalSettings(office.settings ?? {});
        setDayErrors({});
        setHasLoaded(true);
      } catch (error: unknown) {
        if (!isCancelled) {
          const message =
            getErrorMessage(error) ?? t("Failed to load availability settings");
          setLoadError(message);
          setHasLoaded(true);
          toast.error(message);
        }
      }
    }

    void loadInitial();

    return () => {
      isCancelled = true;
    };
  }, [isSessionPending, officeId, t]);

  function updateDay(
    dayIndex: string,
    field: keyof DaySchedule,
    value: boolean | string,
  ) {
    setAvailability((prev) => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [dayIndex]: { ...prev.schedule[dayIndex], [field]: value },
      },
    }));
    setDayErrors((prev) => ({ ...prev, [dayIndex]: undefined }));
  }

  function updateSlotDuration(value: number) {
    setAvailability((prev) => ({ ...prev, slotDuration: value }));
  }

  function setBusinessWeek() {
    setAvailability((prev) => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        "0": { ...prev.schedule["0"], enabled: false },
        "1": { enabled: true, start: "09:00", end: "17:00" },
        "2": { enabled: true, start: "09:00", end: "17:00" },
        "3": { enabled: true, start: "09:00", end: "17:00" },
        "4": { enabled: true, start: "09:00", end: "17:00" },
        "5": { enabled: true, start: "09:00", end: "17:00" },
        "6": { ...prev.schedule["6"], enabled: false },
      },
    }));
    setDayErrors({});
  }

  function closeAllDays() {
    setAvailability((prev) => ({
      ...prev,
      schedule: Object.fromEntries(
        DAYS.map((day) => {
          const key = String(day.index);
          return [key, { ...prev.schedule[key], enabled: false }];
        }),
      ) as WeeklySchedule,
    }));
    setDayErrors({});
  }

  function validateSchedule() {
    const nextErrors: DayErrorMap = {};

    for (const day of DAYS) {
      const key = String(day.index);
      const value = availability.schedule[key];
      if (!value.enabled) continue;

      if (computeMinutes(value.start, value.end) <= 0) {
        nextErrors[key] = t("End time must be after start time");
      }
    }

    setDayErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSave() {
    if (!officeId) return;
    if (!validateSchedule()) {
      toast.error(t("Please fix the highlighted schedule rows"));
      return;
    }

    setIsSaving(true);
    try {
      await axiosInstance.put(`/offices/${officeId}`, {
        settings: {
          ...originalSettings,
          weeklySchedule: availability.schedule,
          slotDuration: availability.slotDuration,
        },
      });
      toast.success(t("Availability schedule saved"));
      await loadAvailability(officeId, false);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) ?? t("Failed to save availability"));
    } finally {
      setIsSaving(false);
    }
  }

  function handleReset() {
    setAvailability(originalAvailability);
    setDayErrors({});
  }

  if (isSessionPending || (officeId && !hasLoaded)) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!officeId) {
    return (
      <PageLayout
        title={t("Availability Schedule")}
        description={t("Set office working hours and appointment slots.")}
        icon={CalendarClock}
      >
        <Alert className="mx-auto max-w-xl rounded-2xl border-amber-500/20 bg-amber-500/5 p-5">
          <AlertCircle className="size-5 text-amber-600" />
          <AlertTitle>{t("No office assigned")}</AlertTitle>
          <AlertDescription>
            {t("Your account is not assigned to an office yet.")}
          </AlertDescription>
        </Alert>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={t("Availability Schedule")}
      description={t("Set office working hours and appointment slot timing.")}
      icon={CalendarClock}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            className="h-10 rounded-xl"
            disabled={isFetching || isSaving}
            onClick={() => void loadAvailability(officeId)}
          >
            <RefreshCw className={cn("size-4", isFetching && "animate-spin")} />
            {t("Refresh")}
          </Button>
          <Button
            variant="outline"
            className="h-10 rounded-xl"
            disabled={!isDirty || isSaving}
            onClick={handleReset}
          >
            <RotateCcw className="size-4" />
            {t("Reset")}
          </Button>
          <Button
            className="h-10 rounded-xl font-bold shadow-lg shadow-primary/20"
            disabled={!isDirty || isSaving}
            onClick={handleSave}
          >
            {isSaving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {isSaving ? t("Saving...") : t("Save Schedule")}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {loadError && (
          <Alert className="rounded-2xl border-amber-500/20 bg-amber-500/5 p-4">
            <AlertCircle className="size-4 text-amber-600" />
            <AlertTitle>{t("Availability could not be fully loaded")}</AlertTitle>
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-3 md:grid-cols-3">
          <SummaryCard
            icon={BriefcaseBusiness}
            label={t("Working Days")}
            value={String(enabledDays.length)}
            detail={t("open days per week")}
          />
          <SummaryCard
            icon={Clock}
            label={t("Weekly Hours")}
            value={formatDuration(weeklyMinutes)}
            detail={
              firstOpenDay
                ? `${t("Starts")} ${t(firstOpenDay.label)}`
                : t("No open days")
            }
          />
          <SummaryCard
            icon={Timer}
            label={t("Slot Duration")}
            value={`${availability.slotDuration}m`}
            detail={
              averageMinutes
                ? `${formatDuration(averageMinutes)} ${t("avg per open day")}`
                : t("Set working days first")
            }
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <div className="space-y-6">
            <Card className="border-none shadow-sm ring-1 ring-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-black">
                  <Timer className="size-5 text-primary" />
                  {t("Slot Duration")}
                </CardTitle>
                <CardDescription>
                  {t("Choose how long each appointment should last.")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  {SLOT_OPTIONS.map((minutes) => (
                    <button
                      key={minutes}
                      type="button"
                      onClick={() => updateSlotDuration(minutes)}
                      className={cn(
                        "h-12 rounded-xl border text-sm font-black transition-all",
                        availability.slotDuration === minutes
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-border bg-background hover:border-primary/50",
                      )}
                    >
                      {minutes}m
                    </button>
                  ))}
                </div>
                <div className="rounded-xl bg-muted/30 p-4 text-sm">
                  <p className="font-bold">{t("Current setting")}</p>
                  <p className="mt-1 text-muted-foreground">
                    {availability.slotDuration} {t("minutes per appointment")}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm ring-1 ring-border/50">
              <CardHeader>
                <CardTitle className="text-lg font-black">
                  {t("Quick Templates")}
                </CardTitle>
                <CardDescription>
                  {t("Apply common weekly patterns quickly.")}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                <Button
                  variant="outline"
                  className="justify-start rounded-xl"
                  onClick={setBusinessWeek}
                >
                  <CheckCircle2 className="size-4" />
                  {t("Monday to Friday")}
                </Button>
                <Button
                  variant="outline"
                  className="justify-start rounded-xl"
                  onClick={closeAllDays}
                >
                  <AlertCircle className="size-4" />
                  {t("Close all days")}
                </Button>
              </CardContent>
            </Card>

            {isDirty && (
              <Alert className="rounded-2xl border-primary/20 bg-primary/5 p-4">
                <CheckCircle2 className="size-4 text-primary" />
                <AlertTitle>{t("Unsaved schedule")}</AlertTitle>
                <AlertDescription>
                  {t("Save changes before leaving this page.")}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <Card className="border-none shadow-sm ring-1 ring-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-black">
                <CalendarClock className="size-5 text-primary" />
                {t("Weekly Schedule")}
              </CardTitle>
              <CardDescription>
                {t("Turn on each working day and set office hours.")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {DAYS.map((day) => {
                const key = String(day.index);
                const dayData = availability.schedule[key];
                const minutes = computeMinutes(dayData.start, dayData.end);
                const error = dayErrors[key];

                return (
                  <div
                    key={key}
                    className={cn(
                      "rounded-2xl border bg-card p-4 transition-all",
                      dayData.enabled
                        ? "border-border shadow-sm"
                        : "border-border/60 bg-muted/20",
                      error && "border-destructive/50 bg-destructive/5",
                    )}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className={cn(
                            "flex size-12 shrink-0 flex-col items-center justify-center rounded-xl border text-xs font-black",
                            dayData.enabled
                              ? "border-primary/20 bg-primary/10 text-primary"
                              : "border-border bg-background text-muted-foreground",
                          )}
                        >
                          {day.short}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black">{t(day.label)}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {dayData.enabled
                              ? `${formatDuration(minutes)} ${t("available")}`
                              : t("Closed")}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={dayData.enabled}
                            onCheckedChange={(checked) =>
                              updateDay(key, "enabled", checked)
                            }
                          />
                          <span className="text-sm font-semibold text-muted-foreground">
                            {dayData.enabled ? t("Open") : t("Closed")}
                          </span>
                        </div>

                        <div
                          className={cn(
                            "grid grid-cols-2 gap-3",
                            !dayData.enabled && "pointer-events-none opacity-45",
                          )}
                        >
                          <TimeField
                            label={t("Start")}
                            value={dayData.start}
                            onChange={(value) => updateDay(key, "start", value)}
                          />
                          <TimeField
                            label={t("End")}
                            value={dayData.end}
                            onChange={(value) => updateDay(key, "end", value)}
                          />
                        </div>
                      </div>
                    </div>
                    {error && (
                      <p className="mt-3 text-xs font-medium text-destructive">
                        {error}
                      </p>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <div className="sticky bottom-4 z-10 rounded-2xl border border-border/70 bg-background/95 p-3 shadow-lg backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm">
              <p className="font-bold">
                {isDirty ? t("Ready to save schedule") : t("Schedule is saved")}
              </p>
              <p className="text-xs text-muted-foreground">
                {enabledDays.length} {t("open days")} ·{" "}
                {availability.slotDuration} {t("minute slots")}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 rounded-xl sm:flex-none"
                disabled={!isDirty || isSaving}
                onClick={handleReset}
              >
                <RotateCcw className="size-4" />
                {t("Reset")}
              </Button>
              <Button
                className="flex-1 rounded-xl font-bold sm:flex-none"
                disabled={!isDirty || isSaving}
                onClick={handleSave}
              >
                {isSaving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                {isSaving ? t("Saving...") : t("Save Schedule")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <Card className="border-none bg-card/70 shadow-sm ring-1 ring-border/50">
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-black leading-none">{value}</p>
          <p className="mt-1 text-xs font-bold text-muted-foreground">
            {label}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground/80">
            {detail}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function TimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-bold text-muted-foreground">{label}</Label>
      <Input
        type="time"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-xl sm:w-32"
      />
    </div>
  );
}
