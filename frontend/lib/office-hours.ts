/**
 * When an office will take a booking.
 *
 * Shared by every date picker in the app — applying for a service, rescheduling
 * an appointment, and staff scheduling one — so all three agree on what a
 * bookable day is. Two rules apply:
 *
 *  1. The day must not already be past.
 *  2. The office must be open that weekday, per its own weekly schedule.
 *
 * These are helpers, not enforcement. `<input type="date">` cannot grey out
 * individual weekdays, so a closed day has to be refused on selection and again
 * on submit; the API validates independently.
 */

/** One day in an office's weekly schedule, keyed by `getDay()` (0 = Sunday). */
export type DaySchedule = { enabled: boolean; start: string; end: string };

export type WeeklySchedule = Record<string, DaySchedule>;

/**
 * Today as `YYYY-MM-DD` in the viewer's own timezone.
 *
 * `toISOString()` alone yields the UTC day, which is the previous date for
 * anyone east of UTC during their morning — that would let them pick a date
 * that is already past locally.
 */
export function todayAsInputValue(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().split("T")[0] as string;
}

/**
 * Parse a `YYYY-MM-DD` input value as a local date.
 *
 * `new Date("2026-08-29")` is read as UTC midnight, which falls on the previous
 * day west of UTC — and so reports the wrong weekday.
 */
export function parseInputDate(value: string): Date | null {
  const parts = value.split("-");
  if (parts.length !== 3) return null;
  const [year, month, day] = parts.map(Number);
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return null;
  }
  const date = new Date(year as number, (month as number) - 1, day as number);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Whether `value` falls before today. */
export function isPastDate(value: string): boolean {
  return Boolean(value) && value < todayAsInputValue();
}

/**
 * Whether the office takes bookings on `value`'s weekday.
 *
 * Driven by the office's own weekly schedule, so an office that opens on a
 * Saturday still accepts Saturdays. With no schedule to go on, the weekend is
 * treated as closed.
 */
export function isOfficeOpenOn(
  value: string,
  schedule: WeeklySchedule | undefined,
): boolean {
  const date = parseInputDate(value);
  if (!date) return false;
  const weekday = date.getDay();
  const day = schedule?.[String(weekday)];
  if (day) return day.enabled;
  return weekday !== 0 && weekday !== 6;
}

/** Long weekday name for `value`, e.g. "Saturday". */
export function weekdayNameOf(value: string): string {
  const date = parseInputDate(value);
  return date ? date.toLocaleDateString("en-US", { weekday: "long" }) : "";
}

/**
 * Why `value` cannot be booked, as a translation key plus its variables, or
 * null when the date is fine.
 *
 * Returning the key rather than a finished string keeps this file free of any
 * dependency on the translation store, so it can be unit-checked directly.
 */
export function bookingDateIssue(
  value: string,
  schedule: WeeklySchedule | undefined,
): { key: string; vars?: Record<string, string> } | null {
  if (!value) return { key: "Please select a date." };
  if (!parseInputDate(value)) return { key: "Please select a date." };
  if (isPastDate(value)) return { key: "The date cannot be in the past." };
  if (!isOfficeOpenOn(value, schedule)) {
    return {
      key: "The office is closed on {day}. Please choose another day.",
      vars: { day: weekdayNameOf(value) },
    };
  }
  return null;
}

/**
 * Pull the weekly schedule off an office, whichever shape it arrived in.
 *
 * `settings.weeklySchedule` is the current form; `availability.defaultSchedule`
 * is the older one, which spells the flag `available` rather than `enabled`.
 */
export function weeklyScheduleOf(
  office:
    | {
        settings?: { weeklySchedule?: WeeklySchedule } | null;
        availability?: {
          defaultSchedule?: Record<
            string,
            { start: string; end: string; available?: boolean }
          >;
        } | null;
      }
    | null
    | undefined,
): WeeklySchedule | undefined {
  if (!office) return undefined;

  const fromSettings = office.settings?.weeklySchedule;
  if (fromSettings) return fromSettings;

  const legacy = office.availability?.defaultSchedule;
  if (!legacy) return undefined;

  return Object.fromEntries(
    Object.entries(legacy).map(([day, value]) => [
      day,
      { enabled: value.available ?? true, start: value.start, end: value.end },
    ]),
  );
}
