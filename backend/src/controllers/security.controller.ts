import type { Request, Response } from "express";
import { prisma } from "../lib/db.js";
import type { AuthRequest } from "../middleware/auth.js";
import {
  delegatablePermissions,
  isPrivilegedRoleName,
} from "../config/role-permissions.js";
import { Prisma } from "../lib/prisma-client.js";
// import { Prisma } from "../../generated/prisma/client.js";

// import { prisma } from "../lib/prisma.js";
import {
  parsePaginationParams,
  createPaginatedResponse,
} from "../utils/pagination.js";
import {
  buildValidationError,
  createAuditLogSchema,
  createPermissionChangeRequestSchema,
  createPermissionSchema,
  createPermissionSetSchema,
  createRoleSchema,
  createSecurityAuditSchema,
  createSecurityIncidentSchema,
  createSecurityProgramSchema,
  createSecurityReminderSchema,
  updateAuditLogSchema,
  updatePermissionChangeRequestSchema,
  updatePermissionSchema,
  updatePermissionSetSchema,
  updateRoleSchema,
  updateSecurityAuditSchema,
  updateSecurityIncidentSchema,
  updateSecurityProgramSchema,
  updateSecurityReminderSchema,
} from "../validators/security.validator.js";

export async function listSecurityPrograms(
  _req: Request,
  res: Response,
): Promise<void> {
  const programs = await (prisma as any).securityProgram.findMany({
    orderBy: { createdAt: "desc" },
  });
  res.json({ data: programs });
}

export async function createSecurityProgram(
  req: Request,
  res: Response,
): Promise<Response | void> {
  const parsed = createSecurityProgramSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(buildValidationError(parsed.error));
  }

  const created = await (prisma as any).securityProgram.create({
    data: parsed.data,
  });

  return res.status(201).json({ data: created });
}

export async function updateSecurityProgram(
  req: Request,
  res: Response,
): Promise<Response | void> {
  const id = Number(req.params.id);
  const parsed = updateSecurityProgramSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(buildValidationError(parsed.error));
  }

  try {
    const updated = await (prisma as any).securityProgram.update({
      where: { id },
      data: parsed.data,
    });
    return res.json({ data: updated });
  } catch (error) {
    console.error(error);
    return res.status(404).json({
      error: "NotFound",
      message: `Security program with id '${req.params.id}' was not found.`,
    });
  }
}

export async function deleteSecurityProgram(
  req: Request,
  res: Response,
): Promise<Response | void> {
  const id = Number(req.params.id);
  try {
    await (prisma as any).securityProgram.delete({ where: { id } });
    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(404).json({
      error: "NotFound",
      message: `Security program with id '${req.params.id}' was not found.`,
    });
  }
}

export async function listSecurityAudits(
  _req: Request,
  res: Response,
): Promise<void> {
  const audits = await (prisma as any).securityAudit.findMany({
    orderBy: { createdAt: "desc" },
  });
  res.json({ data: audits });
}

export async function createSecurityAudit(
  req: Request,
  res: Response,
): Promise<Response | void> {
  const parsed = createSecurityAuditSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(buildValidationError(parsed.error));
  }

  const created = await (prisma as any).securityAudit.create({
    data: parsed.data,
  });
  return res.status(201).json({ data: created });
}

export async function updateSecurityAudit(
  req: Request,
  res: Response,
): Promise<Response | void> {
  const id = Number(req.params.id);
  const parsed = updateSecurityAuditSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(buildValidationError(parsed.error));
  }

  try {
    const updated = await (prisma as any).securityAudit.update({
      where: { id },
      data: parsed.data,
    });
    return res.json({ data: updated });
  } catch (error) {
    console.error(error);
    return res.status(404).json({
      error: "NotFound",
      message: `Security audit with id '${req.params.id}' was not found.`,
    });
  }
}

