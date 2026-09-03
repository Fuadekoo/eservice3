import type { ReportBreakdown, ReportDocument, ReportStat, ReportTable } from "@/lib/pdf-report";

/**
 * Report contents for the three overview dashboards.
 *
 * Kept apart from the pages so the wiring in each one stays to a button and a
 * handler, and so what a report actually says can be read in one place.
 *
 * Every builder is given the records the page already holds and narrows them to
 * the chosen period itself. Records are dated by when they were created — for
 * an appointment, by the day it is booked for, which is the date that matters
 * when asking what a period contained.
 */

type Translate = (key: string) => string;

export type Range = { from: Date; to: Date };

/** Request rows as the API returns them; only the fields a report reads. */
export type RequestLike = {
  id: string;
  requestNumber?: string | null;
  createdAt: string;
  statusbystaff?: string;
  statusbyadmin?: string;
  service?: { id?: string; name?: string; office?: { name?: string } } | null;
  user?: { username?: string; name?: string | null } | null;
  beneficiary?: { name?: string; relationship?: string } | null;
  /** The staff member who took the staff-level decision, approval or rejection. */
  approveStaff?: { id: string; user?: { id?: string; username?: string } | null } | null;
  /** The manager who took the final decision, approval or rejection. */
  approveManager?: { id: string; user?: { id?: string; username?: string } | null } | null;
};

/** A service as `GET /services` returns it, with who is assigned to handle it. */
export type ServiceLike = {
  id: string;
  name: string;
  staffAssignments?: {
    staffId: string;
    staff: {
      id: string;
      user: {
        id: string;
        username: string;
        name?: string | null;
        firstName?: string | null;
        fatherName?: string | null;
        lastName?: string | null;
      };
    };
  }[];
};

/** One service's requests, tallied by outcome. */
export type ServiceSummary = {
  id: string;
  name: string;
  /** Display names of the staff assigned to handle it. */
  staff: string[];
  total: number;
  approved: number;
  rejected: number;
  /** Pending staff review or awaiting the manager. */
  inProgress: number;
};

/** One staff member's decisions, tallied. */
export type StaffSummary = {
  id: string;
  name: string;
  role?: string;
  status: string;
  /** Services the member is assigned to. */
  services: number;
  /** Requests this member approved at the staff step. */
  approved: number;
  /** Requests this member rejected. */
  rejected: number;
};

export type AppointmentLike = {
  id: string;
  date: string;
  time?: string | null;
  status: string;
  request?: {
    service?: { name?: string; office?: { name?: string } } | null;
    user?: { username?: string } | null;
  } | null;
};

type StaffLike = {
  id: string;
  name?: string;
  firstName?: string | null;
  fatherName?: string | null;
  lastName?: string | null;
  status: string;
  role?: { name?: string } | null;
};

// ── Shared helpers ───────────────────────────────────────────────────────────

const STATUS_COLORS = {
  pending: "#f59e0b",
  processing: "#3b82f6",
  approved: "#10b981",
  rejected: "#ef4444",
  cancelled: "#6b7280",
  completed: "#3b82f6",
} as const;

/** The single status a request has reached, from the staff/admin pair. */
export function requestStatus(
  request: RequestLike,
): "pending" | "processing" | "approved" | "rejected" {
  if (request.statusbystaff === "rejected" || request.statusbyadmin === "rejected")
    return "rejected";
  if (request.statusbystaff === "approved" && request.statusbyadmin === "approved")
    return "approved";
  if (request.statusbystaff === "approved") return "processing";
  return "pending";
}

function within(range: Range, value?: string | null): boolean {
  if (!value) return false;
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return false;
  return time >= range.from.getTime() && time <= range.to.getTime();
}

const day = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const titleCase = (value?: string | null) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : "—";

function staffName(member: StaffLike): string {
  const parts = [member.firstName, member.fatherName, member.lastName].filter(Boolean);
  return parts.length ? parts.join(" ") : member.name || "—";
}

function assigneeName(
  assignment: NonNullable<ServiceLike["staffAssignments"]>[number],
): string {
  const { user } = assignment.staff;
  const parts = [user.firstName, user.fatherName, user.lastName]
    .map((part) => (part ?? "").trim())
    .filter(Boolean);
  return parts.length ? parts.join(" ") : user.name?.trim() || user.username;
}

