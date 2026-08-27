import type { Response } from "express";
import { hash } from "bcryptjs";
import { randomUUID } from "crypto";
import { prisma } from "../lib/db.js";
import { Prisma } from "../lib/prisma-client.js";
import type { AuthRequest } from "../middleware/auth.js";
import {
  createUserSchema,
  updateUserSchema,
  buildValidationError,
} from "../validators/user.validator.js";
import { getEthiopianMobilePhoneCandidates } from "../utils/phone.js";

function parseQueryString(value: unknown): string | undefined {
  const str = typeof value === "string" ? value.trim() : undefined;
  return str || undefined;
}

/**
 * Resolve a role name to a concrete role id. Role names are not unique (they
 * repeat per office, with mixed casing), so match case-insensitively and prefer
 * the global role (officeId null) that base user roles are assigned from,
 * falling back to any office role with that name.
 */
async function resolveRoleIdByName(
  roleName: string,
): Promise<string | undefined> {
  const role =
    (await prisma.role.findFirst({
      where: {
        name: { equals: roleName },
        officeId: null,
      },
      select: { id: true },
    })) ??
    (await prisma.role.findFirst({
      where: { name: { equals: roleName } },
      select: { id: true },
    }));
  return role?.id;
}

const userInclude = {
  role: {
    select: { id: true, name: true },
  },
  staff: {
    select: {
      id: true,
      officeId: true,
      office: {
        select: { id: true, name: true },
      },
    },
  },
} as const;

/**
 * Build the denormalized `name` column from the three name parts. Callers
 * validate that each part is non-blank, so the result is never empty.
 */
function composeName(
  firstName?: string | null,
  fatherName?: string | null,
  lastName?: string | null,
) {
  return [firstName, fatherName, lastName]
    .map((part) => (part ?? "").trim())
    .filter(Boolean)
    .join(" ");
}

/**
 * Link a user to an office by way of the `staff` join row, which is what the
 * rest of the app reads an office assignment from.
 *
 * Existing rows are moved rather than duplicated, and never deleted here —
 * a staff row can be referenced by approved requests.
 */
async function assignOffice(
  tx: Prisma.TransactionClient,
  userId: string,
  officeId: string,
) {
  const office = await tx.office.findUnique({
    where: { id: officeId },
    select: { id: true },
  });
  if (!office) throw new Error("Office not found");

  const existing = await tx.staff.findFirst({
    where: { userId },
    select: { id: true },
  });

  if (existing) {
    await tx.staff.update({
      where: { id: existing.id },
      data: { officeId },
    });
    return;
  }

  await tx.staff.create({ data: { userId, officeId } });
}

function formatUser(user: any) {
  return {
    id: user.id,
    username: user.username,
    firstName: user.firstName,
    fatherName: user.fatherName,
    lastName: user.lastName,
    phoneNumber: user.phoneNumber,
    phoneVerified: user.phoneVerified,
    isActive: user.isActive,
    role: user.role ?? null,
    staff: user.staff ?? null,
    createdAt: user.createdAt?.toISOString(),
    updatedAt: user.updatedAt?.toISOString(),
  };
}

async function getUserRole(userId: string) {
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  });
  return dbUser?.role?.name?.toLowerCase() || "";
}

