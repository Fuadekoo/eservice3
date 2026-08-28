"use client";

import * as React from "react";
import { CalendarRange, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** A date as `<input type="date">` wants it, in the viewer's own timezone. */
function toInputValue(date: Date): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

/** Midnight local time on the given day. */
function startOfDay(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year!, month! - 1, day!, 0, 0, 0, 0);
}

/** The last instant of the given day, so the range includes it. */
function endOfDay(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year!, month! - 1, day!, 23, 59, 59, 999);
}

type Preset = { label: string; range: () => { from: Date; to: Date } };

const PRESETS: Preset[] = [
  {
    label: "Last 7 days",
    range: () => {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 6);
      return { from, to };
    },
  },
  {
    label: "Last 30 days",
    range: () => {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 29);
      return { from, to };
    },
  },
  {
    label: "This month",
    range: () => {
      const now = new Date();
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now };
    },
  },
  {
    label: "Last month",
    range: () => {
      const now = new Date();
      return {
        from: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        to: new Date(now.getFullYear(), now.getMonth(), 0),
      };
    },
  },
  {
    label: "This year",
    range: () => {
      const now = new Date();
      return { from: new Date(now.getFullYear(), 0, 1), to: now };
    },
  },
];

export type ReportRange = { from: Date; to: Date };

type ReportRangeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Shown under the title, e.g. the office the report will cover. */
  description?: string;
  /**
   * Build and download the report. Rejecting leaves the dialog open with the
   * chosen range intact, so the viewer can retry without re-entering it.
   */
  onGenerate: (range: ReportRange) => Promise<void>;
};

/**
 * Pick a reporting period, then download it as a PDF.
 *
 * Native date inputs rather than a calendar popover, matching how dates are
 * chosen everywhere else in the dashboard — they carry the platform's own
 * locale, keyboard handling and mobile picker for free.
 */
export function ReportRangeDialog({
  open,
  onOpenChange,
  description,
  onGenerate,
}: ReportRangeDialogProps) {
  const { t } = useTranslation();

  const defaults = React.useMemo(() => PRESETS[1]!.range(), []);
  const [from, setFrom] = React.useState(() => toInputValue(defaults.from));
  const [to, setTo] = React.useState(() => toInputValue(defaults.to));
  const [activePreset, setActivePreset] = React.useState<string | null>("Last 30 days");
  const [isGenerating, setIsGenerating] = React.useState(false);

  const today = toInputValue(new Date());

  // A period cannot end before it starts, and there is nothing to report on a
  // day that has not happened yet.
  const error = React.useMemo(() => {
    if (!from || !to) return t("Choose both a start and an end date.");
    if (from > to) return t("The start date must come before the end date.");
    if (from > today) return t("The start date cannot be in the future.");
    return null;
  }, [from, to, today, t]);

  const applyPreset = (preset: Preset) => {
    const range = preset.range();
    setFrom(toInputValue(range.from));
    setTo(toInputValue(range.to));
    setActivePreset(preset.label);
  };

  const handleGenerate = async () => {
    if (error) return;
    setIsGenerating(true);
    try {
      await onGenerate({ from: startOfDay(from), to: endOfDay(to) });
      onOpenChange(false);
    } catch (cause) {
      toast.error(
        cause instanceof Error && cause.message
          ? cause.message
          : t("Could not generate the report. Please try again."),
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={isGenerating ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CalendarRange className="size-4" />
            </span>
            {t("Generate Report")}
          </DialogTitle>
          <DialogDescription>
            {description ?? t("Choose a period. The report downloads as a PDF.")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("Quick ranges")}
            </Label>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  type="button"
                  variant={activePreset === preset.label ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "h-8 rounded-full px-3 text-xs font-semibold",
                    activePreset !== preset.label && "border-border/60",
                  )}
                  onClick={() => applyPreset(preset)}
                >
                  {t(preset.label)}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="report-from">{t("From")}</Label>
              <Input
                id="report-from"
                type="date"
                value={from}
                max={to || today}
                className="h-11 rounded-xl"
                onChange={(event) => {
                  setFrom(event.target.value);
                  setActivePreset(null);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-to">{t("To")}</Label>
              <Input
                id="report-to"
                type="date"
                value={to}
                min={from}
                className="h-11 rounded-xl"
                onChange={(event) => {
                  setTo(event.target.value);
                  setActivePreset(null);
                }}
              />
            </div>
          </div>

          {error && <p className="text-sm font-medium text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            disabled={isGenerating}
            onClick={() => onOpenChange(false)}
          >
            {t("Cancel")}
          </Button>
          <Button
            type="button"
            className="rounded-xl font-bold"
            disabled={Boolean(error) || isGenerating}
            onClick={handleGenerate}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                {t("Preparing…")}
              </>
            ) : (
              <>
                <Download className="mr-2 size-4" />
                {t("Download PDF")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
