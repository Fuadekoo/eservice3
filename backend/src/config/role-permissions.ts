/**
 * What each role is allowed to do, and what it may hand on to others.
 *
 * This is the one place default permissions are declared. `prisma/
 * role-permissions-assignment.ts` reads its defaults from here, so seeding a
 * database and granting permissions at runtime can never drift apart.
 *
 * Names match `permission.name` in the database, because that is the column
 * `requireAuth` builds a user's permission list from — see the note in
 * prisma/assign-role-permissions.ts.
 */

/**
 * Permissions that administer the system itself rather than the day-to-day work
 * of an office.
 *
 * Two rules follow from being on this list: no non-admin role gets them by
 * default, and no non-admin may grant them to a role they create. A manager
 * running their office should never be able to mint a role that edits
 * permissions, reads the audit log, or manages user accounts across offices.
 */
export const ADMIN_ONLY_PREFIXES = [
  "user:",
  "permission:",
  "role:create",
  "role:update",
  "role:delete",
  "role:manage",
  "role:assign-permissions",
  "audit",
  "language:",
  "about:",
  "administration:",
  "gallery:",
  "sms:",
  "otp:",
  "page:admin:",
  "dashboard:admin",
  "office:create",
  "office:delete",
  "office:manage",
] as const;

/** Whether `name` may only ever belong to an administrator. */
export function isAdminOnlyPermission(name: string): boolean {
  return ADMIN_ONLY_PREFIXES.some((prefix) => name.startsWith(prefix));
}

/**
 * Everything a manager needs to run one office.
 *
 * `role:read` is on the list because creating a staff member means choosing the
 * role to give them, and that dropdown reads `GET /security/roles`. Without it
 * the staff form 403s before it can be submitted — the manager can create staff
 * but cannot see the roles to assign. Note it is `role:read` only: a manager
 * may pick from existing roles, never define new ones.
 */
const MANAGER_PERMISSIONS = [
  // Dashboard & page access
  "dashboard:view",
  "dashboard:manager",
  "page:manager:overview",
  "page:manager:staff",
  "page:manager:services",
  "page:manager:appointment",
  "page:manager:request-management",
  "page:manager:report",
  "page:manager:configuration",
  "page:manager:availability",
  // Their own office
  "office:read",
  "office:update",
  "office:configure",
  // Services in that office
  "service:create",
  "service:read",
  "service:update",
  "service:delete",
  "service:manage",
  "service:assign-staff",
  // Staff in that office
  "staff:create",
  "staff:read",
  "staff:update",
  "staff:delete",
  "staff:manage",
  "staff:assign-office",
  // Reading roles is what makes staff creation possible.
  "role:read",
  // Requests and appointments
  "request:read",
  "request:update",
  "request:approve-manager",
  "request:view-all",
  "appointment:read",
  "appointment:update",
  "appointment:approve",
  "appointment:manage",
  // Reporting
  "report:create",
  "report:read",
  "report:update",
  "report:approve",
  "report:send",
  "report:view-all",
  // Configuration and their own profile
  "configuration:read",
  "configuration:update",
  "profile:read",
  "profile:update",
  "profile:change-password",
  "file:upload",
  "file:download",
  "feedback:read",
];

/** A staff member works a queue; they administer nothing. */
const STAFF_PERMISSIONS = [
  "dashboard:view",
  "dashboard:staff",
  "page:staff:overview",
  "page:staff:appointment",
  "page:staff:report",
  "page:staff:request-management",
  "page:staff:service-management",
  "page:staff:profile",
  "service:read",
  "staff:read",
  "request:read",
  "request:update",
  "request:approve-staff",
  "appointment:read",
  "appointment:update",
  "appointment:approve",
  "report:create",
  "report:read",
  "report:update",
  "profile:read",
  "profile:update",
  "profile:change-password",
  "file:upload",
  "file:download",
];

/** A customer uses the portal; they see only their own dealings. */
const CUSTOMER_PERMISSIONS = [
  "dashboard:view",
  "dashboard:customer",
  "page:customer:overview",
  "page:customer:apply-service",
  "page:customer:request",
  "page:customer:appointment",
  "page:customer:feedback",
  "page:customer:profile",
  "office:read",
  "service:read",
  "request:create",
  "request:create-for-other",
  "request:read",
  "request:update",
  "request:delete",
  "appointment:create",
  "appointment:read",
  "appointment:update",
  "appointment:delete",
  "feedback:create",
  "feedback:read",
  "profile:read",
  "profile:update",
  "profile:change-password",
  "file:upload",
  "file:download",
];

/** Defaults per role, keyed by the upper-cased role name. */
export const ROLE_PERMISSION_DEFAULTS: Record<string, string[]> = {
  MANAGER: MANAGER_PERMISSIONS,
  STAFF: STAFF_PERMISSIONS,
  CUSTOMER: CUSTOMER_PERMISSIONS,
};

/**
 * The default permissions for a role name.
 *
 * ADMIN is deliberately absent from the table above and answered here instead:
 * an administrator holds whatever exists, so listing them would be a second
 * copy of the catalogue that quietly falls behind. `null` means "everything" —
 * callers resolve it against the permissions actually in the database.
 */
export function defaultPermissionsFor(roleName: string): string[] | null {
  const key = roleName.toUpperCase().trim();
  if (key === "ADMIN" || key === "ADMINISTRATOR" || key === "SUPERADMIN") {
    return null;
  }
  return ROLE_PERMISSION_DEFAULTS[key] ?? [];
}

/**
 * Which of `available` the caller may put on a role they are creating.
 *
 * Two rules, both standard for delegated administration:
 *
 *   1. Nobody but an admin may grant a system-level permission.
 *   2. Nobody may grant a permission they do not themselves hold — otherwise a
 *      manager could create a role more powerful than their own and assume it.
 */
export function delegatablePermissions(
  available: string[],
  holder: { isAdmin: boolean; permissions: string[] },
): string[] {
  if (holder.isAdmin) return available;

  const held = new Set(holder.permissions);
  return available.filter(
    (name) => !isAdminOnlyPermission(name) && held.has(name),
  );
}