// ── Per-service and per-staff tallies ────────────────────────────────────────
//
// Shared by the overview pages and the reports so the table on screen and the
// table in the PDF cannot disagree. Both work from the request list the page
// already holds; the caller narrows it to a period first when one applies.

/**
 * Every service with its requests tallied by outcome, busiest first.
 *
 * Services with no requests still appear, so a manager can see which ones sit
 * idle; a request whose service is missing from the catalogue (deleted, or
 * beyond the page the list fetched) is still counted under its own name.
 */
export function summarizeByService(
  requests: RequestLike[],
  services: ServiceLike[],
): ServiceSummary[] {
  const byId = new Map<string, ServiceSummary>();

  for (const service of services) {
    byId.set(service.id, {
      id: service.id,
      name: service.name,
      staff: (service.staffAssignments ?? []).map(assigneeName),
      total: 0,
      approved: 0,
      rejected: 0,
      inProgress: 0,
    });
  }

  for (const request of requests) {
    const id = request.service?.id ?? `name:${request.service?.name ?? ""}`;
    let summary = byId.get(id);
    if (!summary) {
      summary = {
        id,
        name: request.service?.name ?? "—",
        staff: [],
        total: 0,
        approved: 0,
        rejected: 0,
        inProgress: 0,
      };
      byId.set(id, summary);
    }
    summary.total += 1;
    const status = requestStatus(request);
    if (status === "approved") summary.approved += 1;
    else if (status === "rejected") summary.rejected += 1;
    else summary.inProgress += 1;
  }

  return [...byId.values()].sort(
    (a, b) => b.total - a.total || a.name.localeCompare(b.name),
  );
}

/**
 * Every staff member with the decisions they took, most active first.
 *
 * An approval is credited to the member recorded at the staff step. A
 * rejection is credited to that member only when no manager is recorded on
 * the request — a manager rejecting after staff approval is the manager's
 * decision, not the staff member's.
 */
export function summarizeByStaff(
  staff: StaffLike[],
  services: ServiceLike[],
  requests: RequestLike[],
): StaffSummary[] {
  const summaries = new Map<string, StaffSummary>(
    staff.map((member) => [
      member.id,
      {
        id: member.id,
        name: staffName(member),
        role: member.role?.name ?? undefined,
        status: member.status,
        services: 0,
        approved: 0,
        rejected: 0,
      },
    ]),
  );

  for (const service of services) {
    for (const assignment of service.staffAssignments ?? []) {
      const summary = summaries.get(assignment.staffId);
      if (summary) summary.services += 1;
    }
  }

  for (const request of requests) {
    const summary = request.approveStaff
      ? summaries.get(request.approveStaff.id)
      : undefined;
    if (!summary) continue;
    const status = requestStatus(request);
    if (status === "rejected") {
      if (!request.approveManager) summary.rejected += 1;
    } else if (request.statusbystaff === "approved") {
      summary.approved += 1;
    }
  }

  return [...summaries.values()].sort(
    (a, b) =>
      b.approved + b.rejected - (a.approved + a.rejected) ||
      b.services - a.services ||
      a.name.localeCompare(b.name),
  );
}

function serviceTable(
  requests: RequestLike[],
  services: ServiceLike[],
  t: Translate,
  options: { showStaff?: boolean } = {},
): ReportTable {
  return {
    title: t("Requests by service"),
    columns: [
      t("Service"),
      ...(options.showStaff ? [t("Assigned staff")] : []),
      t("Total"),
      t("Approved"),
      t("Rejected"),
      t("In progress"),
    ],
    rows: summarizeByService(requests, services).map((summary) => [
      summary.name,
      ...(options.showStaff
        ? [summary.staff.length ? summary.staff.join(", ") : t("Unassigned")]
        : []),
      summary.total,
      summary.approved,
      summary.rejected,
      summary.inProgress,
    ]),
    emptyMessage: t("No services are offered by this office."),
  };
}

function staffActivityTable(
  staff: StaffLike[],
  services: ServiceLike[],
  requests: RequestLike[],
  t: Translate,
): ReportTable {
  return {
    title: t("Staff activity in this period"),
    columns: [
      t("Name"),
      t("Role"),
      t("Status"),
      t("Services"),
      t("Approved"),
      t("Rejected"),
    ],
    rows: summarizeByStaff(staff, services, requests).map((summary) => [
      summary.name,
      titleCase(summary.role),
      t(titleCase(summary.status)),
      summary.services,
      summary.approved,
      summary.rejected,
    ]),
    emptyMessage: t("No staff are assigned to this office."),
  };
}