export async function deleteSecurityAudit(
  req: Request,
  res: Response,
): Promise<Response | void> {
  const id = Number(req.params.id);
  try {
    await (prisma as any).securityAudit.delete({ where: { id } });
    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(404).json({
      error: "NotFound",
      message: `Security audit with id '${req.params.id}' was not found.`,
    });
  }
}

export async function listSecurityIncidents(
  _req: Request,
  res: Response,
): Promise<void> {
  const incidents = await (prisma as any).securityIncident.findMany({
    orderBy: { reportedOn: "desc" },
  });
  res.json({ data: incidents });
}

export async function createSecurityIncident(
  req: Request,
  res: Response,
): Promise<Response | void> {
  const parsed = createSecurityIncidentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(buildValidationError(parsed.error));
  }

  const created = await (prisma as any).securityIncident.create({
    data: parsed.data,
  });

  return res.status(201).json({ data: created });
}

export async function updateSecurityIncident(
  req: Request,
  res: Response,
): Promise<Response | void> {
  const id = Number(req.params.id);
  const parsed = updateSecurityIncidentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(buildValidationError(parsed.error));
  }

  try {
    const updated = await (prisma as any).securityIncident.update({
      where: { id },
      data: parsed.data,
    });
    return res.json({ data: updated });
  } catch (error) {
    console.error(error);
    return res.status(404).json({
      error: "NotFound",
      message: `Security incident with id '${req.params.id}' was not found.`,
    });
  }
}

export async function deleteSecurityIncident(
  req: Request,
  res: Response,
): Promise<Response | void> {
  const id = Number(req.params.id);
  try {
    await (prisma as any).securityIncident.delete({ where: { id } });
    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(404).json({
      error: "NotFound",
      message: `Security incident with id '${req.params.id}' was not found.`,
    });
  }
}

export async function listSecurityReminders(
  _req: Request,
  res: Response,
): Promise<void> {
  const reminders = await (prisma as any).securityReminder.findMany({
    orderBy: { dueDate: "asc" },
  });
  res.json({ data: reminders });
}

export async function createSecurityReminder(
  req: Request,
  res: Response,
): Promise<Response | void> {
  const parsed = createSecurityReminderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(buildValidationError(parsed.error));
  }

  const created = await (prisma as any).securityReminder.create({
    data: parsed.data,
  });

  return res.status(201).json({ data: created });
}

export async function updateSecurityReminder(
  req: Request,
  res: Response,
): Promise<Response | void> {
  const id = Number(req.params.id);
  const parsed = updateSecurityReminderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(buildValidationError(parsed.error));
  }

  try {
    const updated = await (prisma as any).securityReminder.update({
      where: { id },
      data: parsed.data,
    });
    return res.json({ data: updated });
  } catch (error) {
    console.error(error);
    return res.status(404).json({
      error: "NotFound",
      message: `Security reminder with id '${req.params.id}' was not found.`,
    });
  }
}

export async function deleteSecurityReminder(
  req: Request,
  res: Response,
): Promise<Response | void> {
  const id = Number(req.params.id);
  try {
    await (prisma as any).securityReminder.delete({ where: { id } });
    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(404).json({
      error: "NotFound",
      message: `Security reminder with id '${req.params.id}' was not found.`,
    });
  }
}

/**
 * GET /security/permissions
 *
 * Lists the permissions the caller may put on a role. An administrator sees
 * the catalogue; anyone else sees only what they could delegate — never a
 * system-level permission, and never one they do not hold themselves. A
 * manager building a role for their office therefore cannot even be shown
 * "manage users" or "edit permissions", let alone select them.
 */
export async function listPermissions(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  const permissions = await prisma.permission.findMany({
    orderBy: { name: "asc" },
  });

  const allowed = new Set(
    delegatablePermissions(
      permissions.map((permission) => permission.name),
      {
        isAdmin: req.isAdmin === true,
        permissions: req.permissions ?? [],
      },
    ),
  );

  res.json({
    data: permissions.filter((permission) => allowed.has(permission.name)),
  });
}

