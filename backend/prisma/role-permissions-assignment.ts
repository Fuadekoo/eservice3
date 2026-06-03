import { prisma } from "../src/lib/db.ts";

/**
 * Role Permission Assignment Utility (for seed files)
 *
 * This module automatically assigns default permissions to roles when they are created.
 * Each role type (admin, manager, staff, customer) gets a predefined set of permissions.
 */

/**
 * Get permission names for a specific role type
 * @param roleName - The role name (case-insensitive)
 * @returns Array of permission names for that role
 */
export function getRolePermissions(roleName: string): string[] {
  const normalizedRoleName = roleName.toUpperCase().trim();

  switch (normalizedRoleName) {
    case "ADMIN":
      // Admin gets ALL permissions
      return getAllPermissionNames();

    case "MANAGER":
      return [
        "dashboard:view",
        "dashboard:manager",
        "page:manager:overview",
        "page:manager:staff",
        "office:read",
        "office:configure",
        "service:read",
        "service:update",
        "service:manage",
        "staff:read",
        "staff:update",
        "request:read",
        "request:update",
        "request:approve-manager",
        "appointment:read",
        "appointment:update",
        "report:read",
        "report:create",
        "profile:read",
        "profile:update",
        "profile:change-password",
        "feedback:read",
      ];

    case "STAFF":
      return [
        "dashboard:view",
        "dashboard:staff",
        "page:staff:overview",
        "service:read",
        "request:read",
        "request:update",
        "request:approve-staff",
        "appointment:read",
        "appointment:update",
        "appointment:approve",
        "profile:read",
        "profile:update",
        "profile:change-password",
      ];

    case "CUSTOMER":
      return [
        "dashboard:view",
        "dashboard:customer",
        "page:customer:overview",
        "office:read",
        "service:read",
        "request:create",
        "request:read",
        "appointment:create",
        "appointment:read",
        "feedback:create",
        "profile:read",
        "profile:update",
        "profile:change-password",
      ];

    default:
      console.warn(`Unknown role: ${roleName}`);
      return [];
  }
}

/**
 * Get all permission names (for admin role)
 */
function getAllPermissionNames(): string[] {
  return [
    "user:create",
    "user:read",
    "user:update",
    "user:delete",
    "user:manage",
    "office:create",
    "office:read",
    "office:update",
    "office:delete",
    "office:manage",
    "office:configure",
    "service:create",
    "service:read",
    "service:update",
    "service:delete",
    "service:manage",
    "service:assign-staff",
    "request:create",
    "request:read",
    "request:update",
    "request:delete",
    "request:approve-staff",
    "request:approve-manager",
    "request:approve-admin",
    "request:view-all",
    "appointment:create",
    "appointment:read",
    "appointment:update",
    "appointment:delete",
    "appointment:approve",
    "appointment:manage",
    "staff:create",
    "staff:read",
    "staff:update",
    "staff:delete",
    "staff:manage",
    "report:create",
    "report:read",
    "report:update",
    "report:delete",
    "report:view-all",
    "role:create",
    "role:read",
    "role:update",
    "role:delete",
    "role:assign-permissions",
    "role:manage",
    "permission:read",
    "language:read",
    "language:update",
    "language:manage",
    "configuration:read",
    "configuration:update",
    "profile:read",
    "profile:update",
    "profile:change-password",
    "feedback:read",
    "feedback:create",
    "dashboard:view",
    "dashboard:admin",
    "dashboard:manager",
    "dashboard:staff",
    "dashboard:customer",
    "page:admin:overview",
    "page:admin:office",
    "audit:read",
    "page:manager:overview",
    "page:manager:staff",
    "page:staff:overview",
    "page:customer:overview",
  ];
}

/**
 * Assign default permissions to a role based on its name
 * @param roleId - The role ID
 * @param roleName - The role name (will be normalized internally)
 * @returns Object with success status and assigned permissions count
 */
export async function assignDefaultPermissionsToRole(
  roleId: string,
  roleName: string,
): Promise<{ success: boolean; assignedCount: number; error?: string }> {
  try {
    // Get permission names for this role
    const permissionNames = getRolePermissions(roleName);

    if (permissionNames.length === 0) {
      return {
        success: true,
        assignedCount: 0,
        error: `No default permissions defined for role: ${roleName}`,
      };
    }

    // Find all permissions in the database
    const permissions = await prisma.permission.findMany({
      where: {
        name: {
          in: permissionNames,
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (permissions.length === 0) {
      return {
        success: false,
        assignedCount: 0,
        error: `No permissions found in database for role: ${roleName}. Please run permission seed first.`,
      };
    }

    // Get existing role permissions to avoid duplicates
    const existingRolePermissions = await prisma.rolePermission.findMany({
      where: { roleId },
      select: { permissionId: true },
    });

    const existingPermissionIds = new Set(
      existingRolePermissions.map((rp) => rp.permissionId),
    );

    // Filter out permissions that are already assigned
    const permissionsToAssign = permissions.filter(
      (perm) => !existingPermissionIds.has(perm.id),
    );

    if (permissionsToAssign.length === 0) {
      return {
        success: true,
        assignedCount: permissions.length,
        error: `All permissions are already assigned to role: ${roleName}`,
      };
    }

    // Create role permissions using createMany (will skip duplicates due to unique constraint)
    await prisma.rolePermission.createMany({
      data: permissionsToAssign.map((perm) => ({
        roleId,
        permissionId: perm.id,
      })),
      skipDuplicates: true,
    });

    // Log missing permissions (if any)
    const foundPermissionNames = new Set(permissions.map((p) => p.name));
    const missingPermissions = permissionNames.filter(
      (name) => !foundPermissionNames.has(name),
    );

    if (missingPermissions.length > 0) {
      console.warn(
        `⚠️  Some permissions for role '${roleName}' were not found in database:`,
        missingPermissions,
      );
    }

    return {
      success: true,
      assignedCount: permissionsToAssign.length,
    };
  } catch (error: any) {
    console.error(`Error assigning permissions to role ${roleName}:`, error);
    return {
      success: false,
      assignedCount: 0,
      error: error.message || "Error assigning permissions",
    };
  }
}
