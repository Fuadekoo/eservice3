/**
 * The vocabulary of appointment states, and what each one actually means.
 *
 * `status` is a free-text column that in practice held four values, one of
 * which was "pending". That word also names the staff gate on a request, the
 * manager gate on a request, and the state of a report — so a "Pending" badge
 * on the appointments screen told nobody *who* it was waiting on. Worse, it was
 * the state of a slot the office had already been told about but not yet
 * confirmed, which reads as "nothing has happened" when in fact the customer is
 * waiting for an answer.
 *
 * The stored values are unchanged, so existing rows keep working. What changes
 * is that each one now has a single documented meaning and one label, defined
 * here and used by both the API and the dashboard, instead of each screen
 * inventing its own wording.
 */

export const APPOINTMENT_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "completed",
  "missed",
] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export type AppointmentStatusMeta = {
  /** What to show on a badge. Never the bare stored value. */
  label: string;
  /** One sentence saying what is true, and who is expected to act next. */
  description: string;
  /** Who the appointment is waiting on, or null when it is settled. */
  waitingOn: "office" | "customer" | null;
};

export const APPOINTMENT_STATUS_META: Record<
  AppointmentStatus,
  AppointmentStatusMeta
> = {
  pending: {
    label: "Awaiting confirmation",
    description:
      "The slot has been requested and the office has not confirmed it yet.",
    waitingOn: "office",
  },
  approved: {
    label: "Confirmed",
    description: "The office has confirmed this slot. The customer should attend.",
    waitingOn: "customer",
  },
  rejected: {
    label: "Cancelled",
    description: "This appointment was cancelled and will not go ahead.",
    waitingOn: null,
  },
  completed: {
    label: "Completed",
    description: "The customer attended and the service was carried out.",
    waitingOn: null,
  },
  missed: {
    label: "Missed",
    description:
      "The customer did not attend. It can be rescheduled to a new slot.",
    waitingOn: "office",
  },
};

export function isAppointmentStatus(value: unknown): value is AppointmentStatus {
  return (
    typeof value === "string" &&
    (APPOINTMENT_STATUSES as readonly string[]).includes(value)
  );
}

/**
 * States from which an appointment may still be moved to a new slot.
 *
 * `completed` is the only one that cannot: the visit has happened, and a record
 * of what happened must not be edited into a record of something else. Every
 * other state — including `approved`, which used to be refused outright — is
 * reschedulable, because "the customer missed their confirmed slot" is the
 * single most common reason anyone needs to move one.
 */
const RESCHEDULABLE: AppointmentStatus[] = [
  "pending",
  "approved",
  "rejected",
  "missed",
];

export function canReschedule(status: string): boolean {
  return isAppointmentStatus(status) && RESCHEDULABLE.includes(status);
}

/**
 * What the status becomes after the slot is moved.
 *
 * An office member moving a slot is confirming the new one — they are the
 * people who would otherwise have to confirm it, so making them do it twice is
 * pure friction. A customer moving their own slot puts it back in the queue for
 * the office to confirm, which is what `pending` means.
 */
export function statusAfterReschedule(
  current: string,
  movedByOffice: boolean,
): AppointmentStatus {
  if (current === "completed") return "completed";
  return movedByOffice ? "approved" : "pending";
}
