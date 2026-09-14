import { prisma } from "../lib/db.js";
import {
  isRequestNumber,
  normalizeRequestNumber,
} from "../utils/notification.js";

/**
 * One place that knows how a request is decided, whoever it was submitted for.
 *
 * Applications live in two tables. An ordinary one is a `request`; one a
 * customer submits for a family member is a `requestForOther`. The dashboard
 * has always listed them together — `listRequests` merges the two — but only
 * `request` had approval endpoints, and the Approve button sent every row's id
 * to them. Approving a family request therefore looked up an id that belongs to
 * the other table and answered "Request not found".
 *
 * The fix is not a second set of endpoints the frontend has to choose between:
 * it is resolving the id to whichever table owns it, and applying the same
 * decision either way. That also removes the standing risk of the two
 * workflows drifting, which is what produced the bug in the first place.
 *
 * The other thing recorded here is *why*. A rejection reason used to exist only
 * inside the SMS and push notification announcing it; nothing was written down,
 * so a customer looking at the portal saw "Rejected" and no explanation, and a
 * manager could not see which staff member had decided what. Every decision now
 * persists its author, its note and its timestamp.
 */

export type RequestKind = "self" | "other";

export type RequestRef = {
  kind: RequestKind;
  id: string;
};

/** The fields a decision needs, in one shape for both tables. */
export type DecisionContext = {
  ref: RequestRef;
  requestNumber: string | null;
  userId: string;
  customerName: string;
  customerPhone: string | null;
  serviceId: string;
  serviceName: string;
  officeId: string | null;
  officeName: string;
  officeRoomNumber: string;
  officeAddress: string;
  statusbystaff: "pending" | "approved" | "rejected";
  statusbyadmin: "pending" | "approved" | "rejected";
  /** Set only on ordinary requests; a dependent request cannot be merged. */
  mergedIntoId: string | null;
};

/**
 * Find which table owns this identifier.
 *
 * Accepts an internal id or a customer-facing reference number, because a
 * support agent quoting "REQ-20260825-00001" should reach the same row as the
 * dashboard does.
 */
export async function resolveRequestRef(
  identifier: string,
): Promise<RequestRef | null> {
  const value = (identifier ?? "").trim();
  if (!value) return null;

  const byNumber = isRequestNumber(value);
  const requestWhere = byNumber
    ? { requestNumber: normalizeRequestNumber(value) }
    : { id: value };

  const self = await prisma.request.findUnique({
    where: requestWhere,
    select: { id: true },
  });
  if (self) return { kind: "self", id: self.id };

  const other = await prisma.requestForOther.findUnique({
    where: byNumber ? { requestNumber: normalizeRequestNumber(value) } : { id: value },
    select: { id: true },
  });
  if (other) return { kind: "other", id: other.id };

  return null;
}

const selfContextSelect = {
  id: true,
  requestNumber: true,
  userId: true,
  serviceId: true,
  statusbystaff: true,
  statusbyadmin: true,
  mergedIntoId: true,
  user: { select: { username: true, name: true, phoneNumber: true } },
  service: {
    select: {
      name: true,
      officeId: true,
      office: { select: { name: true, roomNumber: true, address: true } },
    },
  },
} as const;

const proxyContextSelect = {
  id: true,
  requestNumber: true,
  userId: true,
  serviceId: true,
  statusbystaff: true,
  statusbyadmin: true,
  name: true,
  user: { select: { username: true, name: true, phoneNumber: true } },
  service: {
    select: {
      name: true,
      officeId: true,
      office: { select: { name: true, roomNumber: true, address: true } },
    },
  },
} as const;

/** Load everything a decision and its notifications need. */
export async function loadDecisionContext(
  ref: RequestRef,
): Promise<DecisionContext | null> {
  if (ref.kind === "self") {
    const row = await prisma.request.findUnique({
      where: { id: ref.id },
      select: selfContextSelect,
    });
    if (!row) return null;

    return {
      ref,
      requestNumber: row.requestNumber,
      userId: row.userId,
      customerName: row.user.name ?? row.user.username,
      customerPhone: row.user.phoneNumber ?? null,
      serviceId: row.serviceId,
      serviceName: row.service.name,
      officeId: row.service.officeId,
      officeName: row.service.office.name,
      officeRoomNumber: row.service.office.roomNumber,
      officeAddress: row.service.office.address,
      statusbystaff: row.statusbystaff,
      statusbyadmin: row.statusbyadmin,
      mergedIntoId: row.mergedIntoId,
    };
  }

  const row = await prisma.requestForOther.findUnique({
    where: { id: ref.id },
    select: proxyContextSelect,
  });
  if (!row) return null;

  return {
    ref,
    requestNumber: row.requestNumber,
    userId: row.userId,
    // The applicant is who the office corresponds with, so they are who a
    // notification addresses — the beneficiary's name is carried in the body.
    customerName: row.user.name ?? row.user.username,
    customerPhone: row.user.phoneNumber ?? null,
    serviceId: row.serviceId,
    serviceName: row.service.name,
    officeId: row.service.officeId,
    officeName: row.service.office.name,
    officeRoomNumber: row.service.office.roomNumber,
    officeAddress: row.service.office.address,
    statusbystaff: row.statusbystaff,
    statusbyadmin: row.statusbyadmin,
    mergedIntoId: null,
  };
}