/** Applicant, or the family member the request was filed for. */
function applicantOf(request: RequestLike): string {
  const applicant = request.user?.name || request.user?.username || "—";
  if (!request.beneficiary?.name) return applicant;
  const relation = request.beneficiary.relationship
    ? ` (${titleCase(request.beneficiary.relationship)})`
    : "";
  return `${request.beneficiary.name}${relation}`;
}

function countBy<T>(items: T[], key: (item: T) => string): Record<string, number> {
  return items.reduce<Record<string, number>>((totals, item) => {
    const bucket = key(item);
    totals[bucket] = (totals[bucket] ?? 0) + 1;
    return totals;
  }, {});
}

/** Percentage of the whole, or a dash when there is no whole to speak of. */
const share = (part: number, whole: number, t: Translate) =>
  whole > 0 ? `${Math.round((part / whole) * 100)}% ${t("of total")}` : t("None in period");

function requestBreakdown(requests: RequestLike[], t: Translate): ReportBreakdown {
  const counts = countBy(requests, requestStatus);
  return {
    title: t("Requests by status"),
    items: (["approved", "processing", "pending", "rejected"] as const).map((status) => ({
      label: t(titleCase(status)),
      value: counts[status] ?? 0,
      color: STATUS_COLORS[status],
    })),
  };
}

function appointmentBreakdown(
  appointments: AppointmentLike[],
  t: Translate,
): ReportBreakdown {
  const counts = countBy(appointments, (a) => a.status.toLowerCase());
  const statuses = Object.keys(counts).sort();
  return {
    title: t("Appointments by status"),
    items: statuses.map((status) => ({
      label: t(titleCase(status)),
      value: counts[status] ?? 0,
      color: STATUS_COLORS[status as keyof typeof STATUS_COLORS] ?? "#6b7280",
    })),
  };
}

function requestTable(
  requests: RequestLike[],
  t: Translate,
  options: { showOffice?: boolean } = {},
): ReportTable {
  const columns = [
    t("Date"),
    t("Reference"),
    t("Service"),
    ...(options.showOffice ? [t("Office")] : []),
    t("Applicant"),
    t("Status"),
  ];

  return {
    title: t("Requests in this period"),
    columns,
    rows: [...requests]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((request) => [
        day(request.createdAt),
        request.requestNumber ?? "—",
        request.service?.name ?? "—",
        ...(options.showOffice ? [request.service?.office?.name ?? "—"] : []),
        applicantOf(request),
        t(titleCase(requestStatus(request))),
      ]),
    emptyMessage: t("No requests were submitted in this period."),
  };
}

function appointmentTable(
  appointments: AppointmentLike[],
  t: Translate,
  options: { showOffice?: boolean } = {},
): ReportTable {
  const columns = [
    t("Date"),
    t("Time"),
    t("Service"),
    ...(options.showOffice ? [t("Office")] : []),
    t("Applicant"),
    t("Status"),
  ];

  return {
    title: t("Appointments in this period"),
    columns,
    rows: [...appointments]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((appointment) => [
        day(appointment.date),
        appointment.time ?? "—",
        appointment.request?.service?.name ?? "—",
        ...(options.showOffice ? [appointment.request?.service?.office?.name ?? "—"] : []),
        appointment.request?.user?.username ?? "—",
        t(titleCase(appointment.status)),
      ]),
    emptyMessage: t("No appointments fall in this period."),
  };
}

// ── Manager ──────────────────────────────────────────────────────────────────

