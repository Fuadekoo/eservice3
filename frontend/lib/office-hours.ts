/**
 * When an office will take a booking.
 *
 * Shared by every date picker in the app — applying for a service, rescheduling
 * an appointment, and staff scheduling one — so all three agree on what a
 * bookable day is. A day is bookable when it is not already past and the office
 * is open on it, which is decided by the office's own configuration rather than
 * by any hardcoded idea of a weekend.
 *
 * These are helpers, not enforcement. `<input type="date">` cannot grey out
 * individual days, so a closed day has to be refused on selection and again on
 * submit; the API applies the same rules independently.
 *
 * Mirrored by backend/src/utils/office-hours.ts — keep the two in step.
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
  /** Individual closed dates, `YYYY-MM-DD`. */
  closedDates?: string[];
  /** Closed spans, e.g. a holiday week. */
  closedRanges?: ClosedRange[];
  /** Per-date exceptions, keyed `YYYY-MM-DD`. Wins over everything else. */
  dateOverrides?: Record<string, DateOverride>;
};

/** Why an office is not taking bookings on a date. */
export type Closure =
  | { kind: "weekday"; weekday: string }
  | { kind: "date"; reason?: string };

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

/** Long weekday name for `value`, e.g. "Saturday". */
export function weekdayNameOf(value: string): string {
  const date = parseInputDate(value);
  return date ? date.toLocaleDateString("en-US", { weekday: "long" }) : "";
}

/**
 * Why the office is closed on `value`, or null when it is open.
 *
 * Checked most-specific first, so a deliberate exception always beats the
 * general pattern:
 *
 *   1. A per-date override — this is what lets an office open on a Saturday
 *      for one weekend, or shut on an ordinary Tuesday.
 *   2. An individually listed closed date.
 *   3. A closed range, e.g. a holiday week.
 *   4. The weekly schedule.
 *
 * With no configuration at all the weekend is treated as closed, which is the
 * safe default for an office that has not set its hours yet.
 */
export function officeClosureOn(
  value: string,
  hours: OfficeHours | undefined,
): Closure | null {
  const date = parseInputDate(value);
  if (!date) return { kind: "date" };

  const override = hours?.dateOverrides?.[value];
  if (override && override.available !== undefined) {
    return override.available ? null : { kind: "date" };
  }

  if (hours?.closedDates?.includes(value)) {
    return { kind: "date" };
  }

  const range = hours?.closedRanges?.find(
    (entry) => entry.start <= value && value <= entry.end,
  );
  if (range) {
    return range.reason ? { kind: "date", reason: range.reason } : { kind: "date" };
  }

  const weekday = date.getDay();
  const scheduled = hours?.weeklySchedule?.[String(weekday)];
  if (scheduled) {
    return scheduled.enabled
      ? null
      : { kind: "weekday", weekday: weekdayNameOf(value) };
  }

  return weekday === 0 || weekday === 6
    ? { kind: "weekday", weekday: weekdayNameOf(value) }
    : null;
}

/** Whether the office takes bookings on `value`. */
export function isOfficeOpenOn(
  value: string,
  hours: OfficeHours | undefined,
): boolean {
  return officeClosureOn(value, hours) === null;
}

/**
 * Why `value` cannot be booked, as a translation key plus its variables, or
 * null when the date is fine.
 *
 * Returning the key rather than a finished string keeps this file free of any
 * dependency on the translation store, so it can be checked directly.
 */
export function bookingDateIssue(
  value: string,
  hours: OfficeHours | undefined,
): { key: string; vars?: Record<string, string> } | null {
  if (!value || !parseInputDate(value)) return { key: "Please select a date." };
  if (isPastDate(value)) return { key: "The date cannot be in the past." };

  const closure = officeClosureOn(value, hours);
  if (!closure) return null;

  if (closure.kind === "weekday") {
    return {
      key: "The office is closed on {day}. Please choose another day.",
      vars: { day: closure.weekday },
    };
  }

  return closure.reason
    ? {
        key: "The office is closed on this date ({reason}). Please choose another day.",
        vars: { reason: closure.reason },
      }
    : { key: "The office is closed on this date. Please choose another day." };
}

/** The office shape these helpers can read hours out of. */
type OfficeLike = {
  settings?: {
    weeklySchedule?: WeeklySchedule;
    unavailableDates?: string[];
    unavailableDateRanges?: ClosedRange[];
    dateOverrides?: Record<string, DateOverride>;
  } | null;
  availability?: {
    defaultSchedule?: Record<
      string,
      { start: string; end: string; available?: boolean }
    >;
    unavailableDates?: string[];
    unavailableDateRanges?: ClosedRange[];
    dateOverrides?: Record<string, DateOverride>;
  } | null;
};

/**
 * Pull an office's hours together, whichever shape they arrived in.
 *
 * `settings.weeklySchedule` is the current form; `availability.defaultSchedule`
 * is the older one, which spells the flag `available` rather than `enabled`.
 * Holidays only ever live on `availability`.
 */
export function officeHoursOf(
  office: OfficeLike | null | undefined,
): OfficeHours | undefined {
  if (!office) return undefined;

  const fromSettings = office.settings?.weeklySchedule;
  const legacy = office.availability?.defaultSchedule;

  const weeklySchedule =
    fromSettings ??
    (legacy
      ? Object.fromEntries(
          Object.entries(legacy).map(([day, value]) => [
            day,
            {
              enabled: value.available ?? true,
              start: value.start,
              end: value.end,
            },
          ]),
        )
      : undefined);

  const closedDates =
    office.availability?.unavailableDates ?? office.settings?.unavailableDates;
  const closedRanges =
    office.availability?.unavailableDateRanges ??
    office.settings?.unavailableDateRanges;
  const dateOverrides =
    office.availability?.dateOverrides ?? office.settings?.dateOverrides;

  if (!weeklySchedule && !closedDates && !closedRanges && !dateOverrides) {
    return undefined;
  }

  return {
    ...(weeklySchedule ? { weeklySchedule } : {}),
    ...(closedDates ? { closedDates } : {}),
    ...(closedRanges ? { closedRanges } : {}),
    ...(dateOverrides ? { dateOverrides } : {}),
  };
}

/** @deprecated Use {@link officeHoursOf}; kept so older callers still compile. */
export function weeklyScheduleOf(
  office: OfficeLike | null | undefined,
): WeeklySchedule | undefined {
  return officeHoursOf(office)?.weeklySchedule;
}
