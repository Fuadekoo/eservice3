import type { Response } from "express";
import { Prisma } from "../lib/prisma-client.js";
import { hash } from "bcryptjs";
import { z } from "zod";

import type { AuthRequest } from "../middleware/auth.js";
import {
  canAccessOffice,
  getScopedOfficeId,
  requestHasOfficeWideAccess,
} from "../helper/myOffice.js";
import { prisma } from "../lib/db.js";
import { buildValidationError } from "../validators/security.validator.js";

const createStaffSchema = z
  .object({
    username: z.string().trim().min(1, "Username is required."),
    phone: z.string().trim().min(1, "Phone number is required.").optional(),
    phoneNumber: z
      .string()
      .trim()
      .min(1, "Phone number is required.")
      .optional(),
    password: z.string().min(6, "Password must be at least 6 characters."),
    roleId: z.string().trim().min(1).optional(),
    roleName: z.string().trim().min(1).optional(),
    officeId: z.string().trim().min(1).optional(),
    isActive: z.boolean().optional(),
    phoneVerified: z.boolean().optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.phone && !value.phoneNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Phone number is required.",
        path: ["phoneNumber"],
      });
    }

    if (!value.roleId && !value.roleName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Either roleId or roleName is required.",
        path: ["roleId"],
      });
    }
  });

const updateStaffSchema = z
  .object({
    username: z.string().trim().min(1, "Username is required.").optional(),
    phone: z.string().trim().min(1, "Phone number is required.").optional(),
    phoneNumber: z
      .string()
      .trim()
      .min(1, "Phone number is required.")
      .optional(),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters.")
      .optional(),
    roleId: z.string().trim().min(1).optional(),
    roleName: z.string().trim().min(1).optional(),
    officeId: z.string().trim().min(1).optional(),
    isActive: z.boolean().optional(),
    phoneVerified: z.boolean().optional(),
  })
  .refine(
    (value) =>
      Object.values(value).some((entry) => entry !== undefined && entry !== ""),
    {
      message: "Provide at least one field to update.",
      path: [],
    },
  );

const staffInclude = {
  office: {
    select: {
      id: true,
      name: true,
      status: true,
    },
  },
  user: {
    select: {
      id: true,
      username: true,
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
              permission: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  },
} as const;

type StaffRecord = NonNullable<Awaited<ReturnType<typeof findStaffRecord>>>;
type CreateStaffInput = z.infer<typeof createStaffSchema>;
type UpdateStaffInput = z.infer<typeof updateStaffSchema>;

function normalizeString(value?: string | null): string | undefined {
  const normalized = value?.trim();
  return normalized || undefined;
}

function getRequestedOfficeId(req: AuthRequest): string | undefined {
  const officeIdFromBody =
    req.body && typeof req.body.officeId === "string"
      ? req.body.officeId
      : undefined;
  const officeIdFromQuery =
    typeof req.query.officeId === "string" ? req.query.officeId : undefined;

  return normalizeString(officeIdFromBody ?? officeIdFromQuery);
}

function getNormalizedPhoneNumber(input: {
  phone?: string | undefined;
  phoneNumber?: string | undefined;
}): string | undefined {
  return normalizeString(input.phoneNumber ?? input.phone);
}

function parseActiveFilter(status: unknown): boolean | undefined | null {
  if (typeof status !== "string") {
    return undefined;
  }

  const normalized = status.trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }

  if (
    normalized === "true" ||
    normalized === "1" ||
    normalized === "active" ||
    normalized === "enabled"
  ) {
    return true;
  }

  if (
    normalized === "false" ||
    normalized === "0" ||
    normalized === "inactive" ||
    normalized === "disabled"
  ) {
    return false;
  }

  return null;
}

