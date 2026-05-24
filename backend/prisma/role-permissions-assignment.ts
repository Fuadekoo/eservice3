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
  const normalizedRoleName = roleName.toLowerCase().trim();

  switch (normalizedRoleName) {
    case "admin":
    case "administrator":
      // Admin gets ALL permissions
      return getAllPermissionNames();

    case "manager":
    case "office_manager":
      return [
        // Dashboard
        "dashboard:manager",
        "dashboard:view",

        // Manager Dashboard Pages
        "page:manager:overview",
        "page:manager:services",
        "page:manager:staff",
        "page:manager:request-management",
        "page:manager:report",
        "page:manager:appointment",
        "page:manager:configuration",
        "page:manager:availability",

        // Office Management (read only for their office)
        "office:read",
        "office:configure",

        // Service Management (for their office)
        "service:create",
        "service:read",
        "service:update",
        "service:delete",
        "service:assign-staff",
        "service:manage",

        // Staff Management (for their office)
        "staff:create",
        "staff:read",
        "staff:update",
        "staff:delete",
        "staff:assign-office",
        "staff:manage",

        // Request Management (for their office)
        "request:read",
        "request:update",
        "request:view-all",
        "request:approve-manager",

        // Appointment Management (for their office)
        "appointment:read",
        "appointment:update",
        "appointment:manage",

        // Report Management (for their office)
        "report:create",
        "report:read",
        "report:update",
        "report:delete",
        "report:send",
        "report:approve",
        "report:view-all",

        // Profile Management
        "profile:read",
        "profile:update",
        "profile:change-password",

        // File Management
        "file:upload",
        "file:download",

        // Configuration
        "configuration:read",
        "configuration:update",
      ];

    case "staff":
      return [
        // Dashboard
        "dashboard:staff",
        "dashboard:view",

        // Staff Dashboard Pages
        "page:staff:overview",
        "page:staff:request-management",
        "page:staff:appointment",
        "page:staff:service-management",
        "page:staff:report",
        "page:staff:profile",

        // Service Management (read only, for assigned services)
        "service:read",

        // Request Management (for assigned services)
        "request:read",
        "request:update",
        "request:approve-staff",

        // Appointment Management (for assigned services)
        "appointment:read",
        "appointment:update",
        "appointment:approve",

        // Report Management (for their office)
        "report:create",
        "report:read",
        "report:update",

        // Staff Management (read only, to see manager)
        "staff:read",

        // Profile Management
        "profile:read",
        "profile:update",
        "profile:change-password",

        // File Management
        "file:upload",
        "file:download",
      ];

    case "customer":
      return [
        // Dashboard
        "dashboard:customer",
        "dashboard:view",

        // Customer Dashboard Pages
        "page:customer:overview",
        "page:customer:apply-service",
        "page:customer:request",
        "page:customer:appointment",
        "page:customer:feedback",
        "page:customer:profile",

        // Office & Service (read only, to browse)
        "office:read",
        "service:read",

        // Request Management (own requests only)
        "request:create",
        "request:read",
        "request:update",
        "request:delete",

        // Appointment Management (own appointments only)
        "appointment:create",
        "appointment:read",
        "appointment:update",
        "appointment:delete",

        // Feedback Management (own feedback only)
        "feedback:read",
        "feedback:create",

        // Profile Management
        "profile:read",
        "profile:update",
        "profile:change-password",

        // File Management (for request files)
        "file:upload",
        "file:download",
      ];

    default:
      // Unknown role - return empty array (can be customized later)
      console.warn(
        `Unknown role type: ${roleName}. No default permissions assigned.`,
      );
      return [];
  }
}

/**
 * Get all permission names (for admin role)
 * @returns Array of all permission names
 */
function getAllPermissionNames(): string[] {
  return [
    // User Management
    "user:create",
    "user:read",
    "user:update",
    "user:delete",
    "user:manage",

    // Office Management
    "office:create",
    "office:read",
    "office:update",
    "office:delete",
    "office:manage",
    "office:configure",

    // Service Management
    "service:create",
    "service:read",
    "service:update",
    "service:delete",
    "service:manage",
    "service:assign-staff",

    // Request Management
    "request:create",
    "request:read",
    "request:update",
    "request:delete",
    "request:approve-staff",
    "request:approve-manager",
    "request:approve-admin",
    "request:view-all",

    // Appointment Management
    "appointment:create",
    "appointment:read",
    "appointment:update",
    "appointment:delete",
    "appointment:approve",
    "appointment:manage",

    // Staff Management
    "staff:create",
    "staff:read",
    "staff:update",
    "staff:delete",
    "staff:assign-office",
    "staff:manage",

    // Report Management
    "report:create",
    "report:read",
    "report:update",
    "report:delete",
    "report:send",
    "report:approve",
    "report:view-all",

    // Gallery Management
    "gallery:create",
    "gallery:read",
    "gallery:update",
    "gallery:delete",
    "gallery:manage",
    "gallery:upload-images",

    // Role & Permission Management
    "role:create",
    "role:read",
    "role:update",
    "role:delete",
    "role:assign-permissions",
    "role:manage",
    "permission:read",
    "permission:manage",

    // Language & Translation Management
    "language:read",
    "language:update",
    "language:manage",

    // About Page Management
    "about:read",
    "about:update",
    "about:manage",

    // Administration Page Management
    "administration:read",
    "administration:update",
    "administration:manage",

    // Feedback Management
    "feedback:read",
    "feedback:create",
    "feedback:manage",

    // File Management
    "file:upload",
    "file:download",
    "file:delete",
    "file:manage",

    // Dashboard & Overview
    "dashboard:view",
    "dashboard:admin",
    "dashboard:manager",
    "dashboard:staff",
    "dashboard:customer",

    // Admin Dashboard Pages
    "page:admin:overview",
    "page:admin:user-management",
    "page:admin:office",
    "page:admin:my-office",
    "page:admin:request-management",
    "page:admin:report",
    "page:admin:languages",
    "page:admin:gallery",
    "page:admin:about",
    "page:admin:profile",

    // Manager Dashboard Pages
    "page:manager:overview",
    "page:manager:services",
    "page:manager:staff",
    "page:manager:request-management",
    "page:manager:report",
    "page:manager:appointment",
    "page:manager:configuration",
    "page:manager:availability",

    // Staff Dashboard Pages
    "page:staff:overview",
    "page:staff:request-management",
    "page:staff:appointment",
    "page:staff:service-management",
    "page:staff:report",
    "page:staff:profile",

    // Customer Dashboard Pages
    "page:customer:overview",
    "page:customer:apply-service",
    "page:customer:request",
    "page:customer:appointment",
    "page:customer:feedback",
    "page:customer:profile",

    // Configuration
    "configuration:read",
    "configuration:update",
    "configuration:manage",

    // Profile Management
    "profile:read",
    "profile:update",
    "profile:change-password",

    // SMS & OTP
    "sms:send",
    "otp:send",
    "otp:verify",
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