export async function listUsers(req: AuthRequest, res: Response) {
  try {
    const authUserId = req.user?.id;
    if (!authUserId)
      return res.status(401).json({ success: false, error: "Unauthorized" });

    const page = parseInt((req.query.page as string) || "1", 10) || 1;
    const pageSize = parseInt((req.query.pageSize as string) || "10", 10) || 10;
    const search = parseQueryString(req.query.search);
    const roleId = parseQueryString(req.query.roleId);
    const roleName = parseQueryString(req.query.roleName);
    const officeId = parseQueryString(req.query.officeId);
    const isActiveRaw = parseQueryString(req.query.isActive);

    const filters: any[] = [];
    if (search) {
      filters.push({
        OR: [
        { username: { contains: search } },
        { phoneNumber: { contains: search } },
        { firstName: { contains: search } },
        { fatherName: { contains: search } },
        { lastName: { contains: search } },
        { role: { is: { name: { contains: search } } } },
        {
          staffs: {
            some: {
              office: {
                is: { name: { contains: search } },
              },
            },
          },
        },
      ]});
    }
    if (roleId) filters.push({ roleId });
    // Roles are per-office and share names (e.g. many "MANAGER" records), so
    // filter by role name to match every matching role across offices rather
    // than a single per-office role id. MySQL's default collation makes the
    // equality case-insensitive.
    if (roleName)
      filters.push({
        role: {
          is: { name: { equals: roleName } },
        },
      });
    if (officeId) filters.push({ staff: { officeId } });
    if (isActiveRaw === "true") filters.push({ isActive: true });
    else if (isActiveRaw === "false") filters.push({ isActive: false });

    const where: any = filters.length > 0 ? { AND: filters } : {};

    const total = await prisma.user.count({ where });
    const users = await prisma.user.findMany({
      where,
      include: userInclude,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return res
      .status(200)
      .json({
        success: true,
        data: users.map(formatUser),
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      });
  } catch (error: any) {
    console.error("❌ Error listing users:", error);
    return res
      .status(500)
      .json({ success: false, error: error.message || "Failed to list users" });
  }
}

export async function getUser(req: AuthRequest, res: Response) {
  try {
    const authUserId = req.user?.id;
    if (!authUserId)
      return res.status(401).json({ success: false, error: "Unauthorized" });

    const id = req.params.id as string;
    const user = await prisma.user.findUnique({
      where: { id: id },
      include: userInclude,
    });
    if (!user)
      return res.status(404).json({ success: false, error: "User not found" });

    // Only admin or the user themselves can view full data
    const roleName = await getUserRole(authUserId);
    const isAdmin = ["admin", "administrator"].includes(roleName);
    if (!isAdmin && authUserId !== id)
      return res.status(403).json({ success: false, error: "Unauthorized" });

    return res.status(200).json({ success: true, data: formatUser(user) });
  } catch (error: any) {
    console.error("❌ Error fetching user:", error);
    return res
      .status(500)
      .json({ success: false, error: error.message || "Failed to fetch user" });
  }
}

export async function createUser(req: AuthRequest, res: Response) {
  try {
    const authUserId = req.user?.id;
    if (!authUserId)
      return res.status(401).json({ success: false, error: "Unauthorized" });

    // Only admins can create users
    const roleName = await getUserRole(authUserId);
    const isAdmin = ["admin", "administrator"].includes(roleName);
    if (!isAdmin)
      return res.status(403).json({ success: false, error: "Unauthorized" });

    const validation = createUserSchema.safeParse(req.body);
    if (!validation.success)
      return res
        .status(400)
        .json({
          success: false,
          errors: buildValidationError(validation.error),
        });

    const {
      username,
      firstName,
      fatherName,
      lastName,
      phone,
      phoneNumber,
      password,
      roleId,
      roleName: roleNameInput,
      officeId,
      isActive,
    } = validation.data;
    const normalizedPhone = phoneNumber || phone || "";
    const phoneCandidates = getEthiopianMobilePhoneCandidates(normalizedPhone);

    // Unique checks
    const existingByUsername = await prisma.user.findUnique({
      where: { username },
    });
    if (existingByUsername)
      return res
        .status(400)
        .json({ success: false, error: "Username already exists" });

    if (normalizedPhone) {
      const existingByPhone = await prisma.user.findFirst({
        where: { phoneNumber: { in: phoneCandidates } },
      });
      if (existingByPhone)
        return res
          .status(400)
          .json({ success: false, error: "Phone number already in use" });
    }

    if (officeId) {
      const office = await prisma.office.findUnique({
        where: { id: officeId },
        select: { id: true },
      });
      if (!office)
        return res
          .status(400)
          .json({ success: false, error: "Office not found" });
    }

    const hashed = await hash(password, 10);

    let resolvedRoleId = roleId;
    if (!resolvedRoleId && roleNameInput) {
      resolvedRoleId = await resolveRoleIdByName(roleNameInput);
    }

    // User and office assignment are written together: a user created
    // without the office that was asked for would be a silent half-success.
    const createdId = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          id: randomUUID(),
          username,
          firstName,
          fatherName,
          lastName,
          name: composeName(firstName, fatherName, lastName),
          phoneNumber: normalizedPhone,
          password: hashed,
          roleId: resolvedRoleId || null,
          isActive: isActive ?? true,
        },
        select: { id: true },
      });
      if (officeId) await assignOffice(tx, created.id, officeId);
      return created.id;
    });

    const newUser = await prisma.user.findUnique({
      where: { id: createdId },
      include: userInclude,
    });
    if (!newUser)
      return res
        .status(500)
        .json({ success: false, error: "Failed to load the created user" });

    return res
      .status(201)
      .json({
        success: true,
        data: formatUser(newUser),
        message: "User created",
      });
  } catch (error: any) {
    console.error("❌ Error creating user:", error);
    return res
      .status(500)
      .json({
        success: false,
        error: error.message || "Failed to create user",
      });
  }
}

