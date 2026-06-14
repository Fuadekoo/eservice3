import type { Response } from "express";
import { Prisma } from "../lib/prisma-client.js";
import { hash } from "bcryptjs";

import type { AuthRequest } from "../middleware/auth.js";
import {
  canAccessOffice,
  getScopedOfficeId,
  requestHasOfficeWideAccess,
} from "../helper/myOffice.js";
import { prisma } from "../lib/db.js";
import {
  createStaffSchema,
  updateStaffSchema,
  buildValidationError,
} from "../validators/staff.validator.js";
import {
  getEthiopianMobilePhoneCandidates,
  normalizeEthiopianMobilePhone,
} from "../utils/phone.js";

// ─── Query / param helpers ────────────────────────────────────────────────────

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

function normalizeString(value?: string | null): string | undefined {
  const normalized = value?.trim();
  return normalized || undefined;
}

function getRequestedOfficeId(req: AuthRequest): string | undefined {
  const fromBody =
    req.body != null && typeof req.body.officeId === "string"
      ? (req.body.officeId as string)
      : undefined;
  const fromQuery = parseQueryString(req.query["officeId"]);
  return normalizeString(fromBody ?? fromQuery);
}

function getNormalizedPhone(input: {
  phone?: string | undefined;
  phoneNumber?: string | undefined;
}): string | undefined {
  const rawPhone = normalizeString(input.phoneNumber ?? input.phone);
  if (!rawPhone) return undefined;
  return normalizeEthiopianMobilePhone(rawPhone) ?? rawPhone;
}

/**
 * Parses ?status= query param into a boolean filter value.
 * Returns `null` when the value is present but unrecognized (caller should 400).
 */
function parseActiveFilter(value: unknown): boolean | undefined | null {
  if (typeof value !== "string") return undefined;
  const s = value.trim().toLowerCase();
  if (!s) return undefined;
  if (s === "true" || s === "1" || s === "active" || s === "enabled")
    return true;
  if (s === "false" || s === "0" || s === "inactive" || s === "disabled")
    return false;
  return null;
}

// ─── Prisma include / response shaping ───────────────────────────────────────

