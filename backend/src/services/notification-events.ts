import { prisma } from "../lib/db.js";
import { notify, notifyMany } from "./notification.service.js";

/**
 * Domain notifications — the vocabulary of this system's events.
 *
 * Controllers call one function per business event and say nothing about who
 * receives it or how it is worded. Keeping that here means the answer to
 * "who hears about a rejected request?" lives in one file instead of being
 * re-derived, slightly differently, at every call site.
 *
 * Every function is safe to call without awaiting and never throws: a
 * notification failing must not fail the action that caused it.
 */

/** Where each audience goes when they tap the notification. */
const ROUTES = {
  customerRequests: "/requests",
  staffRequests: "/requestManagement",
  appointments: "/appointments",
  reports: "/reportManagement",
} as const;

function formatDate(date: Date | string): string {
  const value = typeof date === "string" ? new Date(date) : date;
  return value.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** User ids of every staff member the service is assigned to. */
async function getAssignedStaffUserIds(serviceId: string): Promise<string[]> {
  const assignments = await prisma.serviceStaffAssignment.findMany({
    where: { serviceId },
    select: { staff: { select: { userId: true } } },
  });
  return assignments.map((assignment) => assignment.staff.userId);
}

/** User ids of every manager attached to an office. */
async function getOfficeManagerUserIds(
  officeId: string | null | undefined,
): Promise<string[]> {
  if (!officeId) return [];

  const managers = await prisma.staff.findMany({
    where: {
      officeId,
      user: { role: { name: { in: ["manager", "MANAGER", "Manager"] } } },
    },
    select: { userId: true },
  });
  return managers.map((manager) => manager.userId);
}

/** The user behind a staff record, for addressing an approver directly. */
async function getStaffUserId(
  staffId: string | null | undefined,
): Promise<string | null> {
  if (!staffId) return null;

  const staff = await prisma.staff.findUnique({
    where: { id: staffId },
    select: { userId: true },
  });
  return staff?.userId ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Service requests
// ─────────────────────────────────────────────────────────────────────────────

export interface RequestSubmittedInput {
  requestId: string;
  requestNumber: string;
  customerUserId: string;
  customerName: string;
  serviceId: string;
  serviceName: string;
  officeId: string | null;
  officeName: string;
  appointmentDate: Date | string;
}

/**
 * A customer applied for a service.
 *
 * Three audiences, three different messages: the customer gets a receipt, the
 * assigned staff get a work item, and the office managers get visibility.
 */
export async function notifyRequestSubmitted(input: RequestSubmittedInput) {
  const {
    requestId,
    requestNumber,
    customerUserId,
    customerName,
    serviceId,
    serviceName,
    officeId,
    officeName,
    appointmentDate,
  } = input;

  const [staffUserIds, managerUserIds] = await Promise.all([
    getAssignedStaffUserIds(serviceId),
    getOfficeManagerUserIds(officeId),
  ]);

  // Managers already on the assigned-staff list are dropped, so nobody who
  // wears both hats is told the same thing twice.
  const staffSet = new Set(staffUserIds);
  const managersOnly = managerUserIds.filter((id) => !staffSet.has(id));

  await Promise.all([
    notify({
      userId: customerUserId,
      kind: "request",
      title: "Request submitted",
      body: `Your application for "${serviceName}" at ${officeName} was received and is under review. Ref: ${requestNumber}`,
      url: ROUTES.customerRequests,
      dedupeKey: `request:${requestId}:submitted`,
    }),

    notifyMany(staffUserIds, {
      kind: "request",
      title: "New service request",
      body: `${customerName} applied for "${serviceName}" (${formatDate(appointmentDate)}). Ref: ${requestNumber}`,
      url: ROUTES.staffRequests,
      dedupeKey: `request:${requestId}:new-for-staff`,
    }),

    notifyMany(managersOnly, {
      kind: "request",
      title: "New request in your office",
      body: `${customerName} applied for "${serviceName}". Ref: ${requestNumber}`,
      url: ROUTES.staffRequests,
      dedupeKey: `request:${requestId}:new-for-manager`,
    }),
  ]);
}

export interface RequestReviewedInput {
  requestId: string;
  customerUserId: string;
  customerName: string;
  serviceName: string;
  /** Staff record id of whoever acted, so managers can be told who reviewed. */
  actorStaffId?: string | null;
  note?: string | null;
}

/**
 * Staff approved a request — the first of two gates. The customer is told it
 * moved forward but is not finished, and the office managers are told there is
 * something waiting on their approval.
 */
export async function notifyRequestApprovedByStaff(
  input: RequestReviewedInput & { officeId?: string | null },
) {
  const {
    requestId,
    customerUserId,
    customerName,
    serviceName,
    officeId,
    note,
  } = input;

  const managerUserIds = await getOfficeManagerUserIds(officeId);

  await Promise.all([
    notify({
      userId: customerUserId,
      kind: "request_approved",
      title: "Request approved by staff",
      body:
        `Your request for "${serviceName}" passed staff review and is now awaiting manager approval.` +
        (note ? ` Note: ${note}` : ""),
      url: ROUTES.customerRequests,
      dedupeKey: `request:${requestId}:staff-approved`,
    }),

    notifyMany(managerUserIds, {
      kind: "request",
      title: "Request awaiting your approval",
      body: `${customerName}'s request for "${serviceName}" was approved by staff and needs your decision.`,
      url: ROUTES.staffRequests,
      dedupeKey: `request:${requestId}:awaiting-manager`,
    }),
  ]);
}

/**
 * Final approval. The customer is told where to physically go, since that is
 * the only thing they need from this message.
 */
export async function notifyRequestApprovedByManager(
  input: RequestReviewedInput & {
    officeName: string;
    roomNumber: string;
    address: string;
  },
) {
  const {
    requestId,
    customerUserId,
    serviceName,
    officeName,
    roomNumber,
    address,
    actorStaffId,
    note,
  } = input;

  const approverUserId = await getStaffUserId(actorStaffId);

  await Promise.all([
    notify({
      userId: customerUserId,
      kind: "request_approved",
      title: "Request approved 🎉",
      body:
        `Your request for "${serviceName}" is fully approved. Visit ${officeName}, Room ${roomNumber} (${address}).` +
        (note ? ` Note: ${note}` : ""),
      url: ROUTES.customerRequests,
      dedupeKey: `request:${requestId}:manager-approved`,
    }),

    approverUserId
      ? notify({
          userId: approverUserId,
          kind: "request_approved",
          title: "Approval recorded",
          body: `You approved the request for "${serviceName}".`,
          url: ROUTES.staffRequests,
          dedupeKey: `request:${requestId}:approval-receipt`,
        })
      : Promise.resolve(null),
  ]);
}

export interface RequestRejectedInput extends RequestReviewedInput {
  reason: string;
  /** Used to reach the staff the service is assigned to, when known. */
  serviceId?: string | null;
}

export async function notifyRequestRejected(input: RequestRejectedInput) {
  const {
    requestId,
    customerUserId,
    customerName,
    serviceName,
    serviceId,
    reason,
  } = input;

  const staffUserIds = serviceId ? await getAssignedStaffUserIds(serviceId) : [];

  await Promise.all([
    notify({
      userId: customerUserId,
      kind: "request_rejected",
      title: "Request rejected",
      body: `Your request for "${serviceName}" was rejected. Reason: ${reason}`,
      url: ROUTES.customerRequests,
      dedupeKey: `request:${requestId}:rejected`,
    }),

    notifyMany(staffUserIds, {
      kind: "request_rejected",
      title: "Request rejected",
      body: `${customerName}'s request for "${serviceName}" was rejected.`,
      url: ROUTES.staffRequests,
      dedupeKey: `request:${requestId}:rejected-for-staff`,
    }),
  ]);
}

// ─────────────────────────────────────────────────────────────────────────────
// Appointments
// ─────────────────────────────────────────────────────────────────────────────

export interface AppointmentEventInput {
  appointmentId: string;
  /** Customer the appointment belongs to. */
  customerUserId: string | null;
  customerName: string;
  serviceName: string;
  officeId?: string | null;
  serviceId?: string | null;
  date: Date | string;
  time?: string | null;
  notes?: string | null;
}

/** Renders "12 Aug 2026 at 10:30", or just the date when no time was picked. */
function whenLabel(date: Date | string, time?: string | null): string {
  return time ? `${formatDate(date)} at ${time}` : formatDate(date);
}

/**
 * An appointment was booked. The customer gets a confirmation that it is
 * *requested*, not confirmed — the staff still have to approve it — and the
 * people who can approve it are told there is a slot to review.
 */
export async function notifyAppointmentBooked(input: AppointmentEventInput) {
  const {
    appointmentId,
    customerUserId,
    customerName,
    serviceName,
    serviceId,
    officeId,
    date,
    time,
  } = input;

  const [staffUserIds, managerUserIds] = await Promise.all([
    serviceId ? getAssignedStaffUserIds(serviceId) : Promise.resolve([]),
    getOfficeManagerUserIds(officeId),
  ]);

  await Promise.all([
    customerUserId
      ? notify({
          userId: customerUserId,
          kind: "appointment",
          title: "Appointment booked",
          body: `Your appointment for "${serviceName}" on ${whenLabel(date, time)} was requested and is awaiting confirmation.`,
          url: ROUTES.appointments,
          dedupeKey: `appointment:${appointmentId}:booked`,
        })
      : Promise.resolve(null),

    notifyMany([...staffUserIds, ...managerUserIds], {
      kind: "appointment",
      title: "New appointment request",
      body: `${customerName} booked "${serviceName}" for ${whenLabel(date, time)}. Please confirm.`,
      url: ROUTES.appointments,
      dedupeKey: `appointment:${appointmentId}:booked-for-staff`,
    }),
  ]);
}

/** Staff confirmed the slot — the one message a customer actually waits for. */
export async function notifyAppointmentApproved(
  input: AppointmentEventInput & { approverStaffId?: string | null },
) {
  const {
    appointmentId,
    customerUserId,
    serviceName,
    date,
    time,
    notes,
    approverStaffId,
  } = input;

  const approverUserId = await getStaffUserId(approverStaffId);

  await Promise.all([
    customerUserId
      ? notify({
          userId: customerUserId,
          kind: "appointment_approved",
          title: "Appointment confirmed ✅",
          body:
            `Your appointment for "${serviceName}" is confirmed for ${whenLabel(date, time)}.` +
            (notes ? ` Note: ${notes}` : ""),
          url: ROUTES.appointments,
          dedupeKey: `appointment:${appointmentId}:approved`,
        })
      : Promise.resolve(null),

    approverUserId
      ? notify({
          userId: approverUserId,
          kind: "appointment_approved",
          title: "Appointment confirmed",
          body: `You confirmed "${serviceName}" for ${whenLabel(date, time)}.`,
          url: ROUTES.appointments,
          dedupeKey: `appointment:${appointmentId}:approval-receipt`,
        })
      : Promise.resolve(null),
  ]);
}

/**
 * The slot moved. Dedupe includes the new date so a second reschedule is a
 * fresh notification rather than a silently-swallowed duplicate.
 */
export async function notifyAppointmentRescheduled(
  input: AppointmentEventInput,
) {
  const {
    appointmentId,
    customerUserId,
    customerName,
    serviceName,
    serviceId,
    officeId,
    date,
    time,
  } = input;

  const stamp = new Date(date).toISOString().slice(0, 10);

  const [staffUserIds, managerUserIds] = await Promise.all([
    serviceId ? getAssignedStaffUserIds(serviceId) : Promise.resolve([]),
    getOfficeManagerUserIds(officeId),
  ]);

  await Promise.all([
    customerUserId
      ? notify({
          userId: customerUserId,
          kind: "appointment",
          title: "Appointment rescheduled",
          body: `Your appointment for "${serviceName}" now takes place on ${whenLabel(date, time)}.`,
          url: ROUTES.appointments,
          dedupeKey: `appointment:${appointmentId}:rescheduled:${stamp}:${time ?? ""}`,
        })
      : Promise.resolve(null),

    notifyMany([...staffUserIds, ...managerUserIds], {
      kind: "appointment",
      title: "Appointment rescheduled",
      body: `${customerName}'s "${serviceName}" appointment moved to ${whenLabel(date, time)}.`,
      url: ROUTES.appointments,
      dedupeKey: `appointment:${appointmentId}:rescheduled-staff:${stamp}:${time ?? ""}`,
    }),
  ]);
}

export async function notifyAppointmentCancelled(
  input: AppointmentEventInput & { cancelledByStaff?: boolean },
) {
  const {
    appointmentId,
    customerUserId,
    customerName,
    serviceName,
    serviceId,
    officeId,
    date,
    time,
    cancelledByStaff,
  } = input;

  const [staffUserIds, managerUserIds] = await Promise.all([
    serviceId ? getAssignedStaffUserIds(serviceId) : Promise.resolve([]),
    getOfficeManagerUserIds(officeId),
  ]);

  await Promise.all([
    customerUserId
      ? notify({
          userId: customerUserId,
          kind: "appointment_cancelled",
          title: "Appointment cancelled",
          body: cancelledByStaff
            ? `Your appointment for "${serviceName}" on ${whenLabel(date, time)} was cancelled by the office. Please book a new slot.`
            : `Your appointment for "${serviceName}" on ${whenLabel(date, time)} was cancelled.`,
          url: ROUTES.appointments,
          dedupeKey: `appointment:${appointmentId}:cancelled`,
        })
      : Promise.resolve(null),

    notifyMany([...staffUserIds, ...managerUserIds], {
      kind: "appointment_cancelled",
      title: "Appointment cancelled",
      body: `${customerName}'s "${serviceName}" appointment on ${whenLabel(date, time)} was cancelled.`,
      url: ROUTES.appointments,
      dedupeKey: `appointment:${appointmentId}:cancelled-staff`,
    }),
  ]);
}

// ─────────────────────────────────────────────────────────────────────────────
// Reports
// ─────────────────────────────────────────────────────────────────────────────

export async function notifyReportSent(input: {
  reportId: string;
  recipientUserId: string;
  senderName: string;
  reportName: string;
}) {
  const { reportId, recipientUserId, senderName, reportName } = input;

  await notify({
    userId: recipientUserId,
    kind: "report",
    title: "New report received",
    body: `${senderName} sent you the report "${reportName}".`,
    url: ROUTES.reports,
    dedupeKey: `report:${reportId}:sent`,
  });
}