export function buildManagerReport(input: {
  range: Range;
  t: Translate;
  generatedBy?: string;
  officeName: string;
  /** Office logo for the letterhead. Omitted when the office has none. */
  officeLogoUrl?: string;
  serviceCount: number;
  /** The office catalogue, with assignments, for the per-service tables. */
  services?: ServiceLike[];
  staff: StaffLike[];
  requests: RequestLike[];
  appointments: AppointmentLike[];
}): ReportDocument {
  const { range, t, officeName } = input;
  const services = input.services ?? [];

  const requests = input.requests.filter((r) => within(range, r.createdAt));
  const appointments = input.appointments.filter((a) => within(range, a.date));
  const counts = countBy(requests, requestStatus);
  const activeStaff = input.staff.filter((member) => member.status === "ACTIVE").length;

  const stats: ReportStat[] = [
    { label: t("Requests received"), value: requests.length },
    {
      label: t("Approved"),
      value: counts.approved ?? 0,
      hint: share(counts.approved ?? 0, requests.length, t),
    },
    {
      label: t("Awaiting action"),
      value: (counts.pending ?? 0) + (counts.processing ?? 0),
      hint: share((counts.pending ?? 0) + (counts.processing ?? 0), requests.length, t),
    },
    {
      label: t("Rejected"),
      value: counts.rejected ?? 0,
      hint: share(counts.rejected ?? 0, requests.length, t),
    },
    { label: t("Appointments"), value: appointments.length },
    { label: t("Services offered"), value: input.serviceCount },
    {
      label: t("Active staff"),
      value: activeStaff,
      hint: `${input.staff.length} ${t("on the roster")}`,
    },
  ];

  return {
    title: t("Office Performance Report"),
    subtitle: officeName,
    logoUrl: input.officeLogoUrl,
    range,
    generatedBy: input.generatedBy,
    stats,
    breakdowns: [requestBreakdown(requests, t), appointmentBreakdown(appointments, t)],
    tables: [
      serviceTable(requests, services, t, { showStaff: true }),
      staffActivityTable(input.staff, services, requests, t),
      requestTable(requests, t),
      appointmentTable(appointments, t),
    ],
    fileName: `${officeName} office report`,
    t,
  };
}

// ── Staff ────────────────────────────────────────────────────────────────────

export function buildStaffReport(input: {
  range: Range;
  t: Translate;
  /** The staff member the report is about; also who prepared it. */
  staffName: string;
  /** Staff row id, to credit decisions. Either id identifies the member. */
  staffId?: string | null;
  userId?: string | null;
  officeName?: string;
  officeLogoUrl?: string;
  /** Services this member is assigned to handle. */
  services: ServiceLike[];
  /** Requests on those services — what the staff queue already shows. */
  requests: RequestLike[];
  appointments: AppointmentLike[];
}): ReportDocument {
  const { range, t } = input;

  const requests = input.requests.filter((r) => within(range, r.createdAt));
  const appointments = input.appointments.filter((a) => within(range, a.date));
  const counts = countBy(requests, requestStatus);

  const isMine = (request: RequestLike) => {
    const actor = request.approveStaff;
    if (!actor) return false;
    return (
      (Boolean(input.staffId) && actor.id === input.staffId) ||
      (Boolean(input.userId) && actor.user?.id === input.userId)
    );
  };
  const approvedByMe = requests.filter(
    (r) => isMine(r) && r.statusbystaff === "approved",
  ).length;
  const rejectedByMe = requests.filter(
    (r) => isMine(r) && requestStatus(r) === "rejected" && !r.approveManager,
  ).length;

  const stats: ReportStat[] = [
    { label: t("Requests received"), value: requests.length },
    {
      label: t("Approved by me"),
      value: approvedByMe,
      hint: share(approvedByMe, requests.length, t),
    },
    {
      label: t("Rejected by me"),
      value: rejectedByMe,
      hint: share(rejectedByMe, requests.length, t),
    },
    {
      label: t("Awaiting my review"),
      value: counts.pending ?? 0,
      hint: share(counts.pending ?? 0, requests.length, t),
    },
    {
      label: t("With the manager"),
      value: counts.processing ?? 0,
      hint: share(counts.processing ?? 0, requests.length, t),
    },
    {
      label: t("Fully approved"),
      value: counts.approved ?? 0,
      hint: share(counts.approved ?? 0, requests.length, t),
    },
    { label: t("Appointments"), value: appointments.length },
    { label: t("Assigned services"), value: input.services.length },
  ];

  return {
    title: t("Staff Activity Report"),
    subtitle: input.officeName
      ? `${input.staffName} · ${input.officeName}`
      : input.staffName,
    logoUrl: input.officeLogoUrl,
    range,
    generatedBy: input.staffName,
    stats,
    breakdowns: [requestBreakdown(requests, t), appointmentBreakdown(appointments, t)],
    tables: [
      serviceTable(requests, input.services, t),
      requestTable(requests, t),
      appointmentTable(appointments, t),
    ],
    fileName: `${input.staffName} staff report`,
    t,
  };
}

