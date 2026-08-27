import type { Response } from "express";
import { Prisma } from "../lib/prisma-client.js";
import { prisma } from "../lib/db.js";
import type { AuthRequest } from "../middleware/auth.js";
import {
  createOfficeSchema,
  updateOfficeSchema,
  buildValidationError,
} from "../validators/office.validator.js";
import { canAccessOffice } from "../helper/myOffice.js";

function handlePrismaError(
  error: unknown,
  res: Response,
  context: string,
): Response {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      return res
        .status(404)
        .json({ error: "NotFound", message: "Office not found." });
    }
    if (error.code === "P2002") {
      const fields = Array.isArray(error.meta?.target)
        ? (error.meta.target as string[]).join(", ")
        : "field";
      return res.status(409).json({
        error: "Conflict",
        message: `An office with this ${fields} already exists.`,
      });
    }
  }
  console.error(`[${context}] Error:`, error);
  return res
    .status(500)
    .json({
      error: "InternalServerError",
      message: "An unexpected error occurred.",
    });
}

const officeListSelect = {
  id: true,
  name: true,
  roomNumber: true,
  address: true,
  phoneNumber: true,
  subdomain: true,
  logo: true,
  slogan: true,
  status: true,
  startedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

/**
 * Per-office request/appointment totals, counted through the `service`
 * relation.
 *
 * `request.officeId` / `appointment.officeId` are nullable denormalised
 * columns, and rows written before they existed (or by any code path that
 * forgot them) leave them NULL — which makes Prisma's `_count` on those
 * relations report 0 for offices that plainly have work. `service.officeId`
 * is required, so walking request -> service -> office is authoritative for
 * legacy and new rows alike. One grouped query each, no per-office N+1.
 */
async function officeWorkloadCounts(): Promise<{
  requests: Map<string, number>;
  appointments: Map<string, number>;
}> {
  type CountRow = { officeId: string | null; total: bigint | number | null };

  const [requestRows, appointmentRows] = await Promise.all([
    // Both kinds of request count towards an office's workload: the ordinary
    // ones and those submitted on behalf of a family member.
    prisma.$queryRaw<CountRow[]>`
      SELECT \`officeId\`, SUM(\`total\`) AS \`total\`
      FROM (
        SELECT \`s\`.\`officeId\` AS \`officeId\`, COUNT(*) AS \`total\`
        FROM \`request\` \`r\`
        JOIN \`service\` \`s\` ON \`s\`.\`id\` = \`r\`.\`serviceId\`
        GROUP BY \`s\`.\`officeId\`
        UNION ALL
        SELECT \`s\`.\`officeId\` AS \`officeId\`, COUNT(*) AS \`total\`
        FROM \`request_for_other\` \`o\`
        JOIN \`service\` \`s\` ON \`s\`.\`id\` = \`o\`.\`serviceId\`
        GROUP BY \`s\`.\`officeId\`
      ) \`combined\`
      GROUP BY \`officeId\`
    `,
    prisma.$queryRaw<CountRow[]>`
      SELECT \`s\`.\`officeId\` AS \`officeId\`, COUNT(*) AS \`total\`
      FROM \`appointment\` \`a\`
      JOIN \`request\` \`r\` ON \`r\`.\`id\` = \`a\`.\`requestId\`
      JOIN \`service\` \`s\` ON \`s\`.\`id\` = \`r\`.\`serviceId\`
      GROUP BY \`s\`.\`officeId\`
    `,
  ]);

  const toMap = (rows: CountRow[]): Map<string, number> => {
    const map = new Map<string, number>();
    for (const row of rows) {
      if (!row.officeId) continue;
      map.set(row.officeId, Number(row.total ?? 0));
    }
    return map;
  };

  return { requests: toMap(requestRows), appointments: toMap(appointmentRows) };
}

/**
 * Overlay the service-derived totals onto the `_count` block Prisma returned,
 * keeping the shape clients already read. A failed aggregate must not take the
 * whole office list down, so the caller's `_count` is left as-is on error.
 */
async function withWorkloadCounts<T extends { id: string; _count?: any }>(
  offices: T[],
): Promise<T[]> {
  try {
    const { requests, appointments } = await officeWorkloadCounts();
    return offices.map((office) => ({
      ...office,
      _count: {
        ...(office._count ?? {}),
        requests: requests.get(office.id) ?? 0,
        appointments: appointments.get(office.id) ?? 0,
      },
    }));
  } catch (error) {
    console.error("[officeWorkloadCounts] Falling back to _count:", error);
    return offices;
  }
}

export async function listOffices(
  _req: AuthRequest,
  res: Response,
): Promise<Response | void> {
  try {
    const offices = await prisma.office.findMany({
      select: {
        ...officeListSelect,
        _count: {
          select: {
            service: true,
            staffs: true,
            requests: true,
            appointments: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
          },
          take: 3,
        },
      },
      orderBy: { name: "asc" },
    });
    return res.json({ data: await withWorkloadCounts(offices) });
  } catch (error) {
    return handlePrismaError(error, res, "listOffices");
  }
}

/**
 * Roles allowed to read system-wide statistics. Mirrors the admin set the
 * frontend uses to route users to /admin-overview, so every role that can open
 * that page can also load its numbers.
 */
const ADMIN_ROLE_NAMES = new Set([
  "ADMIN",
  "ADMINISTRATOR",
  "SUPERADMIN",
  "SYSTEM_ADMIN",
]);

/**
 * GET /offices/stats — system-wide analytics for the admin overview.
 *
 * Every figure is aggregated in the database rather than derived from a page
 * of rows, so the dashboard cannot silently under-report once a table grows
 * past whatever `pageSize` the client happened to ask for.
 */
export async function getOverviewStats(
  req: AuthRequest,
  res: Response,
): Promise<Response | void> {
  try {
    const roleName = req.user?.roleName?.trim().toUpperCase() ?? "";
    if (!ADMIN_ROLE_NAMES.has(roleName)) {
      return res.status(403).json({
        error: "PermissionDenied",
        message: "System-wide statistics are restricted to platform admins.",
      });
    }

    const [
      offices,
      totalUsers,
      totalStaff,
      totalServices,
      totalRequests,
      totalRequestsForOther,
      totalAppointments,
      staffStatusRows,
      requestStatusGroups,
      requestForOtherStatusGroups,
      appointmentStatusGroups,
    ] = await Promise.all([
      prisma.office.findMany({
        select: {
          id: true,
          name: true,
          status: true,
          _count: { select: { service: true, staffs: true } },
        },
        orderBy: { name: "asc" },
      }),
      prisma.user.count(),
      prisma.staff.count(),
      prisma.service.count(),
      prisma.request.count(),
      prisma.requestForOther.count(),
      prisma.appointment.count(),
      // Status lives on the user, not the staff row, and Prisma cannot group by
      // a relation field — so read the statuses and tally them here. One row
      // per staff member keeps this consistent with the per-office staff
      // column, which also counts staff rows rather than distinct people.
      prisma.staff.findMany({ select: { user: { select: { status: true } } } }),
      // The overall request status is a function of both approval columns, so
      // group by the pair and fold the combinations together below.
      prisma.request.groupBy({
        by: ["statusbystaff", "statusbyadmin"],
        _count: { _all: true },
      }),
      // Dependent requests carry one status column rather than the pair.
      prisma.requestForOther.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      prisma.appointment.groupBy({ by: ["status"], _count: { _all: true } }),
    ]);

    const { requests, appointments } = await officeWorkloadCounts();

    const requestStatus = { pending: 0, processing: 0, approved: 0, rejected: 0 };

    // A dependent request has a single status, so it maps straight across —
    // it never reaches the "processing" half-approved state.
    for (const group of requestForOtherStatusGroups) {
      const count = group._count._all;
      if (group.status === "rejected") requestStatus.rejected += count;
      else if (group.status === "approved") requestStatus.approved += count;
      else requestStatus.pending += count;
    }

    for (const group of requestStatusGroups) {
      const count = group._count._all;
      if (group.statusbystaff === "rejected" || group.statusbyadmin === "rejected") {
        requestStatus.rejected += count;
      } else if (group.statusbystaff === "approved" && group.statusbyadmin === "approved") {
        requestStatus.approved += count;
      } else if (group.statusbystaff === "approved") {
        requestStatus.processing += count;
      } else {
        requestStatus.pending += count;
      }
    }

    const staffStatus: Record<string, number> = {};
    for (const row of staffStatusRows) {
      const status = row.user?.status ?? "ACTIVE";
      staffStatus[status] = (staffStatus[status] ?? 0) + 1;
    }

    const appointmentStatus: Record<string, number> = {};
    for (const group of appointmentStatusGroups) {
      appointmentStatus[group.status] = group._count._all;
    }

    return res.json({
      data: {
        totals: {
          offices: offices.length,
          users: totalUsers,
          staff: totalStaff,
          services: totalServices,
          // Both kinds, so the headline figure matches what the list shows.
          requests: totalRequests + totalRequestsForOther,
          appointments: totalAppointments,
        },
        staffStatus,
        requestStatus,
        appointmentStatus,
        offices: offices.map((office) => ({
          id: office.id,
          name: office.name,
          status: office.status,
          services: office._count.service,
          staff: office._count.staffs,
          requests: requests.get(office.id) ?? 0,
          appointments: appointments.get(office.id) ?? 0,
        })),
      },
    });
  } catch (error) {
    return handlePrismaError(error, res, "getOverviewStats");
  }
}

export async function getPublicOffice(
  req: AuthRequest,
  res: Response,
): Promise<Response | void> {
  try {
    const id = req.params["id"] as string;

    const office = await prisma.office.findFirst({
      where: { id, status: true },
      select: {
        ...officeListSelect,
        _count: {
          select: {
            service: true,
            staffs: true,
            requests: true,
            appointments: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            description: true,
            timeToTake: true,
            roomNumber: true,
            requirements: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
            serviceFors: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
          orderBy: { name: "asc" },
        },
      },
    });

    if (!office) {
      return res
        .status(404)
        .json({ error: "NotFound", message: "Office not found." });
    }

    const [withCounts] = await withWorkloadCounts([office]);
    return res.json({ data: withCounts });
  } catch (error) {
    return handlePrismaError(error, res, "getPublicOffice");
  }
}

export async function getOffice(
  req: AuthRequest,
  res: Response,
): Promise<Response | void> {
  try {
    const id = req.params["id"] as string;

    const office = await prisma.office.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            service: true,
            staffs: true,
            requests: true,
            appointments: true,
          },
        },
        availability: true,
        service: {
          include: {
            requirements: true,
            serviceFors: true,
          },
        },
      },
    });

    if (!office) {
      return res
        .status(404)
        .json({ error: "NotFound", message: "Office not found." });
    }

    const [withCounts] = await withWorkloadCounts([office]);
    return res.json({ data: withCounts });
  } catch (error) {
    return handlePrismaError(error, res, "getOffice");
  }
}