const staffInclude = {
  office: {
    select: { id: true, name: true, status: true },
  },
  serviceAssignments: {
    select: { serviceId: true },
  },
  user: {
    select: {
      id: true,
      username: true,
      name: true,
      firstName: true,
      fatherName: true,
      lastName: true,
      gender: true,
      status: true,
      phoneNumber: true,
      isActive: true,
      phoneVerified: true,
      roleId: true,
      createdAt: true,
      updatedAt: true,
      role: {
        select: {
          id: true,
          name: true,
          officeId: true,
          rolePermissions: {
            select: {
              permission: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  },
} as const;

type StaffRecord = NonNullable<Awaited<ReturnType<typeof findStaffRecord>>>;

function buildStaffResponse(staff: StaffRecord) {
  return {
    id: staff.id,
    officeId: staff.officeId,
    createdAt: staff.createdAt,
    updatedAt: staff.updatedAt,
    office: staff.office,
    assignedServicesCount: staff.serviceAssignments?.length ?? 0,
    user: {
      id: staff.user.id,
      username: staff.user.username,
      name: staff.user.name,
      firstName: staff.user.firstName,
      fatherName: staff.user.fatherName,
      lastName: staff.user.lastName,
      gender: staff.user.gender,
      status: staff.user.status,
      phone: staff.user.phoneNumber,
      phoneNumber: staff.user.phoneNumber,
      isActive: staff.user.isActive,
      phoneVerified: staff.user.phoneVerified,
      roleId: staff.user.roleId ?? null,
      createdAt: staff.user.createdAt,
      updatedAt: staff.user.updatedAt,
    },
    // Adding top-level fields for convenience
    name:
      staff.user.name ||
      [staff.user.firstName, staff.user.fatherName, staff.user.lastName]
        .filter(Boolean)
        .join(" ") ||
      staff.user.username,
    firstName: staff.user.firstName,
    fatherName: staff.user.fatherName,
    lastName: staff.user.lastName,
    phone: staff.user.phoneNumber,
    username: staff.user.username,
    gender: staff.user.gender,
    status: staff.user.status,
    role: staff.user.role
      ? {
          id: staff.user.role.id,
          name: staff.user.role.name,
          officeId: staff.user.role.officeId ?? null,
        }
      : null,
    permissions:
      staff.user.role?.rolePermissions.map((rp) => ({
        id: rp.permission.id,
        name: rp.permission.name,
      })) ?? [],
  };
}

// ─── Database helpers ─────────────────────────────────────────────────────────

async function findStaffRecord(id: string) {
  return prisma.staff.findFirst({
    where: { OR: [{ id }, { userId: id }] },
    orderBy: [{ createdAt: "asc" }],
    include: staffInclude,
  });
}

async function ensureOfficeExists(officeId: string) {
  return prisma.office.findUnique({
    where: { id: officeId },
    select: { id: true, name: true, status: true },
  });
}

/**
 * Looks up an existing role by id or name, or creates one scoped to the office.
 * Must run inside a Prisma transaction.
 */
async function resolveRoleId(
  tx: Prisma.TransactionClient,
  officeId: string,
  input: { roleId?: string | undefined; roleName?: string | undefined },
): Promise<string> {
  const normalizedRoleId = normalizeString(input.roleId);
  if (normalizedRoleId) {
    const role = await tx.role.findUnique({
      where: { id: normalizedRoleId },
      select: { id: true, officeId: true },
    });
    if (!role) throw new Error("Role not found.");
    if (role.officeId && role.officeId !== officeId) {
      throw new Error("Role belongs to a different office.");
    }
    return role.id;
  }

  const normalizedRoleName = normalizeString(input.roleName);
  if (!normalizedRoleName)
    throw new Error("Either roleId or roleName is required.");

  // Prefer an office-scoped role, fall back to a global role, else create.
  const existing =
    (await tx.role.findFirst({
      where: { name: normalizedRoleName, officeId },
      select: { id: true },
    })) ??
    (await tx.role.findFirst({
      where: { name: normalizedRoleName, officeId: null },
      select: { id: true },
    }));

  if (existing) return existing.id;

  const created = await tx.role.create({
    data: { name: normalizedRoleName, officeId },
    select: { id: true },
  });
  return created.id;
}

// ─── Access-control guards ────────────────────────────────────────────────────

/**
 * Verifies the actor can target `scopedOfficeId`.
 * Writes 403 and returns false when denied; returns true when allowed.
 */
function ensureRequestOfficeAccess(
  req: AuthRequest,
  res: Response,
  requestedOfficeId: string | undefined,
  scopedOfficeId: string | undefined,
): boolean {
  const hasWideAccess = requestHasOfficeWideAccess(req);

  if (!hasWideAccess && !scopedOfficeId) {
    res.status(403).json({
      error: "Forbidden",
      message: "Your account is not assigned to an office.",
    });
    return false;
  }

  if (
    requestedOfficeId &&
    !hasWideAccess &&
    scopedOfficeId &&
    requestedOfficeId !== scopedOfficeId
  ) {
    res.status(403).json({
      error: "Forbidden",
      message: "You do not have access to the requested office.",
    });
    return false;
  }

  return true;
}

/**
 * Verifies the actor can access the given staff record's office.
 * Writes 403 and returns false when denied; returns true when allowed.
 */
function ensureStaffAccess(
  req: AuthRequest,
  res: Response,
  staff: StaffRecord,
): boolean {
  if (canAccessOffice(req, staff.officeId)) return true;
  res.status(403).json({
    error: "Forbidden",
    message: "You do not have permission to access this staff member.",
  });
  return false;
}

// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * GET /staff
 * Auth required. Paginated + filterable list of staff, scoped to the actor's office.
 * Query params: page, pageSize, search, status, roleId, officeId
 */
export async function listStaff(
  req: AuthRequest,
  res: Response,
): Promise<Response | void> {
  try {
    const requestedOfficeId = getRequestedOfficeId(req);
    const scopedOfficeId = getScopedOfficeId(req, requestedOfficeId);

    if (
      !ensureRequestOfficeAccess(req, res, requestedOfficeId, scopedOfficeId)
    ) {
      return;
    }

    const search = parseQueryString(req.query["search"]);
    const roleIdFilter = parseQueryString(req.query["roleId"]);
    const page = Math.max(1, parseQueryInt(req.query["page"], 1));
    const pageSize = Math.min(
      100,
      Math.max(1, parseQueryInt(req.query["pageSize"], 50)),
    );
    const skip = (page - 1) * pageSize;

    const isActiveFilter = parseActiveFilter(req.query["status"]);
    if (isActiveFilter === null) {
      return res.status(400).json({
        error: "ValidationError",
        message:
          "Invalid status filter. Use: active, inactive, true, false, 1, or 0.",
      });
    }

    const filters: Prisma.staffWhereInput[] = [];

    if (scopedOfficeId) {
      filters.push({ officeId: scopedOfficeId });
    }
    if (search) {
      filters.push({
        OR: [
          { user: { is: { username: { contains: search } } } },
          { user: { is: { phoneNumber: { contains: search } } } },
          { office: { is: { name: { contains: search } } } },
          { user: { is: { role: { is: { name: { contains: search } } } } } },
        ],
      });
    }
    if (isActiveFilter !== undefined) {
      filters.push({ user: { is: { isActive: isActiveFilter } } });
    }
    if (roleIdFilter) {
      filters.push({ user: { is: { roleId: roleIdFilter } } });
    }

    const where: Prisma.staffWhereInput =
      filters.length > 0 ? { AND: filters } : {};

    const [staffMembers, total] = await Promise.all([
      prisma.staff.findMany({
        where,
        include: staffInclude,
        orderBy: [{ createdAt: "desc" }],
        skip,
        take: pageSize,
      }),
      prisma.staff.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return res.json({
      data: staffMembers.map(buildStaffResponse),
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
    console.error("[listStaff] Error:", error);
    return res.status(500).json({
      error: "InternalServerError",
      message: "Unable to fetch staff.",
    });
  }
}

/**
 * GET /staff/:id
 * Auth required. Looks up a staff record by staff id or user id.
 */
export async function getStaff(
  req: AuthRequest,
  res: Response,
): Promise<Response | void> {
  try {
    const id = req.params["id"] as string;

    const staff = await findStaffRecord(id);
    if (!staff) {
      return res.status(404).json({
        error: "NotFound",
        message: `Staff member with id '${id}' was not found.`,
      });
    }

    if (!ensureStaffAccess(req, res, staff)) return;

    return res.json({ data: buildStaffResponse(staff) });
  } catch (error) {
    console.error("[getStaff] Error:", error);
    return res.status(500).json({
      error: "InternalServerError",
      message: "Unable to fetch staff member.",
    });
  }
}

/**
 * POST /staff
 * Auth required. Creates a User + Staff assignment atomically.
 * Admins may specify any officeId; non-wide-access actors are auto-scoped to their office.
 */
export async function createStaff(
  req: AuthRequest,
  res: Response,
): Promise<Response | void> {
  try {
    const parsed = createStaffSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(buildValidationError(parsed.error));
    }

    const requestedOfficeId =
      normalizeString(parsed.data.officeId) ?? getRequestedOfficeId(req);
    const scopedOfficeId = getScopedOfficeId(req, requestedOfficeId);

    if (
      !ensureRequestOfficeAccess(req, res, requestedOfficeId, scopedOfficeId)
    ) {
      return;
    }

    if (!scopedOfficeId) {
      return res.status(400).json({
        error: "ValidationError",
        message: "officeId is required.",
      });
    }

    const office = await ensureOfficeExists(scopedOfficeId);
    if (!office) {
      return res
        .status(404)
        .json({ error: "NotFound", message: "Office not found." });
    }

    const phoneNumber = getNormalizedPhone(parsed.data);
    const phoneCandidates = phoneNumber
      ? getEthiopianMobilePhoneCandidates(phoneNumber)
      : [];
    if (!phoneNumber) {
      return res.status(400).json({
        error: "ValidationError",
        message: "Phone number is required.",
      });
    }

    const createdStaff = await prisma.$transaction(async (tx) => {
      // Fail fast on duplicate username or phone before hashing
      const collision = await tx.user.findFirst({
        where: {
          OR: [
            { username: parsed.data.username },
            { phoneNumber: { in: phoneCandidates } },
          ],
        },
        select: { username: true, phoneNumber: true },
      });

      if (collision) {
        throw new Error(
          collision.username === parsed.data.username
            ? "Username already exists."
            : "Phone number already exists.",
        );
      }

      const resolvedRoleId = await resolveRoleId(tx, scopedOfficeId, {
        roleId: parsed.data.roleId,
        roleName: parsed.data.roleName,
      });

      const newUser = await tx.user.create({
        data: {
          username: parsed.data.username,
          firstName: parsed.data.firstName,
          fatherName: parsed.data.fatherName,
          lastName: parsed.data.lastName,
          name: parsed.data.name,
          gender: parsed.data.gender as any,
          status: parsed.data.status as any,
          phoneNumber,
          password: await hash(parsed.data.password, 10),
          roleId: resolvedRoleId,
          isActive:
            parsed.data.isActive ??
            (parsed.data.status === "INACTIVE" ||
            parsed.data.status === "BLOCKED"
              ? false
              : true),
          phoneVerified: parsed.data.phoneVerified ?? false,
        },
        select: { id: true },
      });

      return tx.staff.create({
        data: { userId: newUser.id, officeId: scopedOfficeId },
        include: staffInclude,
      });
    });

    return res.status(201).json({ data: buildStaffResponse(createdStaff) });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return res.status(409).json({
          error: "Conflict",
          message: "Username or phone number already exists.",
        });
      }
    }

    const msg = error instanceof Error ? error.message : "";
    if (
      msg === "Username already exists." ||
      msg === "Phone number already exists."
    ) {
      return res.status(409).json({ error: "Conflict", message: msg });
    }
    if (msg === "Role not found.") {
      return res.status(404).json({ error: "NotFound", message: msg });
    }
    if (
      msg === "Role belongs to a different office." ||
      msg === "Either roleId or roleName is required."
    ) {
      return res.status(400).json({ error: "ValidationError", message: msg });
    }

    console.error("[createStaff] Error:", error);
    return res.status(500).json({
      error: "InternalServerError",
      message: "Unable to create staff member.",
    });
  }
}

/**
 * PUT /staff/:id
 * Auth required. Updates the User record and/or office assignment atomically.
 * Providing a new officeId reassigns the staff member (subject to office-scope rules).
 */
export async function updateStaff(
  req: AuthRequest,
  res: Response,
): Promise<Response | void> {
  try {
    const id = req.params["id"] as string;

    const parsed = updateStaffSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(buildValidationError(parsed.error));
    }

    const existing = await findStaffRecord(id);
    if (!existing) {
      return res.status(404).json({
        error: "NotFound",
        message: `Staff member with id '${id}' was not found.`,
      });
    }

    if (!ensureStaffAccess(req, res, existing)) return;

    // Resolve target office (may be a reassignment)
    const requestedOfficeId =
      normalizeString(parsed.data.officeId) ?? getRequestedOfficeId(req);
    const scopedRequestedOfficeId = requestedOfficeId
      ? getScopedOfficeId(req, requestedOfficeId)
      : undefined;

    if (
      !ensureRequestOfficeAccess(
        req,
        res,
        requestedOfficeId,
        scopedRequestedOfficeId,
      )
    ) {
      return;
    }

    const targetOfficeId = scopedRequestedOfficeId ?? existing.officeId;

    const office = await ensureOfficeExists(targetOfficeId);
    if (!office) {
      return res
        .status(404)
        .json({ error: "NotFound", message: "Office not found." });
    }

    // Pre-check for collisions before entering the transaction
    const phoneNumber = getNormalizedPhone(parsed.data);
    if (phoneNumber || parsed.data.username) {
      const phoneCandidates = phoneNumber
        ? getEthiopianMobilePhoneCandidates(phoneNumber)
        : [];
      const collision = await prisma.user.findFirst({
        where: {
          id: { not: existing.user.id },
          OR: [
            ...(parsed.data.username
              ? [{ username: parsed.data.username }]
              : []),
            ...(phoneNumber ? [{ phoneNumber: { in: phoneCandidates } }] : []),
          ],
        },
        select: { username: true, phoneNumber: true },
      });

      if (collision) {
        return res.status(409).json({
          error: "Conflict",
          message:
            collision.username === parsed.data.username
              ? "Username already exists."
              : "Phone number already exists.",
        });
      }
    }

    const updatedStaff = await prisma.$transaction(async (tx) => {
      let resolvedRoleId: string | undefined;
      if (parsed.data.roleId || parsed.data.roleName) {
        resolvedRoleId = await resolveRoleId(tx, targetOfficeId, {
          roleId: parsed.data.roleId,
          roleName: parsed.data.roleName,
        });
      }

      const userData: Prisma.UserUpdateInput = {
        ...(parsed.data.username !== undefined
          ? { username: parsed.data.username }
          : {}),
        ...(parsed.data.firstName !== undefined
          ? { firstName: parsed.data.firstName }
          : {}),
        ...(parsed.data.fatherName !== undefined
          ? { fatherName: parsed.data.fatherName }
          : {}),
        ...(parsed.data.lastName !== undefined
          ? { lastName: parsed.data.lastName }
          : {}),
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
        ...(parsed.data.gender !== undefined
          ? { gender: parsed.data.gender as any }
          : {}),
        ...(parsed.data.status !== undefined
          ? { status: parsed.data.status as any }
          : {}),
        ...(phoneNumber !== undefined ? { phoneNumber } : {}),
        ...(parsed.data.isActive !== undefined
          ? { isActive: parsed.data.isActive }
          : parsed.data.status !== undefined
            ? {
                isActive: !(
                  parsed.data.status === "INACTIVE" ||
                  parsed.data.status === "BLOCKED"
                ),
              }
            : {}),
        ...(parsed.data.phoneVerified !== undefined
          ? { phoneVerified: parsed.data.phoneVerified }
          : {}),
        ...(resolvedRoleId !== undefined ? { roleId: resolvedRoleId } : {}),
        ...(parsed.data.password !== undefined
          ? { password: await hash(parsed.data.password, 10) }
          : {}),
      };

      if (Object.keys(userData).length > 0) {
        await tx.user.update({
          where: { id: existing.user.id },
          data: userData,
        });
      }

      if (targetOfficeId !== existing.officeId) {
        await tx.staff.update({
          where: { id: existing.id },
          data: { officeId: targetOfficeId },
        });
      }

      return tx.staff.findUniqueOrThrow({
        where: { id: existing.id },
        include: staffInclude,
      });
    });

    return res.json({ data: buildStaffResponse(updatedStaff) });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return res.status(404).json({
          error: "NotFound",
          message: `Staff member with id '${req.params["id"]}' was not found.`,
        });
      }
      if (error.code === "P2002") {
        return res.status(409).json({
          error: "Conflict",
          message: "Username or phone number already exists.",
        });
      }
    }

    const msg = error instanceof Error ? error.message : "";
    if (msg === "Role not found.") {
      return res.status(404).json({ error: "NotFound", message: msg });
    }
    if (
      msg === "Role belongs to a different office." ||
      msg === "Either roleId or roleName is required."
    ) {
      return res.status(400).json({ error: "ValidationError", message: msg });
    }

    console.error("[updateStaff] Error:", error);
    return res.status(500).json({
      error: "InternalServerError",
      message: "Unable to update staff member.",
    });
  }
}

/**
 * DELETE /staff/:id
 * Auth required. Removes the staff assignment.
 * If this is the user's only office assignment the User record is also deleted (via transaction).
 */
export async function deleteStaff(
  req: AuthRequest,
  res: Response,
): Promise<Response | void> {
  try {
    const id = req.params["id"] as string;

    const staff = await findStaffRecord(id);
    if (!staff) {
      return res.status(404).json({
        error: "NotFound",
        message: `Staff member with id '${id}' was not found.`,
      });
    }

    if (!ensureStaffAccess(req, res, staff)) return;

    await prisma.$transaction(async (tx) => {
      const remainingAssignments = await tx.staff.count({
        where: { userId: staff.user.id, id: { not: staff.id } },
      });

      if (remainingAssignments > 0) {
        // User still belongs to other offices — remove only this assignment
        await tx.staff.delete({ where: { id: staff.id } });
      } else {
        // Last assignment — delete the user (cascades to the staff record)
        await tx.user.delete({ where: { id: staff.user.id } });
      }
    });

    return res.status(204).send();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return res.status(404).json({
          error: "NotFound",
          message: `Staff member with id '${req.params["id"]}' was not found.`,
        });
      }
      if (error.code === "P2003") {
        return res.status(409).json({
          error: "Conflict",
          message: "Cannot delete: related records still exist.",
        });
      }
    }

    console.error("[deleteStaff] Error:", error);
    return res.status(500).json({
      error: "InternalServerError",
      message: "Unable to delete staff member.",
    });
  }
}

// ─── Staff Service Assignment Controllers ────────────────────────────────────

/**
 * GET /staff/:id/services
 * Auth required. Returns all services assigned to a staff member,
 * plus all available services for the staff member's office (for toggle UI).
 */
export async function getStaffServices(
  req: AuthRequest,
  res: Response,
): Promise<Response | void> {
  try {
    const id = req.params["id"] as string;

    const staff = await findStaffRecord(id);
    if (!staff) {
      return res.status(404).json({
        error: "NotFound",
        message: `Staff member with id '${id}' was not found.`,
      });
    }

    if (!ensureStaffAccess(req, res, staff)) return;

    // Get all services for the staff member's office
    const allServices = await prisma.service.findMany({
      where: { officeId: staff.officeId },
      select: {
        id: true,
        name: true,
        description: true,
        timeToTake: true,
      },
      orderBy: { name: "asc" },
    });

    // Get currently assigned service IDs
    const assignments = await prisma.serviceStaffAssignment.findMany({
      where: { staffId: staff.id },
      select: { serviceId: true },
    });

    const assignedServiceIds = new Set(assignments.map((a) => a.serviceId));

    const services = allServices.map((service) => ({
      ...service,
      isAssigned: assignedServiceIds.has(service.id),
    }));

    return res.json({
      data: {
        staffId: staff.id,
        staffName:
          staff.user.name ||
          [staff.user.firstName, staff.user.fatherName, staff.user.lastName]
            .filter(Boolean)
            .join(" ") ||
          staff.user.username,
        officeId: staff.officeId,
        officeName: staff.office.name,
        services,
        assignedCount: assignedServiceIds.size,
        totalCount: allServices.length,
      },
    });
  } catch (error) {
    console.error("[getStaffServices] Error:", error);
    return res.status(500).json({
      error: "InternalServerError",
      message: "Unable to fetch staff services.",
    });
  }
}

/**
 * PUT /staff/:id/services
 * Auth required. Bulk-sync service assignments for a staff member.
 * Body: { serviceIds: string[] }
 * Replaces all current assignments with the provided list.
 */
export async function syncStaffServices(
  req: AuthRequest,
  res: Response,
): Promise<Response | void> {
  try {
    if (!req.isAdmin && !req.isManager) {
      return res.status(403).json({
        error: "Forbidden",
        message: "Only admins and managers can manage service assignments.",
      });
    }

    const id = req.params["id"] as string;
    const { serviceIds } = req.body;

    if (!Array.isArray(serviceIds)) {
      return res.status(400).json({
        error: "ValidationError",
        message: "serviceIds must be an array of strings.",
      });
    }

    const staff = await findStaffRecord(id);
    if (!staff) {
      return res.status(404).json({
        error: "NotFound",
        message: `Staff member with id '${id}' was not found.`,
      });
    }

    if (!ensureStaffAccess(req, res, staff)) return;

    // Verify all services belong to the same office
    if (serviceIds.length > 0) {
      const validServices = await prisma.service.count({
        where: {
          id: { in: serviceIds },
          officeId: staff.officeId,
        },
      });

      if (validServices !== serviceIds.length) {
        return res.status(400).json({
          error: "ValidationError",
          message:
            "One or more services do not exist or belong to a different office.",
        });
      }
    }

    // Replace all assignments atomically
    await prisma.$transaction(async (tx) => {
      // Remove all current assignments
      await tx.serviceStaffAssignment.deleteMany({
        where: { staffId: staff.id },
      });

      // Create new assignments
      if (serviceIds.length > 0) {
        await tx.serviceStaffAssignment.createMany({
          data: serviceIds.map((serviceId: string) => ({
            serviceId,
            staffId: staff.id,
          })),
        });
      }
    });

    return res.json({
      data: {
        staffId: staff.id,
        assignedServiceIds: serviceIds,
        message: `Successfully updated service assignments. ${serviceIds.length} service(s) assigned.`,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return res.status(409).json({
          error: "Conflict",
          message: "Duplicate service assignment detected.",
        });
      }
    }

    console.error("[syncStaffServices] Error:", error);
    return res.status(500).json({
      error: "InternalServerError",
      message: "Unable to update service assignments.",
    });
  }
}