function buildStaffResponse(staff: StaffRecord) {
  return {
    id: staff.id,
    officeId: staff.officeId,
    createdAt: staff.createdAt,
    updatedAt: staff.updatedAt,
    office: staff.office,
    user: {
      id: staff.user.id,
      username: staff.user.username,
      phone: staff.user.phoneNumber,
      phoneNumber: staff.user.phoneNumber,
      isActive: staff.user.isActive,
      phoneVerified: staff.user.phoneVerified,
      roleId: staff.user.roleId ?? null,
      createdAt: staff.user.createdAt,
      updatedAt: staff.user.updatedAt,
    },
    role: staff.user.role
      ? {
          id: staff.user.role.id,
          name: staff.user.role.name,
          officeId: staff.user.role.officeId ?? null,
        }
      : null,
    permissions:
      staff.user.role?.rolePermissions.map((entry) => ({
        id: entry.permission.id,
        name: entry.permission.name,
      })) ?? [],
  };
}

async function findStaffRecord(id: string) {
  return prisma.staff.findFirst({
    where: {
      OR: [{ id }, { userId: id }],
    },
    orderBy: [{ createdAt: "asc" }],
    include: staffInclude,
  });
}

async function ensureOfficeExists(officeId: string) {
  return prisma.office.findUnique({
    where: { id: officeId },
    select: {
      id: true,
      name: true,
      status: true,
    },
  });
}

async function resolveRoleId(
  tx: Prisma.TransactionClient,
  officeId: string,
  input: { roleId?: string | undefined; roleName?: string | undefined },
): Promise<string> {
  const normalizedRoleId = normalizeString(input.roleId);
  if (normalizedRoleId) {
    const role = await tx.role.findUnique({
      where: { id: normalizedRoleId },
      select: {
        id: true,
        officeId: true,
      },
    });

    if (!role) {
      throw new Error("Role not found.");
    }

    if (role.officeId && role.officeId !== officeId) {
      throw new Error("Role belongs to a different office.");
    }

    return role.id;
  }

  const normalizedRoleName = normalizeString(input.roleName);
  if (!normalizedRoleName) {
    throw new Error("Either roleId or roleName is required.");
  }

  const officeRole =
    (await tx.role.findFirst({
      where: {
        name: normalizedRoleName,
        officeId,
      },
      select: {
        id: true,
      },
    })) ??
    (await tx.role.findFirst({
      where: {
        name: normalizedRoleName,
        officeId: null,
      },
      select: {
        id: true,
      },
    }));

  if (officeRole) {
    return officeRole.id;
  }

  const createdRole = await tx.role.create({
    data: {
      name: normalizedRoleName,
      officeId,
    },
    select: {
      id: true,
    },
  });

  return createdRole.id;
}

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

function ensureStaffAccess(
  req: AuthRequest,
  res: Response,
  staff: StaffRecord,
): boolean {
  if (canAccessOffice(req, staff.officeId)) {
    return true;
  }

  res.status(403).json({
    error: "Forbidden",
    message: "You do not have permission to access this staff member.",
  });
  return false;
}

/**
 * List all staff assignments.
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

    const { page = "1", pageSize = "50", search, status, roleId } = req.query;

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const pageSizeNum = Math.min(
      100,
      Math.max(1, parseInt(String(pageSize), 10) || 50),
    );
    const skip = (pageNum - 1) * pageSizeNum;
    const take = pageSizeNum;

    const filters: Prisma.staffWhereInput[] = [];
    if (scopedOfficeId) {
      filters.push({ officeId: scopedOfficeId });
    }

    if (typeof search === "string" && search.trim().length > 0) {
      const searchTerm = search.trim();
      filters.push({
        OR: [
          { user: { is: { username: { contains: searchTerm } } } },
          { user: { is: { phoneNumber: { contains: searchTerm } } } },
          { office: { is: { name: { contains: searchTerm } } } },
          {
            user: { is: { role: { is: { name: { contains: searchTerm } } } } },
          },
        ],
      });
    }

    const isActiveFilter = parseActiveFilter(status);
    if (isActiveFilter === null) {
      return res.status(400).json({
        error: "ValidationError",
        message:
          "Invalid status filter. Use active, inactive, true, false, 1, or 0.",
      });
    }
    if (isActiveFilter !== undefined) {
      filters.push({
        user: {
          is: {
            isActive: isActiveFilter,
          },
        },
      });
    }

    if (typeof roleId === "string" && roleId.trim().length > 0) {
      filters.push({
        user: {
          is: {
            roleId: roleId.trim(),
          },
        },
      });
    }

    const where: Prisma.staffWhereInput =
      filters.length > 0 ? { AND: filters } : {};

    const [staffMembers, total] = await Promise.all([
      prisma.staff.findMany({
        where,
        include: staffInclude,
        orderBy: [{ createdAt: "desc" }],
        skip,
        take,
      }),
      prisma.staff.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / pageSizeNum));

    return res.json({
      data: staffMembers.map(buildStaffResponse),
      pagination: {
        page: pageNum,
        pageSize: pageSizeNum,
        totalItems: total,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPreviousPage: pageNum > 1,
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
 * Get a single staff assignment by staff id or user id.
 */