export async function createPermission(
  req: Request,
  res: Response,
): Promise<Response | void> {
  const parsed = createPermissionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(buildValidationError(parsed.error));
  }

  const created = await prisma.permission.create({
    data: parsed.data as any,
  });

  return res.status(201).json({ data: created });
}

export async function updatePermission(
  req: Request,
  res: Response,
): Promise<Response | void> {
  const id = req.params.id as string;
  const parsed = updatePermissionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(buildValidationError(parsed.error));
  }

  try {
    const updated = await prisma.permission.update({
      where: { id },
      data: parsed.data as any,
    });
    return res.json({ data: updated });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return res.status(404).json({
        error: "NotFound",
        message: `Permission with id '${req.params.id}' was not found.`,
      });
    }
    console.error(error);
    return res.status(500).json({
      error: "InternalServerError",
      message: "Unable to update permission.",
    });
  }
}

export async function deletePermission(
  req: Request,
  res: Response,
): Promise<Response | void> {
  const id = req.params.id as string;
  try {
    await prisma.permission.delete({ where: { id } });
    return res.status(204).send();
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return res.status(404).json({
        error: "NotFound",
        message: `Permission with id '${req.params.id}' was not found.`,
      });
    }
    console.error(error);
    return res.status(500).json({
      error: "InternalServerError",
      message: "Unable to delete permission.",
    });
  }
}

export async function listPermissionSets(
  _req: Request,
  res: Response,
): Promise<void> {
  const sets = await (prisma as any).permissionSet.findMany({
    include: {
      permissions: {
        include: { permission: true },
      },
    },
    orderBy: { name: "asc" },
  });
  res.json({
    data: sets.map((set: any) => ({
      ...set,
      permissions: set.permissions.map((entry: any) => entry.permission),
    })),
  });
}

export async function createPermissionSet(
  req: Request,
  res: Response,
): Promise<Response | void> {
  const parsed = createPermissionSetSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(buildValidationError(parsed.error));
  }

  const { permissions, ...data } = parsed.data;
  const created = await (prisma as any).permissionSet.create({
    data,
  });

  if (permissions?.length) {
    await syncPermissionSetPermissions(created.id, permissions);
  }

  const result = await (prisma as any).permissionSet.findUnique({
    where: { id: created.id },
    include: { permissions: { include: { permission: true } } },
  });

  return res.status(201).json({
    data: {
      ...result,
      permissions:
        result?.permissions.map((entry: any) => entry.permission) ?? [],
    },
  });
}

export async function updatePermissionSet(
  req: Request,
  res: Response,
): Promise<Response | void> {
  const id = Number(req.params.id);
  const parsed = updatePermissionSetSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(buildValidationError(parsed.error));
  }

  const { permissions, ...data } = parsed.data;

  try {
    const updated = await (prisma as any).permissionSet.update({
      where: { id },
      data,
    });

    if (permissions) {
      await syncPermissionSetPermissions(id, permissions);
    }

    const result = await (prisma as any).permissionSet.findUnique({
      where: { id: updated.id },
      include: { permissions: { include: { permission: true } } },
    });

    return res.json({
      data: {
        ...result,
        permissions:
          result?.permissions.map((entry: any) => entry.permission) ?? [],
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return res.status(404).json({
        error: "NotFound",
        message: `Permission set with id '${req.params.id}' was not found.`,
      });
    }
    console.error(error);
    return res.status(500).json({
      error: "InternalServerError",
      message: "Unable to update permission set.",
    });
  }
}

export async function deletePermissionSet(
  req: Request,
  res: Response,
): Promise<Response | void> {
  const id = Number(req.params.id);
  try {
    await (prisma as any).permissionSet.delete({ where: { id } });
    return res.status(204).send();
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return res.status(404).json({
        error: "NotFound",
        message: `Permission set with id '${req.params.id}' was not found.`,
      });
    }
    console.error(error);
    return res.status(500).json({
      error: "InternalServerError",
      message: "Unable to delete permission set.",
    });
  }
}