// ── Administrator ────────────────────────────────────────────────────────────

export function buildAdminReport(input: {
  range: Range;
  t: Translate;
  generatedBy?: string;
  totals: {
    offices: number;
    users: number;
    staff: number;
    services: number;
  };
  offices: {
    name: string;
    status: boolean;
    services: number;
    staff: number;
    requests: number;
    appointments: number;
  }[];
  requests: RequestLike[];
  appointments: AppointmentLike[];
}): ReportDocument {
  const { range, t } = input;

  const requests = input.requests.filter((r) => within(range, r.createdAt));
  const appointments = input.appointments.filter((a) => within(range, a.date));
  const counts = countBy(requests, requestStatus);

  const stats: ReportStat[] = [
    { label: t("Requests received"), value: requests.length },
    {
      label: t("Approved"),
      value: counts.approved ?? 0,
      hint: share(counts.approved ?? 0, requests.length, t),
    },
    {
      label: t("Awaiting action"),
      value: (counts.pending ?? 0) + (counts.processing ?? 0),
      hint: share((counts.pending ?? 0) + (counts.processing ?? 0), requests.length, t),
    },
    { label: t("Appointments"), value: appointments.length },
    {
      label: t("Offices"),
      value: input.totals.offices,
      hint: `${input.offices.filter((o) => o.status).length} ${t("active")}`,
    },
    { label: t("Registered users"), value: input.totals.users },
    { label: t("Staff"), value: input.totals.staff },
    { label: t("Services"), value: input.totals.services },
  ];

  return {
    title: t("System-Wide Performance Report"),
    subtitle: t("All offices"),
    range,
    generatedBy: input.generatedBy,
    stats,
    breakdowns: [requestBreakdown(requests, t), appointmentBreakdown(appointments, t)],
    tables: [
      {
        // Office totals are all-time figures from the statistics endpoint, not
        // period figures — said plainly here so the two are never confused.
        title: t("Offices (all-time totals)"),
        columns: [
          t("Office"),
          t("Status"),
          t("Services"),
          t("Staff"),
          t("Requests"),
          t("Appointments"),
        ],
        rows: [...input.offices]
          .sort((a, b) => b.requests - a.requests)
          .map((office) => [
            office.name,
            office.status ? t("Active") : t("Inactive"),
            office.services,
            office.staff,
            office.requests,
            office.appointments,
          ]),
        emptyMessage: t("No offices are registered."),
      },
      requestTable(requests, t, { showOffice: true }),
      appointmentTable(appointments, t, { showOffice: true }),
    ],
    fileName: "system wide report",
    t,
  };
}

// ── Customer ─────────────────────────────────────────────────────────────────

export function buildCustomerReport(input: {
  range: Range;
  t: Translate;
  applicantName: string;
  requests: RequestLike[];
  appointments: AppointmentLike[];
}): ReportDocument {
  const { range, t } = input;

  const requests = input.requests.filter((r) => within(range, r.createdAt));
  const appointments = input.appointments.filter((a) => within(range, a.date));
  const counts = countBy(requests, requestStatus);
  const onBehalf = requests.filter((r) => Boolean(r.beneficiary?.name)).length;

  const stats: ReportStat[] = [
    { label: t("Requests submitted"), value: requests.length },
    { label: t("Approved"), value: counts.approved ?? 0 },
    { label: t("In progress"), value: (counts.pending ?? 0) + (counts.processing ?? 0) },
    { label: t("Rejected"), value: counts.rejected ?? 0 },
    { label: t("Appointments"), value: appointments.length },
    {
      label: t("For a family member"),
      value: onBehalf,
      hint: share(onBehalf, requests.length, t),
    },
  ];

  return {
    title: t("My Service Requests"),
    subtitle: input.applicantName,
    range,
    generatedBy: input.applicantName,
    stats,
    breakdowns: [requestBreakdown(requests, t)],
    tables: [
      requestTable(requests, t, { showOffice: true }),
      appointmentTable(appointments, t, { showOffice: true }),
    ],
    fileName: "my service requests",
    t,
  };
}