export async function getStaff(
  req: AuthRequest,
  res: Response,
): Promise<Response | void> {
  try {
    const idParam = req.params.id;
    if (!idParam || Array.isArray(idParam)) {
      return res.status(400).json({
        error: "ValidationError",
        message: "Invalid or missing staff id.",
      });
    }
    const staff = await findStaffRecord(idParam);

    if (!staff) {
      return res.status(404).json({
        error: "NotFound",
        message: `Staff member with id '${idParam}' was not found.`,
      });
    }

    if (!ensureStaffAccess(req, res, staff)) {
      return;
    }

    return res.json({
      data: buildStaffResponse(staff),
    });
  } catch (error) {
    console.error("[getStaff] Error:", error);
    return res.status(500).json({
      error: "InternalServerError",
      message: "Unable to fetch staff member.",
    });
  }
}

/**
 * Create a new staff user and staff assignment.
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
      return res.status(404).json({
        error: "NotFound",
        message: "Office not found.",
      });
    }

    const phoneNumber = getNormalizedPhoneNumber(parsed.data);
    if (!phoneNumber) {
      return res.status(400).json({
        error: "ValidationError",
        message: "Phone number is required.",
      });
    }

    const createdStaff = await prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findFirst({
        where: {
          OR: [{ username: parsed.data.username }, { phoneNumber }],
        },
        select: {
          username: true,
          phoneNumber: true,
        },
      });

      if (existingUser) {
        throw new Error(
          existingUser.username === parsed.data.username
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
          phoneNumber,
          password: await hash(parsed.data.password, 10),
          roleId: resolvedRoleId,
          isActive: parsed.data.isActive ?? true,
          phoneVerified: parsed.data.phoneVerified ?? false,
        },
        select: {
          id: true,
        },
      });

      return tx.staff.create({
        data: {
          userId: newUser.id,
          officeId: scopedOfficeId,
        },
        include: staffInclude,
      });
    });

    return res.status(201).json({
      data: buildStaffResponse(createdStaff),
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return res.status(409).json({
          error: "Conflict",
          message: "Username or phone number already exists.",
        });
      }
    }

    const errorMessage = error instanceof Error ? error.message : "";
    if (
      errorMessage === "Username already exists." ||
      errorMessage === "Phone number already exists."
    ) {
      return res.status(409).json({
        error: "Conflict",
        message: errorMessage,
      });
    }
    if (errorMessage === "Role not found.") {
      return res.status(404).json({
        error: "NotFound",
        message: errorMessage,
      });
    }
    if (
      errorMessage === "Role belongs to a different office." ||
      errorMessage === "Either roleId or roleName is required."
    ) {
      return res.status(400).json({
        error: "ValidationError",
        message: errorMessage,
      });
    }

    console.error("[createStaff] Error:", error);
    return res.status(500).json({
      error: "InternalServerError",
      message: "Unable to create staff member.",
    });
  }
}

/**
 * Update a staff assignment or the linked user account.
 */