import { getOfficeId } from "../utils/office.helper.js"; // .js extension for ES modules

// ... (other imports)

export async function listRoles(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  const search =
    typeof req.query.search === "string" ? req.query.search.trim() : "";

  // Roles are global — a job description, not a place — so there is nothing
  // to scope by office. An officeId query parameter is accepted and ignored
  // so older callers keep working.
  const where: Prisma.RoleWhereInput = {};

  if (search) {
    where.name = {
      contains: search,
    };
  }

  const roles = (await prisma.role.findMany({
    where,
    include: {
      rolePermissions: { include: { permission: true } },
      users: { select: { id: true } },
    },
    orderBy: { name: "asc" },
  })) as any[];
  res.json({
    data: roles.map((role: any) => ({
      ...role,
      permissions: role.rolePermissions.map((entry: any) => entry.permission),
      memberCount: role.users.length,
    })),
  });
}

export async function createRole(
  req: AuthRequest,
  res: Response,
): Promise<Response | void> {
  const parsed = createRoleSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(buildValidationError(parsed.error));
  }

  // A role is a job description, not a place, so it no longer belongs to an
  // office. An officeId in the body is accepted and ignored, so an older
  // client sending it does not break.
  const { permissions, officeId: _unusedOfficeId, ...data } = parsed.data;

  const created = await prisma.role.create({
    data: data as any,
  });

  if (permissions?.length) {
    await syncRolePermissions(created.id, permissions);
  }

  const result = (await prisma.role.findUnique({
    where: { id: created.id },
    include: {
      rolePermissions: { include: { permission: true } },
      users: { select: { id: true } },
    },
  })) as any;

  return res.status(201).json({
    data: {
      ...result,
      permissions:
        result?.rolePermissions.map((entry: any) => entry.permission) ?? [],
      memberCount: result?.users.length ?? 0,
    },
  });
}

export async function updateRole(
  req: Request,
  res: Response,
): Promise<Response | void> {
  const id = req.params.id as string;
  const parsed = updateRoleSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(buildValidationError(parsed.error));
  }

  const { permissions, ...data } = parsed.data;

  try {
    const updated = await prisma.role.update({
      where: { id },
      data: data as any,
    });

    if (permissions) {
      await syncRolePermissions(id, permissions);
    }

    const result = (await prisma.role.findUnique({
      where: { id: updated.id },
      include: {
        rolePermissions: { include: { permission: true } },
        users: { select: { id: true } },
      },
    })) as any;

    return res.json({
      data: {
        ...result,
        permissions:
          result?.rolePermissions.map((entry: any) => entry.permission) ?? [],
        memberCount: result?.users.length ?? 0,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return res.status(404).json({
        error: "NotFound",
        message: `Role with id '${req.params.id}' was not found.`,
      });
    }
    console.error(error);
    return res.status(500).json({
      error: "InternalServerError",
      message: "Unable to update role.",
    });
  }
}

/**
 * DELETE /security/roles/:id
 *
 * `User.roleId` is `ON DELETE SET NULL`, so deleting a role does not fail —
 * it quietly strips the role from everyone holding it. For the administrator
 * role that means every administrator loses their access at once, with no
 * account left that can grant it back. Both cases are refused here rather
 * than left to the person clicking the button to notice.
 */
export async function deleteRole(
  req: Request,
  res: Response,
): Promise<Response | void> {
  const id = req.params.id as string;
  try {
    const role = await prisma.role.findUnique({
      where: { id },
      select: { name: true, _count: { select: { users: true } } },
    });

    if (!role) {
      return res.status(404).json({
        error: "NotFound",
        message: `Role with id '${id}' was not found.`,
      });
    }

    if (isPrivilegedRoleName(role.name)) {
      return res.status(403).json({
        error: "Forbidden",
        message:
          "The administrator role cannot be deleted. Removing it would leave " +
          "no account able to administer the system.",
      });
    }

    if (role._count.users > 0) {
      return res.status(409).json({
        error: "Conflict",
        message:
          `${role._count.users} user(s) still hold the "${role.name}" role. ` +
          "Move them to another role first — deleting it now would leave them " +
          "with no role and no way to sign in to their work.",
      });
    }

    await prisma.role.delete({ where: { id } });
    return res.status(204).send();
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return res.status(404).json({
        error: "NotFound",
        message: `Role with id '${req.params.id}' was not found.`,
      });
    }
    console.error(error);
    return res.status(500).json({
      error: "InternalServerError",
      message: "Unable to delete role.",
    });
  }
}

