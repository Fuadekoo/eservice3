import type { Response } from "express";
import { Prisma } from "../lib/prisma-client.js";
import { prisma } from "../lib/db.js";
import type { AuthRequest } from "../middleware/auth.js";
import {
  canAccessOffice,
  getAssignedOfficeId,
  getMyOfficeId,
} from "../helper/myOffice.js";
import {
  createServiceSchema,
  updateServiceSchema,
  assignStaffSchema,
  buildValidationError,
} from "../validators/service.validator.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function handlePrismaError(
  error: unknown,
  res: Response,
  context: string,
  notFoundMessage = "Record not found.",
): Response {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "NotFound", message: notFoundMessage });
    }
    if (error.code === "P2002") {
      const fields = Array.isArray(error.meta?.target)
        ? (error.meta.target as string[]).join(", ")
        : "field";
      return res.status(409).json({
        error: "Conflict",
        message: `A record with this ${fields} already exists.`,
      });
    }
  }
  console.error(`[${context}] Error:`, error);
  return res
    .status(500)
    .json({ error: "InternalServerError", message: "An unexpected error occurred." });
}

function parseQueryString(value: unknown): string | undefined {
  const str = typeof value === "string" ? value.trim() : undefined;
  return str || undefined;
}

function parseQueryInt(value: unknown, defaultValue: number): number {
  const str = typeof value === "string" ? value : undefined;
  if (!str) return defaultValue;
  const parsed = parseInt(str, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

// ─── Shared include ───────────────────────────────────────────────────────────

const serviceDetailInclude = {
  office: {
    select: {
      id: true,
      name: true,
      roomNumber: true,
      address: true,
      logo: true,
      slogan: true,
      status: true,
    },
  },
  requirements: {
    orderBy: { createdAt: "asc" as const },
  },
  serviceFors: {
    orderBy: { createdAt: "asc" as const },
  },
  staffAssignments: {
    // A select, not an include: this rides along on `GET /services`, which is
    // optionalAuth, so it is served to unauthenticated callers. Enough to name
    // who handles a service and no more — the phone number that used to be
    // here was read by nothing and had no business being public.
    select: {
      id: true,
      staffId: true,
      staff: {
        select: {
          id: true,
          officeId: true,
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              firstName: true,
              fatherName: true,
              lastName: true,
            },
          },
        },
      },
    },
  },
} as const;

/** Matches `serviceDetailInclude.staffAssignments`, for the write endpoints. */
const staffAssignmentSelect = serviceDetailInclude.staffAssignments.select;

// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * GET /services
 * Public. Lists services from active offices with pagination and search.
 * Optionally filter by ?officeId=
 */