export async function updateStaff(
  req: AuthRequest,
  res: Response,
): Promise<Response | void> {
  try {
    const { id } = req.params;
    if (!id || typeof id !== "string") {
      return res.status(400).json({
        error: "BadRequest",
        message: "Staff id is required.",
      });
    }
    const parsed = updateStaffSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(buildValidationError(parsed.error));
    }

    const existingStaff = await findStaffRecord(id);
    if (!existingStaff) {
      return res.status(404).json({
        error: "NotFound",
        message: `Staff member with id '${id}' was not found.`,
      });
    }

    if (!ensureStaffAccess(req, res, existingStaff)) {
      return;
    }

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

    const targetOfficeId = scopedRequestedOfficeId ?? existingStaff.officeId;
    const office = await ensureOfficeExists(targetOfficeId);
    if (!office) {
      return res.status(404).json({
        error: "NotFound",
        message: "Office not found.",
      });
    }

    const phoneNumber = getNormalizedPhoneNumber(parsed.data);
    if (phoneNumber || parsed.data.username) {
      const collision = await prisma.user.findFirst({
        where: {
          id: { not: existingStaff.user.id },
          OR: [
            ...(parsed.data.username
              ? [{ username: parsed.data.username }]
              : []),
            ...(phoneNumber ? [{ phoneNumber }] : []),
          ],
        },
        select: {
          username: true,
          phoneNumber: true,
        },
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
        ...(phoneNumber !== undefined ? { phoneNumber } : {}),
        ...(parsed.data.isActive !== undefined
          ? { isActive: parsed.data.isActive }
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
          where: { id: existingStaff.user.id },
          data: userData,
        });
      }

      if (targetOfficeId !== existingStaff.officeId) {
        await tx.staff.update({
          where: { id: existingStaff.id },
          data: {
            officeId: targetOfficeId,
          },
        });
      }

      return tx.staff.findUniqueOrThrow({
        where: { id: existingStaff.id },
        include: staffInclude,
      });
    });

    return res.json({
      data: buildStaffResponse(updatedStaff),
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return res.status(404).json({
          error: "NotFound",
          message: `Staff member with id '${req.params.id}' was not found.`,
        });
      }
      if (error.code === "P2002") {
        return res.status(409).json({
          error: "Conflict",
          message: "Username or phone number already exists.",
        });
      }
    }

    const errorMessage = error instanceof Error ? error.message : "";
    if (errorMessage === "Role not found.") {
      return res.status(404).json({
        error: "NotFound",
        message: errorMessage,
      });
    }
    if (
      errorMessage === "Role belongs to a different office." ||
      errorMessage === "Either roleId or roleName is required."
    ) {
      return res.status(400).json({
        error: "ValidationError",
        message: errorMessage,
      });
    }

    console.error("[updateStaff] Error:", error);
    return res.status(500).json({
      error: "InternalServerError",
      message: "Unable to update staff member.",
    });
  }
}

/**
 * Delete a staff assignment. If it is the user's last assignment, delete the user.
 */
export async function deleteStaff(
  req: AuthRequest,
  res: Response,
): Promise<Response | void> {
  try {
    const { id } = req.params;
    
    if (typeof id !== "string" || !id) {
      return res.status(400).json({
        error: "ValidationError",
        message: "Staff id is required.",
      });
    }
    
    const staff = await findStaffRecord(id);

    if (!staff) {
      return res.status(404).json({
        error: "NotFound",
        message: `Staff member with id '${id}' was not found.`,
      });
    }

    if (!ensureStaffAccess(req, res, staff)) {
      return;
    }

    await prisma.$transaction(async (tx) => {
      const remainingAssignments = await tx.staff.count({
        where: {
          userId: staff.user.id,
          id: { not: staff.id },
        },
      });

      if (remainingAssignments > 0) {
        await tx.staff.delete({
          where: { id: staff.id },
        });
        return;
      }

      await tx.user.delete({
        where: { id: staff.user.id },
      });
    });

    return res.status(204).send();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return res.status(404).json({
          error: "NotFound",
          message: `Staff member with id '${req.params.id}' was not found.`,
        });
      }
      if (error.code === "P2003") {
        return res.status(409).json({
          error: "Conflict",
          message:
            "This staff member cannot be deleted because related records still exist.",
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
