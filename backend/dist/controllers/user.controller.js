import { hash } from "bcryptjs";
import { randomUUID } from "crypto";
import { prisma } from "../lib/db.js";
import { createUserSchema, updateUserSchema, buildValidationError, } from "../validators/user.validator.js";
import { getEthiopianMobilePhoneCandidates } from "../utils/phone.js";
function parseQueryString(value) {
    const str = typeof value === "string" ? value.trim() : undefined;
    return str || undefined;
}
/**
 * Resolve a role name to a concrete role id. Role names are not unique (they
 * repeat per office, with mixed casing), so match case-insensitively and prefer
 * the global role (officeId null) that base user roles are assigned from,
 * falling back to any office role with that name.
 */
async function resolveRoleIdByName(roleName) {
    const role = (await prisma.role.findFirst({
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
    staffs: {
        select: {
            id: true,
            officeId: true,
            office: {
                select: { id: true, name: true },
            },
        },
    },
};
function formatUser(user) {
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
        staff: user.staffs?.[0] ?? null,
        createdAt: user.createdAt?.toISOString(),
        updatedAt: user.updatedAt?.toISOString(),
    };
}
async function getUserRole(userId) {
    const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        include: { role: true },
    });
    return dbUser?.role?.name?.toLowerCase() || "";
}
export async function listUsers(req, res) {
    try {
        const authUserId = req.user?.id;
        if (!authUserId)
            return res.status(401).json({ success: false, error: "Unauthorized" });
        const page = parseInt(req.query.page || "1", 10) || 1;
        const pageSize = parseInt(req.query.pageSize || "10", 10) || 10;
        const search = parseQueryString(req.query.search);
        const roleId = parseQueryString(req.query.roleId);
        const roleName = parseQueryString(req.query.roleName);
        const officeId = parseQueryString(req.query.officeId);
        const isActiveRaw = parseQueryString(req.query.isActive);
        const filters = [];
        if (search) {
            filters.push({
                OR: [
                    { username: { contains: search, mode: "insensitive" } },
                    { phoneNumber: { contains: search, mode: "insensitive" } },
                    { firstName: { contains: search, mode: "insensitive" } },
                    { fatherName: { contains: search, mode: "insensitive" } },
                    { lastName: { contains: search, mode: "insensitive" } },
                    { role: { is: { name: { contains: search, mode: "insensitive" } } } },
                    {
                        staffs: {
                            some: {
                                office: {
                                    is: { name: { contains: search, mode: "insensitive" } },
                                },
                            },
                        },
                    },
                ]
            });
        }
        if (roleId)
            filters.push({ roleId });
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
        if (officeId)
            filters.push({ staffs: { some: { officeId } } });
        if (isActiveRaw === "true")
            filters.push({ isActive: true });
        else if (isActiveRaw === "false")
            filters.push({ isActive: false });
        const where = filters.length > 0 ? { AND: filters } : {};
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
    }
    catch (error) {
        console.error("❌ Error listing users:", error);
        return res
            .status(500)
            .json({ success: false, error: error.message || "Failed to list users" });
    }
}
export async function getUser(req, res) {
    try {
        const authUserId = req.user?.id;
        if (!authUserId)
            return res.status(401).json({ success: false, error: "Unauthorized" });
        const id = req.params.id;
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
    }
    catch (error) {
        console.error("❌ Error fetching user:", error);
        return res
            .status(500)
            .json({ success: false, error: error.message || "Failed to fetch user" });
    }
}
export async function createUser(req, res) {
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
        const { username, phone, phoneNumber, password, roleId, roleName: roleNameInput, isActive, } = validation.data;
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
        const hashed = await hash(password, 10);
        let resolvedRoleId = roleId;
        if (!resolvedRoleId && roleNameInput) {
            resolvedRoleId = await resolveRoleIdByName(roleNameInput);
        }
        const newUser = await prisma.user.create({
            data: {
                id: randomUUID(),
                username,
                phoneNumber: normalizedPhone,
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
    }
    catch (error) {
        console.error("❌ Error creating user:", error);
        return res
            .status(500)
            .json({
            success: false,
            error: error.message || "Failed to create user",
        });
    }
}
export async function updateUser(req, res) {
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
        const { username, phone, phoneNumber, password, roleId, roleName: roleNameInput, isActive, } = validation.data;
        const updateData = {};
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
        if (password)
            updateData.password = await hash(password, 10);
        let resolvedRoleId = roleId;
        if (!resolvedRoleId && roleNameInput) {
            resolvedRoleId = await resolveRoleIdByName(roleNameInput);
        }
        if (resolvedRoleId !== undefined)
            updateData.roleId = resolvedRoleId || null;
        if (isActive !== undefined)
            updateData.isActive = isActive;
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
    }
    catch (error) {
        console.error("❌ Error updating user:", error);
        return res
            .status(500)
            .json({
            success: false,
            error: error.message || "Failed to update user",
        });
    }
}
export async function deleteUser(req, res) {
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
    }
    catch (error) {
        console.error("❌ Error deleting user:", error);
        return res
            .status(500)
            .json({
            success: false,
            error: error.message || "Failed to delete user",
        });
    }
}
//# sourceMappingURL=user.controller.js.map