export async function listServices(
  req: AuthRequest,
  res: Response,
): Promise<Response | void> {
  try {
    const requestedOfficeId = parseQueryString(req.query["officeId"]);

    // An office member sees their own office and nothing else, whatever the
    // query string asks for — otherwise a manager could read a rival office's
    // catalogue simply by editing the URL. Guests and administrators are not
    // scoped: the public site lists every office, and an administrator
    // oversees all of them.
    const ownOfficeId = req.isAdmin ? undefined : getAssignedOfficeId(req);
    const officeId = ownOfficeId ?? requestedOfficeId;

    const search = parseQueryString(req.query["search"]);
    const page = Math.max(1, parseQueryInt(req.query["page"], 1));
    const pageSize = Math.min(
      100,
      Math.max(1, parseQueryInt(req.query["pageSize"], 20)),
    );
    const skip = (page - 1) * pageSize;

    const where = {
      office: { status: true },
      ...(officeId ? { officeId } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { description: { contains: search } },
            ],
          }
        : {}),
    };

    const [total, services] = await prisma.$transaction([
      prisma.service.count({ where }),
      prisma.service.findMany({
        where,
        include: serviceDetailInclude,
        orderBy: { name: "asc" },
        skip,
        take: pageSize,
      }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return res.json({
      data: services,
      pagination: {
        page,
        pageSize,
        totalItems: total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    return handlePrismaError(error, res, "listServices");
  }
}

/**
 * GET /services/:id
 * Auth required. Returns a single service with full relations.
 * Non-admin/manager users are scoped to their office.
 */
export async function getService(
  req: AuthRequest,
  res: Response,
): Promise<Response | void> {
  try {
    const id = req.params["id"] as string;

    const service = await prisma.service.findUnique({
      where: { id },
      include: serviceDetailInclude,
    });

    if (!service) {
      return res
        .status(404)
        .json({ error: "NotFound", message: "Service not found." });
    }

    // Office membership alone decides this, for every role. A manager used to
    // be waved through unconditionally, which let one read any office's
    // service by guessing its id — the list is scoped, so the single-record
    // read must be too. Administrators still pass, via canAccessOffice.
    if (!canAccessOffice(req, service.officeId)) {
      return res
        .status(403)
        .json({ error: "Forbidden", message: "You do not have access to this service." });
    }

    return res.json({ data: service });
  } catch (error) {
    return handlePrismaError(error, res, "getService", "Service not found.");
  }
}

/**
 * POST /services
 * Auth required. Admin or Manager only.
 * Admins must supply officeId; Managers are auto-scoped to their office.
 */
export async function createService(
  req: AuthRequest,
  res: Response,
): Promise<Response | void> {
  try {
    if (!req.isAdmin && !req.isManager) {
      return res.status(403).json({
        error: "Forbidden",
        message: "Only admins and managers can create services.",
      });
    }

    const validation = createServiceSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json(buildValidationError(validation.error));
    }

    const { name, description, timeToTake, officeId: requestedOfficeId, requirements, serviceFors } =
      validation.data;

    // Resolve the target office
    let resolvedOfficeId: string;
    if (req.isAdmin) {
      if (!requestedOfficeId) {
        return res.status(400).json({
          error: "ValidationError",
          message: "officeId is required.",
        });
      }
      resolvedOfficeId = requestedOfficeId;
    } else {
      // Manager: always scoped to their own office
      const myOfficeId = getMyOfficeId(req);
      if (!myOfficeId) {
        return res.status(403).json({
          error: "Forbidden",
          message: "You are not assigned to any office.",
        });
      }
      resolvedOfficeId = myOfficeId;
    }

    // Verify the office exists and is active
    const office = await prisma.office.findUnique({
      where: { id: resolvedOfficeId },
      select: { id: true, status: true },
    });

    if (!office) {
      return res.status(404).json({ error: "NotFound", message: "Office not found." });
    }
    if (!office.status) {
      return res.status(400).json({
        error: "ValidationError",
        message: "Cannot create services for an inactive office.",
      });
    }

    const service = await prisma.service.create({
      data: {
        name,
        description,
        timeToTake,
        officeId: resolvedOfficeId,
        ...(requirements !== undefined
          ? {
              requirements: {
                create: requirements.map((r) => ({
                  name: r.name,
                  ...(r.description !== undefined ? { description: r.description } : {}),
                })),
              },
            }
          : {}),
        ...(serviceFors !== undefined
          ? {
              serviceFors: {
                create: serviceFors.map((sf) => ({
                  name: sf.name,
                  ...(sf.description !== undefined ? { description: sf.description } : {}),
                })),
              },
            }
          : {}),
      },
      include: serviceDetailInclude,
    });

    return res.status(201).json({ data: service });
  } catch (error) {
    return handlePrismaError(error, res, "createService", "Service not found.");
  }
}

/**
 * PUT /services/:id
 * Auth required. Admin or Manager only, scoped to their office.
 * Providing requirements or serviceFors replaces all existing entries.
 */
export async function updateService(
  req: AuthRequest,
  res: Response,
): Promise<Response | void> {
  try {
    if (!req.isAdmin && !req.isManager) {
      return res.status(403).json({
        error: "Forbidden",
        message: "Only admins and managers can update services.",
      });
    }

    const id = req.params["id"] as string;
    const validation = updateServiceSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json(buildValidationError(validation.error));
    }

    // Verify service exists and actor can access its office
    const existing = await prisma.service.findUnique({
      where: { id },
      select: { id: true, officeId: true },
    });

    if (!existing) {
      return res
        .status(404)
        .json({ error: "NotFound", message: "Service not found." });
    }
    if (!canAccessOffice(req, existing.officeId)) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You cannot update services for this office.",
      });
    }

    const { name, description, timeToTake, requirements, serviceFors } =
      validation.data;

    const service = await prisma.service.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(timeToTake !== undefined ? { timeToTake } : {}),
        ...(requirements !== undefined
          ? {
              requirements: {
                deleteMany: {},
                create: requirements.map((r) => ({
                  name: r.name,
                  ...(r.description !== undefined ? { description: r.description } : {}),
                })),
              },
            }
          : {}),
        ...(serviceFors !== undefined
          ? {
              serviceFors: {
                deleteMany: {},
                create: serviceFors.map((sf) => ({
                  name: sf.name,
                  ...(sf.description !== undefined ? { description: sf.description } : {}),
                })),
              },
            }
          : {}),
      },
      include: serviceDetailInclude,
    });

    return res.json({ data: service });
  } catch (error) {
    return handlePrismaError(error, res, "updateService", "Service not found.");
  }
}

/**
 * DELETE /services/:id
 * Auth required. Admin only.
 * Cascades to requirements, serviceFors, and staff assignments via Prisma schema.
 */
export async function deleteService(
  req: AuthRequest,
  res: Response,
): Promise<Response | void> {
  try {
    const id = req.params["id"] as string;

    await prisma.service.delete({ where: { id } });

    return res.status(204).send();
  } catch (error) {
    return handlePrismaError(error, res, "deleteService", "Service not found.");
  }
}