export async function listPermissionChangeRequests(
  _req: Request,
  res: Response,
): Promise<void> {
  const requests = await (prisma as any).permissionChangeRequest.findMany({
    orderBy: { createdAt: "desc" },
  });
  res.json({ data: requests });
}

export async function createPermissionChangeRequest(
  req: Request,
  res: Response,
): Promise<Response | void> {
  const parsed = createPermissionChangeRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(buildValidationError(parsed.error));
  }

  const created = await (prisma as any).permissionChangeRequest.create({
    data: parsed.data,
  });

  return res.status(201).json({ data: created });
}

export async function updatePermissionChangeRequest(
  req: Request,
  res: Response,
): Promise<Response | void> {
  const id = Number(req.params.id);
  const parsed = updatePermissionChangeRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(buildValidationError(parsed.error));
  }

  try {
    const updated = await (prisma as any).permissionChangeRequest.update({
      where: { id },
      data: parsed.data,
    });
    return res.json({ data: updated });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return res.status(404).json({
        error: "NotFound",
        message: `Permission change request with id '${req.params.id}' was not found.`,
      });
    }
    console.error(error);
    return res.status(500).json({
      error: "InternalServerError",
      message: "Unable to update permission change request.",
    });
  }
}

export async function deletePermissionChangeRequest(
  req: Request,
  res: Response,
): Promise<Response | void> {
  const id = Number(req.params.id);
  try {
    await (prisma as any).permissionChangeRequest.delete({ where: { id } });
    return res.status(204).send();
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return res.status(404).json({
        error: "NotFound",
        message: `Permission change request with id '${req.params.id}' was not found.`,
      });
    }
    console.error(error);
    return res.status(500).json({
      error: "InternalServerError",
      message: "Unable to delete permission change request.",
    });
  }
}