export async function createOffice(
  req: AuthRequest,
  res: Response,
): Promise<Response | void> {
  try {
    const validation = createOfficeSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json(buildValidationError(validation.error));
    }

    const {
      name,
      roomNumber,
      address,
      subdomain,
      phoneNumber,
      logo,
      slogan,
      settings,
      status,
    } = validation.data;

    const office = await prisma.office.create({
      data: {
        name,
        roomNumber,
        address,
        subdomain,
        ...(phoneNumber !== undefined ? { phoneNumber } : {}),
        ...(logo !== undefined ? { logo } : {}),
        ...(slogan !== undefined ? { slogan } : {}),
        ...(settings !== undefined ? { settings } : {}),
        ...(status !== undefined ? { status } : {}),
      },
    });

    return res.status(201).json({ data: office });
  } catch (error) {
    return handlePrismaError(error, res, "createOffice");
  }
}

export async function updateOffice(
  req: AuthRequest,
  res: Response,
): Promise<Response | void> {
  try {
    const id = req.params["id"] as string;

    // Holding the permission is not enough: a manager may only edit the office
    // they belong to. Without this, any permitted caller could edit any office
    // simply by putting its id in the URL.
    if (!canAccessOffice(req, id)) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You do not have access to this office.",
      });
    }

    const validation = updateOfficeSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json(buildValidationError(validation.error));
    }

    const {
      name,
      roomNumber,
      address,
      subdomain,
      phoneNumber,
      logo,
      slogan,
      settings,
      status,
    } = validation.data;

    const office = await prisma.office.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(roomNumber !== undefined ? { roomNumber } : {}),
        ...(address !== undefined ? { address } : {}),
        ...(subdomain !== undefined ? { subdomain } : {}),
        ...(phoneNumber !== undefined ? { phoneNumber } : {}),
        ...(logo !== undefined ? { logo } : {}),
        ...(slogan !== undefined ? { slogan } : {}),
        ...(settings !== undefined ? { settings } : {}),
        ...(status !== undefined ? { status } : {}),
      },
    });

    return res.json({ data: office });
  } catch (error) {
    return handlePrismaError(error, res, "updateOffice");
  }
}

export async function deleteOffice(
  req: AuthRequest,
  res: Response,
): Promise<Response | void> {
  try {
    const id = req.params["id"] as string;

    await prisma.office.delete({ where: { id } });

    return res.status(204).send();
  } catch (error) {
    return handlePrismaError(error, res, "deleteOffice");
  }
}