/**
 * The single `status` column a dependent request still carries, derived from
 * the two decision columns that replaced it.
 *
 * Pending until both gates approve; rejected the moment either one does. Kept
 * in one function so the legacy column can never disagree with the pair it
 * summarises.
 */
export function proxyOverallStatus(
  statusbystaff: "pending" | "approved" | "rejected",
  statusbyadmin: "pending" | "approved" | "rejected",
): "pending" | "approved" | "rejected" {
  if (statusbystaff === "rejected" || statusbyadmin === "rejected") {
    return "rejected";
  }
  if (statusbystaff === "approved" && statusbyadmin === "approved") {
    return "approved";
  }
  return "pending";
}

/**
 * Combine a new note with whatever is already recorded.
 *
 * Staff and manager each leave their own note on the same row, and the second
 * one must not silently erase the first — a manager reading the file needs to
 * see what the staff member wrote as well as their own remark.
 */
function appendNote(
  existing: string | null,
  addition: string | null | undefined,
  author: string,
): string | null {
  const trimmed = addition?.trim();
  if (!trimmed) return existing;

  const entry = `${author}: ${trimmed}`;
  return existing ? `${existing}\n${entry}` : entry;
}

export type DecisionActor = {
  /** Staff record id of whoever is deciding. */
  staffId: string;
  /** How they are named in the notes trail. */
  label: string;
};

/** Record a staff-level approval on either kind of request. */
export async function applyStaffApproval(
  ref: RequestRef,
  actor: DecisionActor,
  note?: string | null,
): Promise<void> {
  const decidedAt = new Date();

  if (ref.kind === "self") {
    const current = await prisma.request.findUnique({
      where: { id: ref.id },
      select: { approveNote: true },
    });

    await prisma.request.update({
      where: { id: ref.id },
      data: {
        statusbystaff: "approved",
        approveStaffId: actor.staffId,
        approveNote: appendNote(current?.approveNote ?? null, note, actor.label),
        decidedAt,
      },
    });
    return;
  }

  const current = await prisma.requestForOther.findUnique({
    where: { id: ref.id },
    select: { approveNote: true, statusbyadmin: true },
  });

  await prisma.requestForOther.update({
    where: { id: ref.id },
    data: {
      statusbystaff: "approved",
      status: proxyOverallStatus("approved", current?.statusbyadmin ?? "pending"),
      approveStaffId: actor.staffId,
      approveNote: appendNote(current?.approveNote ?? null, note, actor.label),
      decidedAt,
    },
  });
}

/** Record a manager or administrator sign-off on either kind of request. */
export async function applyManagerApproval(
  ref: RequestRef,
  actor: DecisionActor,
  note?: string | null,
): Promise<void> {
  const decidedAt = new Date();

  if (ref.kind === "self") {
    const current = await prisma.request.findUnique({
      where: { id: ref.id },
      select: { approveNote: true },
    });

    await prisma.request.update({
      where: { id: ref.id },
      data: {
        statusbyadmin: "approved",
        approveManagerId: actor.staffId,
        approveNote: appendNote(current?.approveNote ?? null, note, actor.label),
        decidedAt,
      },
    });
    return;
  }

  const current = await prisma.requestForOther.findUnique({
    where: { id: ref.id },
    select: { approveNote: true, statusbystaff: true },
  });

  await prisma.requestForOther.update({
    where: { id: ref.id },
    data: {
      statusbyadmin: "approved",
      status: proxyOverallStatus(current?.statusbystaff ?? "pending", "approved"),
      approveManagerId: actor.staffId,
      approveNote: appendNote(current?.approveNote ?? null, note, actor.label),
      decidedAt,
    },
  });
}

/**
 * Record a rejection, with the reason, on either kind of request.
 *
 * The reason is written to the row rather than only sent out, which is what
 * lets the customer's own request page show why they were turned down.
 */
export async function applyRejection(
  ref: RequestRef,
  actor: DecisionActor | null,
  reason: string,
  decidedByStaffLevel: boolean,
): Promise<void> {
  const decidedAt = new Date();
  const decidedBy = !actor
    ? {}
    : decidedByStaffLevel
      ? { approveStaffId: actor.staffId }
      : { approveManagerId: actor.staffId };

  if (ref.kind === "self") {
    await prisma.request.update({
      where: { id: ref.id },
      data: {
        statusbystaff: "rejected",
        statusbyadmin: "rejected",
        rejectionReason: reason,
        decidedAt,
        ...decidedBy,
      },
    });
    return;
  }

  await prisma.requestForOther.update({
    where: { id: ref.id },
    data: {
      statusbystaff: "rejected",
      statusbyadmin: "rejected",
      status: "rejected",
      rejectionReason: reason,
      decidedAt,
      ...decidedBy,
    },
  });
}