export async function updateUser(req: AuthRequest, res: Response) {
  try {
    const authUserId = req.user?.id;
    if (!authUserId)
      return res.status(401).json({ success: false, error: "Unauthorized" });

    const id = req.params.id as string;

    // Only admin or the user can update
    const roleName = await getUserRole(authUserId);
    const isAdmin = ["admin", "administrator"].includes(roleName);
    if (!isAdmin && authUserId !== id)
      return res.status(403).json({ success: false, error: "Unauthorized" });

    const validation = updateUserSchema.safeParse(req.body);
    if (!validation.success)
      return res
        .status(400)
        .json({
          success: false,
          errors: buildValidationError(validation.error),
        });

    const {
      username,
      firstName,
      fatherName,
      lastName,
      phone,
      phoneNumber,
      password,
      roleId,
      roleName: roleNameInput,
      officeId,
      isActive,
    } = validation.data;
    const updateData: any = {};

    if (username) {
      const exists = await prisma.user.findUnique({ where: { username } });
      if (exists && exists.id !== id)
        return res
          .status(400)
          .json({ success: false, error: "Username already exists" });
      updateData.username = username;
    }

    const normalizedPhone = phoneNumber || phone || undefined;
    if (normalizedPhone) {
      const phoneCandidates = getEthiopianMobilePhoneCandidates(normalizedPhone);
      const exists = await prisma.user.findFirst({
        where: { phoneNumber: { in: phoneCandidates } },
      });
      if (exists && exists.id !== id)
        return res
          .status(400)
          .json({ success: false, error: "Phone number already in use" });
      updateData.phoneNumber = normalizedPhone;
    }

    // Only the supplied parts change; `name` is recomposed from the merged set
    // so it can never drift out of sync with the parts it mirrors.
    if (firstName !== undefined) updateData.firstName = firstName;
    if (fatherName !== undefined) updateData.fatherName = fatherName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (
      firstName !== undefined ||
      fatherName !== undefined ||
      lastName !== undefined
    ) {
      const current = await prisma.user.findUnique({
        where: { id },
        select: { firstName: true, fatherName: true, lastName: true },
      });
      updateData.name = composeName(
        firstName ?? current?.firstName,
        fatherName ?? current?.fatherName,
        lastName ?? current?.lastName,
      );
    }

    if (officeId) {
      const office = await prisma.office.findUnique({
        where: { id: officeId },
        select: { id: true },
      });
      if (!office)
        return res
          .status(400)
          .json({ success: false, error: "Office not found" });
    }

    if (password) updateData.password = await hash(password, 10);

    let resolvedRoleId = roleId;
    if (!resolvedRoleId && roleNameInput) {
      resolvedRoleId = await resolveRoleIdByName(roleNameInput);
    }
    if (resolvedRoleId !== undefined)
      updateData.roleId = resolvedRoleId || null;

    if (isActive !== undefined) updateData.isActive = isActive;

    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id }, data: updateData });
      if (officeId) await assignOffice(tx, id, officeId);
    });

    const updated = await prisma.user.findUnique({
      where: { id },
      include: userInclude,
    });
    if (!updated)
      return res
        .status(404)
        .json({ success: false, error: "User not found" });

    return res
      .status(200)
      .json({
        success: true,
        data: formatUser(updated),
        message: "User updated",
      });
  } catch (error: any) {
    console.error("❌ Error updating user:", error);
    return res
      .status(500)
      .json({
        success: false,
        error: error.message || "Failed to update user",
      });
  }
}

export async function deleteUser(req: AuthRequest, res: Response) {
  try {
    const authUserId = req.user?.id;
    if (!authUserId)
      return res.status(401).json({ success: false, error: "Unauthorized" });

    const id = req.params.id as string;

    // Only admin can delete users (or allow self-delete)
    const roleName = await getUserRole(authUserId);
    const isAdmin = ["admin", "administrator"].includes(roleName);
    if (!isAdmin && authUserId !== id)
      return res.status(403).json({ success: false, error: "Unauthorized" });

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing)
      return res.status(404).json({ success: false, error: "User not found" });

    // Prevent deleting admin last user? (not implemented)

    await prisma.user.delete({ where: { id } });

    return res.status(200).json({ success: true, message: "User deleted" });
  } catch (error: any) {
    console.error("❌ Error deleting user:", error);
    return res
      .status(500)
      .json({
        success: false,
        error: error.message || "Failed to delete user",
      });
  }
}
