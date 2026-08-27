/**
 * When an office will take a booking.
 *
 * Mirrors frontend/lib/office-hours.ts — keep the two in step. The pickers use
 * these rules to disable days; this file is what actually enforces them, since
 * a direct API call never goes near the UI.
 */

/** One day in an office's weekly schedule, keyed by `getDay()` (0 = Sunday). */
export type DaySchedule = { enabled: boolean; start: string; end: string };

export type WeeklySchedule = Record<string, DaySchedule>;

/** A holiday or shutdown covering a span of days, ends included. */
export type ClosedRange = { start: string; end: string; reason?: string };

/** A single date that departs from the weekly pattern, either way. */
export type DateOverride = { start?: string; end?: string; available?: boolean };

/** Everything that decides whether an office is open on a given date. */
export type OfficeHours = {
  weeklySchedule?: WeeklySchedule;
  closedDates?: string[];
  closedRanges?: ClosedRange[];
  dateOverrides?: Record<string, DateOverride>;
};

/** Why an office is not taking bookings on a date. */
export type Closure =
  | { kind: "weekday"; weekday: string }
  | { kind: "date"; reason?: string };

/**
 * The calendar day of an instant, as `YYYY-MM-DD`.
 *
 * Read in UTC on purpose: the client sends midnight UTC for the day the user
 * picked, so reading it back in UTC returns that same day. Using the server's
 * local timezone would shift the date whenever the two differ.
 */
export function toDateKey(date: Date): string {
  return date.toISOString().split("T")[0] as string;
}

/** Long weekday name for a date key, e.g. "Saturday". */
export function weekdayNameOf(dateKey: string): string {
  const parts = dateKey.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isInteger(n))) return "";
  const date = new Date(
    Date.UTC(parts[0] as number, (parts[1] as number) - 1, parts[2] as number),
  );
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: "UTC",
  });
}

/**
 * Why the office is closed on `dateKey`, or null when it is open.
 *
 * Checked most-specific first, so a deliberate exception always beats the
 * general pattern: a per-date override, then an individually listed closed
 * date, then a closed range, then the weekly schedule. With no configuration
 * at all the weekend is treated as closed.
 */
export function officeClosureOn(
  dateKey: string,
  hours: OfficeHours | undefined,
): Closure | null {
  const parts = dateKey.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isInteger(n))) {
    return { kind: "date" };
  }

  const override = hours?.dateOverrides?.[dateKey];
  if (override && override.available !== undefined) {
    return override.available ? null : { kind: "date" };
  }

  if (hours?.closedDates?.includes(dateKey)) {
    return { kind: "date" };
  }

  const range = hours?.closedRanges?.find(
    (entry) => entry.start <= dateKey && dateKey <= entry.end,
  );
  if (range) {
    return range.reason
      ? { kind: "date", reason: range.reason }
      : { kind: "date" };
  }

  const weekday = new Date(
    Date.UTC(parts[0] as number, (parts[1] as number) - 1, parts[2] as number),
  ).getUTCDay();

  const scheduled = hours?.weeklySchedule?.[String(weekday)];
  if (scheduled) {
    return scheduled.enabled
      ? null
      : { kind: "weekday", weekday: weekdayNameOf(dateKey) };
  }

  return weekday === 0 || weekday === 6
    ? { kind: "weekday", weekday: weekdayNameOf(dateKey) }
    : null;
}

/** A sentence explaining a closure, ready to return to the client. */
export function closureMessage(closure: Closure): string {
  if (closure.kind === "weekday") {
    return `The office is closed on ${closure.weekday}. Please choose another day.`;
  }
  return closure.reason
    ? `The office is closed on this date (${closure.reason}). Please choose another day.`
    : "The office is closed on this date. Please choose another day.";
}

/** The rows these helpers can read hours out of. */
type OfficeRecord = {
  settings?: unknown;
  availability?: {
    defaultSchedule?: unknown;
    unavailableDates?: unknown;
    unavailableDateRanges?: unknown;
    dateOverrides?: unknown;
  } | null;
} | null;

const asRecord = (value: unknown): Record<string, any> | undefined =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, any>)
    : undefined;

const asArray = (value: unknown): any[] | undefined =>
  Array.isArray(value) ? value : undefined;

/**
 * Pull an office's hours together from its JSON columns.
 *
 * Everything here arrives as untyped `Json`, so each piece is shape-checked
 * rather than trusted — a malformed column should mean "no rule", not a crash
 * in the middle of a booking.
 */
export function officeHoursOf(office: OfficeRecord): OfficeHours | undefined {
  if (!office) return undefined;

  const settings = asRecord(office.settings);
  const availability = office.availability ?? undefined;

  const fromSettings = asRecord(settings?.["weeklySchedule"]);
  const legacy = asRecord(availability?.defaultSchedule);

  let weeklySchedule: WeeklySchedule | undefined = fromSettings as
    | WeeklySchedule
    | undefined;

  if (!weeklySchedule && legacy) {
    weeklySchedule = Object.fromEntries(
      Object.entries(legacy).map(([day, value]) => {
        const entry = asRecord(value) ?? {};
        return [
          day,
          {
            enabled: entry["available"] ?? true,
            start: entry["start"] ?? "",
            end: entry["end"] ?? "",
          },
        ];
      }),
    );
  }

  const closedDates = (
    asArray(availability?.unavailableDates) ??
    asArray(settings?.["unavailableDates"])
  )?.filter((entry): entry is string => typeof entry === "string");

  const closedRanges = (
    asArray(availability?.unavailableDateRanges) ??
    asArray(settings?.["unavailableDateRanges"])
  )?.filter(
    (entry): entry is ClosedRange =>
      Boolean(asRecord(entry)) &&
      typeof entry.start === "string" &&
      typeof entry.end === "string",
  );

  const dateOverrides =
    asRecord(availability?.dateOverrides) ??
    asRecord(settings?.["dateOverrides"]);

  if (!weeklySchedule && !closedDates && !closedRanges && !dateOverrides) {
    return undefined;
  }

  return {
    ...(weeklySchedule ? { weeklySchedule } : {}),
    ...(closedDates ? { closedDates } : {}),
    ...(closedRanges ? { closedRanges } : {}),
    ...(dateOverrides ? { dateOverrides: dateOverrides as OfficeHours["dateOverrides"] } : {}),
  };
}