export async function listAuditLogs(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  const { actor, resource, userId, status } = req.query;

  const where: any = {
    actor: actor ? { contains: String(actor) } : undefined,
    resource: resource
      ? { contains: String(resource) }
      : undefined,
    userId: userId ? String(userId) : undefined,
    status: status ? String(status) : undefined,
  };

  // Remove undefined values from where clause
  Object.keys(where).forEach(
    (key) => where[key] === undefined && delete where[key],
  );

  // Parse pagination parameters
  const paginationParams = parsePaginationParams(req);
  // Override default pageSize to 25 for audit logs if not specified
  if (!req.query.pageSize && !req.query.limit) {
    paginationParams.pageSize = 25;
    paginationParams.skip = (paginationParams.page - 1) * 25;
    paginationParams.take = 25;
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: "desc" },
      skip: paginationParams.skip,
      take: paginationParams.take,
      include: {
        user: {
          select: {
            firstName: true,
            fatherName: true,
            name: true,
            username: true,
          },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  const response = createPaginatedResponse(logs, total, paginationParams);
  res.json(response);
}

export async function createAuditLog(
  req: Request,
  res: Response,
): Promise<Response | void> {
  const parsed = createAuditLogSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(buildValidationError(parsed.error));
  }

  const { timestamp, ...data } = parsed.data as any;
  const created = await prisma.auditLog.create({
    data: {
      ...data,
      timestamp: timestamp ?? new Date(),
    },
  });

  return res.status(201).json({ data: created });
}

export async function updateAuditLog(
  req: Request,
  res: Response,
): Promise<Response | void> {
  const id = Number(req.params.id);
  const parsed = updateAuditLogSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(buildValidationError(parsed.error));
  }

  try {
    // Filter out null/undefined values to match Prisma's expected types
    const updateData: any = {};
    if (parsed.data.timestamp !== undefined)
      updateData.timestamp = parsed.data.timestamp;
    if (parsed.data.actor !== undefined) updateData.actor = parsed.data.actor;
    if (parsed.data.role !== undefined) updateData.role = parsed.data.role;
    if (parsed.data.action !== undefined)
      updateData.action = parsed.data.action;
    if (parsed.data.resource !== undefined)
      updateData.resource = parsed.data.resource;
    if (parsed.data.status !== undefined)
      updateData.status = parsed.data.status;
    if (parsed.data.metadata !== undefined)
      updateData.metadata = parsed.data.metadata;
    if (parsed.data.userId !== undefined && parsed.data.userId !== null)
      updateData.userId = parsed.data.userId;

    const updated = await prisma.auditLog.update({
      where: { id },
      data: updateData,
    });
    return res.json({ data: updated });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return res.status(404).json({
        error: "NotFound",
        message: `Audit log with id '${req.params.id}' was not found.`,
      });
    }
    console.error(error);
    return res.status(500).json({
      error: "InternalServerError",
      message: "Unable to update audit log.",
    });
  }
}

export async function deleteAuditLog(
  req: Request,
  res: Response,
): Promise<Response | void> {
  const id = Number(req.params.id);
  try {
    await prisma.auditLog.delete({ where: { id } });
    return res.status(204).send();
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return res.status(404).json({
        error: "NotFound",
        message: `Audit log with id '${req.params.id}' was not found.`,
      });
    }
    console.error(error);
    return res.status(500).json({
      error: "InternalServerError",
      message: "Unable to delete audit log.",
    });
  }
}

async function syncPermissionSetPermissions(
  permissionSetId: number,
  codes: string[],
) {
  const permissions = await prisma.permission.findMany({
    where: { code: { in: codes } },
  });

  await (prisma as any).permissionSetPermission.deleteMany({
    where: { permissionSetId },
  });

  if (permissions.length) {
    await (prisma as any).permissionSetPermission.createMany({
      data: permissions.map((permission) => ({
        permissionSetId,
        permissionId: permission.id,
      })),
      skipDuplicates: true,
    });
  }
}

/**
 * Replace a role's permissions with `codes`.
 *
 * Matched on `name` as well as `code`: `requireAuth` reads a user's
 * permissions from `name`, and rows created by permission-seed.ts leave
 * `code` null — matching on `code` alone silently assigned nothing.
 *
 * `actor` is the person making the change. A non-admin cannot grant a
 * system-level permission or one they do not hold, so a manager cannot mint
 * a role more powerful than their own and then assume it.
 */
async function syncRolePermissions(
  roleId: string,
  codes: string[],
  actor?: { isAdmin: boolean; permissions: string[] },
) {
  const permissions = await prisma.permission.findMany({
    where: { OR: [{ code: { in: codes } }, { name: { in: codes } }] },
  });

  const permitted = actor
    ? new Set(
        delegatablePermissions(
          permissions.map((permission) => permission.name),
          actor,
        ),
      )
    : null;

  const granted = permitted
    ? permissions.filter((permission) => permitted.has(permission.name))
    : permissions;

  await prisma.rolePermission.deleteMany({
    where: { roleId },
  });

  if (granted.length) {
    await prisma.rolePermission.createMany({
      data: granted.map((permission) => ({
        roleId,
        permissionId: permission.id,
      })),
      skipDuplicates: true,
    });
  }
}

// function _cryptoRandomId(): string {
//   return Math.random().toString(36).substring(2, 8).toUpperCase();
// }
