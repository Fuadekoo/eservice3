import { prisma } from "../src/lib/db.ts";
import { defaultPermissionsFor } from "../src/config/role-permissions.ts";

/**
 * Role Permission Assignment Utility (for seed files)
 *
 * This module automatically assigns default permissions to roles when they are created.
 * Each role type (admin, manager, staff, customer) gets a predefined set of permissions.
 */

/**
 * The default permissions for a role name.
 *
 * The lists themselves live in src/config/role-permissions.ts so that seeding
 * and runtime assignment cannot drift apart. ADMIN resolves to every
 * permission in the database rather than to a second hand-maintained copy of
 * the catalogue.
 */
export async function getRolePermissions(roleName: string): Promise<string[]> {
  const defaults = defaultPermissionsFor(roleName);
  if (defaults !== null) return defaults;

  const all = await prisma.permission.findMany({ select: { name: true } });
  return all.map((permission) => permission.name);
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
    const permissionNames = await getRolePermissions(roleName);

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