/**
 * POST /services/:id/staff
 * Auth required. Admin or Manager only.
 * Staff must belong to the same office as the service.
 */
/**
 * GET /services/:id/staff
 * Auth required. Admin or Manager only.
 *
 * The mirror of `GET /staff/:id/services`: every staff member of the service's
 * office, each flagged with whether they already hold this service, so the
 * picker can render its toggles from one call. Scoped to that one office
 * because `assignStaff` refuses anything else — offering a name that cannot be
 * assigned would only be offering an error.
 */
export async function listServiceStaff(
  req: AuthRequest,
  res: Response,
): Promise<Response | void> {
  try {
    if (!req.isAdmin && !req.isManager) {
      return res.status(403).json({
        error: "Forbidden",
        message: "Only admins and managers can assign staff to services.",
      });
    }

    const serviceId = req.params["id"] as string;

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: { id: true, officeId: true, office: { select: { name: true } } },
    });

    if (!service) {
      return res
        .status(404)
        .json({ error: "NotFound", message: "Service not found." });
    }
    if (!canAccessOffice(req, service.officeId)) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You cannot manage this service.",
      });
    }

    const [officeStaff, assignments] = await Promise.all([
      prisma.staff.findMany({
        where: { officeId: service.officeId },
        select: {
          id: true,
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              firstName: true,
              fatherName: true,
              lastName: true,
              isActive: true,
              role: { select: { id: true, name: true } },
            },
          },
        },
      }),
      prisma.serviceStaffAssignment.findMany({
        where: { serviceId },
        select: { staffId: true },
      }),
    ]);

    const assignedStaffIds = new Set(assignments.map((a) => a.staffId));

    const staff = officeStaff
      .map((member) => ({
        id: member.id,
        name:
          [member.user.firstName, member.user.fatherName, member.user.lastName]
            .map((part) => (part ?? "").trim())
            .filter(Boolean)
            .join(" ") ||
          member.user.name ||
          member.user.username,
        username: member.user.username,
        roleName: member.user.role?.name ?? "",
        isActive: member.user.isActive,
        isAssigned: assignedStaffIds.has(member.id),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return res.json({
      data: {
        serviceId: service.id,
        officeId: service.officeId,
        officeName: service.office?.name ?? "",
        staff,
        assignedCount: assignedStaffIds.size,
        totalCount: staff.length,
      },
    });
  } catch (error) {
    return handlePrismaError(error, res, "listServiceStaff");
  }
}

export async function assignStaff(
  req: AuthRequest,
  res: Response,
): Promise<Response | void> {
  try {
    if (!req.isAdmin && !req.isManager) {
      return res.status(403).json({
        error: "Forbidden",
        message: "Only admins and managers can assign staff to services.",
      });
    }

    const serviceId = req.params["id"] as string;
    const validation = assignStaffSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json(buildValidationError(validation.error));
    }

    const { staffId } = validation.data;

    const [service, staff] = await Promise.all([
      prisma.service.findUnique({
        where: { id: serviceId },
        select: { id: true, officeId: true },
      }),
      prisma.staff.findUnique({
        where: { id: staffId },
        select: { id: true, officeId: true },
      }),
    ]);

    if (!service) {
      return res
        .status(404)
        .json({ error: "NotFound", message: "Service not found." });
    }
    if (!canAccessOffice(req, service.officeId)) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You cannot manage this service.",
      });
    }
    if (!staff) {
      return res
        .status(404)
        .json({ error: "NotFound", message: "Staff member not found." });
    }
    if (staff.officeId !== service.officeId) {
      return res.status(400).json({
        error: "ValidationError",
        message: "Staff member must belong to the same office as the service.",
      });
    }

    const assignment = await prisma.serviceStaffAssignment.create({
      data: { serviceId, staffId },
      select: staffAssignmentSelect,
    });

    return res.status(201).json({ data: assignment });
  } catch (error) {
    return handlePrismaError(error, res, "assignStaff");
  }
}

/**
 * DELETE /services/:id/staff/:staffId
 * Auth required. Admin or Manager only.
 */
export async function removeStaff(
  req: AuthRequest,
  res: Response,
): Promise<Response | void> {
  try {
    if (!req.isAdmin && !req.isManager) {
      return res.status(403).json({
        error: "Forbidden",
        message: "Only admins and managers can remove staff from services.",
      });
    }

    const serviceId = req.params["id"] as string;
    const staffId = req.params["staffId"] as string;

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: { id: true, officeId: true },
    });

    if (!service) {
      return res
        .status(404)
        .json({ error: "NotFound", message: "Service not found." });
    }
    if (!canAccessOffice(req, service.officeId)) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You cannot manage this service.",
      });
    }

    await prisma.serviceStaffAssignment.delete({
      where: { serviceId_staffId: { serviceId, staffId } },
    });

    return res.status(204).send();
  } catch (error) {
    return handlePrismaError(
      error,
      res,
      "removeStaff",
      "Staff assignment not found.",
    );
  }
}
