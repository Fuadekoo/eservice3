import type { Response } from "express";
import { hash } from "bcryptjs";
import { randomUUID } from "crypto";
import { prisma } from "../lib/db.js";
import type { AuthRequest } from "../middleware/auth.js";
import {
  createUserSchema,
  updateUserSchema,
  buildValidationError,
} from "../validators/user.validator.js";

const userInclude = {
  role: {
    select: { id: true, name: true },
  },
  staff: {
    select: { id: true, officeId: true },
  },
} as const;

function formatUser(user: any) {
  return {
    id: user.id,
    username: user.username,
    phoneNumber: user.phoneNumber,
    isActive: user.isActive,
    role: user.role ?? null,
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
    const search = (req.query.search as string) || "";

    const where: any = {};
    if (search) {
      where.OR = [
        { username: { contains: search, mode: "insensitive" as const } },
        { phoneNumber: { contains: search, mode: "insensitive" as const } },
      ];
    }

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

    const id = req.params.id;
    const user = await prisma.user.findUnique({
      where: { id },
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
      phone,
      phoneNumber,
      password,
      roleId,
      roleName: roleNameInput,
      isActive,
    } = validation.data;
    const normalizedPhone = (phoneNumber || phone || "").trim();

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
        where: { phoneNumber: normalizedPhone },
      });
      if (existingByPhone)
        return res
          .status(400)
          .json({ success: false, error: "Phone number already in use" });
    }

    const hashed = await hash(password, 10);

    let resolvedRoleId = roleId;
    if (!resolvedRoleId && roleNameInput) {
      const dbRole = await prisma.role.findFirst({
        where: { name: roleNameInput },
      });
      if (dbRole) resolvedRoleId = dbRole.id;
    }

    const newUser = await prisma.user.create({
      data: {
        id: randomUUID(),
        username,
        phoneNumber: normalizedPhone || null,
        password: hashed,
        roleId: resolvedRoleId || null,
        isActive: isActive ?? true,
      },
      include: userInclude,
    });

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

    const id = req.params.id;

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
      phone,
      phoneNumber,
      password,
      roleId,
      roleName: roleNameInput,
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

    const normalizedPhone = (phoneNumber || phone || undefined) as
      | string
      | undefined;
    if (normalizedPhone) {
      const exists = await prisma.user.findFirst({
        where: { phoneNumber: normalizedPhone },
      });
      if (exists && exists.id !== id)
        return res
          .status(400)
          .json({ success: false, error: "Phone number already in use" });
      updateData.phoneNumber = normalizedPhone;
    }

    if (password) updateData.password = await hash(password, 10);

    let resolvedRoleId = roleId;
    if (!resolvedRoleId && roleNameInput) {
      const dbRole = await prisma.role.findFirst({
        where: { name: roleNameInput },
      });
      if (dbRole) resolvedRoleId = dbRole.id;
    }
    if (resolvedRoleId !== undefined)
      updateData.roleId = resolvedRoleId || null;

    if (isActive !== undefined) updateData.isActive = isActive;

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      include: userInclude,
    });

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

    const id = req.params.id;

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
