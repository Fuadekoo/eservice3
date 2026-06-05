/**
 * Permission checking utilities
 */

/**
 * Check if user has a specific permission
 */
export function hasPermission(
  userPermissions: string[],
  requiredPermission: string
): boolean {
  return userPermissions.includes(requiredPermission);
}

/**
 * Check if user has any of the required permissions
 */
export function hasAnyPermission(
  userPermissions: string[],
  requiredPermissions: string[]
): boolean {
  return requiredPermissions.some((permission) =>
    userPermissions.includes(permission)
  );
}

/**
 * Check if user has all required permissions
 */
export function hasAllPermissions(
  userPermissions: string[],
  requiredPermissions: string[]
): boolean {
  return requiredPermissions.every((permission) =>
    userPermissions.includes(permission)
  );
}

/**
 * Check if user has a specific role
 */
export function hasRole(userRole: string | null, requiredRole: string): boolean {
  return userRole === requiredRole;
}

/**
 * Check if user is admin or manager (full access)
 */
export function isAdminOrManager(userRole: string | null): boolean {
  return userRole === "ADMIN" || userRole === "MANAGER";
}

/**
 * Permission mapping for common actions
 */
export const PermissionMap = {
  // Schools & Branches
  schools: {
    view: "schools.view",
    create: "schools.create",
    update: "schools.update",
    delete: "schools.delete",
  },
  branches: {
    view: "branches.view",
    create: "branches.create",
    update: "branches.update",
    delete: "branches.delete",
  },
  // Students
  students: {
    view: "students.view",
    create: "students.create",
    update: "students.update",
    delete: "students.delete",
    register: "students.register",
  },
  // Staff
  staff: {
    view: "staff.view",
    create: "staff.create",
    update: "staff.update",
    delete: "staff.delete",
  },
  // Academic
  academicYears: {
    view: "academic_years.view",
    create: "academic_years.create",
    update: "academic_years.update",
    delete: "academic_years.delete",
  },
  sections: {
    view: "sections.view",
    create: "sections.create",
    update: "sections.update",
    delete: "sections.delete",
  },
  classrooms: {
    view: "classrooms.view",
    create: "classrooms.create",
    update: "classrooms.update",
    delete: "classrooms.delete",
  },
  // Financial
  payments: {
    view: "payments.view",
    create: "payments.create",
    update: "payments.update",
    delete: "payments.delete",
  },
  fees: {
    view: "students.view", // Fees use students.view
    create: "fees.create",
    update: "students.update", // Fees use students.update
    delete: "fees.delete",
  },
  // Security
  roles: {
    view: "roles.view",
    create: "roles.create",
    update: "roles.update",
    delete: "roles.delete",
  },
  permissions: {
    view: "permissions.view",
    create: "permissions.create",
    update: "permissions.update",
    delete: "permissions.delete",
  },
} as const;

