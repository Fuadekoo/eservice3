/**
 * The complete catalogue of permissions this system recognises.
 *
 * Every permission guarded in a route, every entry in
 * ROLE_PERMISSION_DEFAULTS, and every path in the frontend's
 * config/page-access.ts must appear here. That was not previously true:
 * prisma/permission-seed.ts listed 71 of them while the code guarded on
 * roughly a hundred, so any route or page gated on one of the missing ones
 * denied everyone except an administrator — administrators bypass the check
 * entirely, which is why the gap survived testing. A manager could not approve
 * a report (report:approve), and none of the page:* grants a non-admin role
 * needs in order to see its own sidebar existed at all.
 *
 * This list is the single source of truth. services/permission-sync.ts
 * reconciles the database against it at boot, and prisma/permission-seed.ts
 * seeds from it, so the two can no longer disagree.
 */

export type PermissionDefinition = {
  /** The code guards are written against; also what `permission.name` holds. */
  name: string;
  /** What a person reading the roles screen should understand it to mean. */
  description: string;
  /** Grouping for the roles screen. */
  group: string;
};

export const PERMISSION_CATALOGUE: PermissionDefinition[] = [
  // ── Users ────────────────────────────────────────────────────────────────
  { name: "user:create", description: "Create new users", group: "Users" },
  { name: "user:read", description: "View users", group: "Users" },
  { name: "user:update", description: "Update user information", group: "Users" },
  { name: "user:delete", description: "Delete users", group: "Users" },
  { name: "user:manage", description: "Full user management", group: "Users" },

  // ── Offices ──────────────────────────────────────────────────────────────
  { name: "office:create", description: "Create new offices", group: "Offices" },
  { name: "office:read", description: "View offices", group: "Offices" },
  { name: "office:update", description: "Update office information", group: "Offices" },
  { name: "office:delete", description: "Delete offices", group: "Offices" },
  { name: "office:manage", description: "Full office management", group: "Offices" },
  { name: "office:configure", description: "Configure office settings and availability", group: "Offices" },

  // ── Services ─────────────────────────────────────────────────────────────
  { name: "service:create", description: "Create new services", group: "Services" },
  { name: "service:read", description: "View services", group: "Services" },
  { name: "service:update", description: "Update service information", group: "Services" },
  { name: "service:delete", description: "Delete services", group: "Services" },
  { name: "service:manage", description: "Full service management", group: "Services" },
  { name: "service:assign-staff", description: "Assign staff to services", group: "Services" },

  // ── Requests ─────────────────────────────────────────────────────────────
  { name: "request:create", description: "Submit a service request", group: "Requests" },
  { name: "request:create-for-other", description: "Submit a request on behalf of a family member", group: "Requests" },
  { name: "request:read", description: "View service requests", group: "Requests" },
  { name: "request:update", description: "Update service requests", group: "Requests" },
  { name: "request:delete", description: "Delete service requests", group: "Requests" },
  { name: "request:approve-staff", description: "Approve requests (staff review)", group: "Requests" },
  { name: "request:approve-manager", description: "Approve requests (manager sign-off)", group: "Requests" },
  { name: "request:approve-admin", description: "Approve requests (administrator)", group: "Requests" },
  { name: "request:view-all", description: "View every request in the office", group: "Requests" },
  { name: "request:merge", description: "Merge duplicate requests into one", group: "Requests" },

  // ── Appointments ─────────────────────────────────────────────────────────
  { name: "appointment:create", description: "Book appointments", group: "Appointments" },
  { name: "appointment:read", description: "View appointments", group: "Appointments" },
  { name: "appointment:update", description: "Update or reschedule appointments", group: "Appointments" },
  { name: "appointment:reschedule", description: "Reschedule an appointment that was already confirmed", group: "Appointments" },
  { name: "appointment:delete", description: "Delete appointments", group: "Appointments" },
  { name: "appointment:approve", description: "Confirm appointments", group: "Appointments" },
  { name: "appointment:manage", description: "Full appointment management", group: "Appointments" },

  // ── Staff ────────────────────────────────────────────────────────────────
  { name: "staff:create", description: "Create staff members", group: "Staff" },
  { name: "staff:read", description: "View staff members", group: "Staff" },
  { name: "staff:update", description: "Update staff information", group: "Staff" },
  { name: "staff:delete", description: "Delete staff members", group: "Staff" },
  { name: "staff:manage", description: "Full staff management", group: "Staff" },
  { name: "staff:assign-office", description: "Assign a staff member to an office", group: "Staff" },

  // ── Reports ──────────────────────────────────────────────────────────────
  { name: "report:create", description: "Create reports", group: "Reports" },
  { name: "report:read", description: "View reports", group: "Reports" },
  { name: "report:update", description: "Update reports", group: "Reports" },
  { name: "report:delete", description: "Delete reports", group: "Reports" },
  { name: "report:send", description: "Send a report to a manager or administrator", group: "Reports" },
  { name: "report:approve", description: "Approve or reject a received report", group: "Reports" },
  { name: "report:view-all", description: "View every report in the office", group: "Reports" },

  // ── Roles and permissions ────────────────────────────────────────────────
  { name: "role:create", description: "Create roles", group: "Access control" },
  { name: "role:read", description: "View roles", group: "Access control" },
  { name: "role:update", description: "Update roles", group: "Access control" },
  { name: "role:delete", description: "Delete roles", group: "Access control" },
  { name: "role:assign-permissions", description: "Assign permissions to roles", group: "Access control" },
  { name: "role:manage", description: "Full role management", group: "Access control" },
  { name: "permission:read", description: "View permissions", group: "Access control" },
  { name: "permission:manage", description: "Create, edit and delete permissions", group: "Access control" },

  // ── Security screens ─────────────────────────────────────────────────────
  // The security routes were written against a dot-separated naming scheme
  // while the rest of the system uses colons. Both are kept, and seeded, so a
  // role granted through either screen actually satisfies the guard it meets.
  { name: "roles.view", description: "View roles (security screens)", group: "Access control" },
  { name: "roles.create", description: "Create roles (security screens)", group: "Access control" },
  { name: "roles.update", description: "Update roles (security screens)", group: "Access control" },
  { name: "roles.delete", description: "Delete roles (security screens)", group: "Access control" },
  { name: "permissions.view", description: "View permissions (security screens)", group: "Access control" },
  { name: "permissions.create", description: "Create permissions (security screens)", group: "Access control" },
  { name: "permissions.update", description: "Update permissions (security screens)", group: "Access control" },
  { name: "permissions.delete", description: "Delete permissions (security screens)", group: "Access control" },
  { name: "security_programs.view", description: "View security programs, audits, incidents and reminders", group: "Access control" },
  { name: "security_programs.create", description: "Create security programs, audits, incidents and reminders", group: "Access control" },
  { name: "security_programs.update", description: "Update security programs, audits, incidents and reminders", group: "Access control" },
  { name: "security_programs.delete", description: "Delete security programs, audits, incidents and reminders", group: "Access control" },

  // ── Audit ────────────────────────────────────────────────────────────────
  { name: "audit:read", description: "View audit logs", group: "Audit" },
  { name: "audit_logs.view", description: "View audit logs (security screens)", group: "Audit" },

  // ── Content and configuration ────────────────────────────────────────────
  { name: "language:read", description: "View languages and translations", group: "Content" },
  { name: "language:update", description: "Update translations", group: "Content" },
  { name: "language:manage", description: "Full language management", group: "Content" },
  { name: "gallery:manage", description: "Manage the public gallery", group: "Content" },
  { name: "about:manage", description: "Manage the public About page", group: "Content" },
  { name: "administration:manage", description: "Manage the administration listing", group: "Content" },
  { name: "configuration:read", description: "View system configuration", group: "Configuration" },
  { name: "configuration:update", description: "Update system configuration", group: "Configuration" },

  // ── Profile, files and feedback ──────────────────────────────────────────
  { name: "profile:read", description: "View own profile", group: "Profile" },
  { name: "profile:update", description: "Update own profile", group: "Profile" },
  { name: "profile:change-password", description: "Change own password", group: "Profile" },
  { name: "file:upload", description: "Upload attachments", group: "Files" },
  { name: "file:download", description: "Download attachments", group: "Files" },
  { name: "feedback:read", description: "View feedback", group: "Feedback" },
  { name: "feedback:create", description: "Submit feedback", group: "Feedback" },

  // ── Dashboards ───────────────────────────────────────────────────────────
  { name: "dashboard:view", description: "General dashboard access", group: "Dashboards" },
  { name: "dashboard:admin", description: "Administrator dashboard", group: "Dashboards" },
  { name: "dashboard:manager", description: "Manager dashboard", group: "Dashboards" },
  { name: "dashboard:staff", description: "Staff dashboard", group: "Dashboards" },
  { name: "dashboard:customer", description: "Customer dashboard", group: "Dashboards" },

  // ── Page access ──────────────────────────────────────────────────────────
  // One per dashboard page. These are what config/page-access.ts on the
  // frontend checks, so a role missing them sees an empty sidebar even when it
  // holds every underlying data permission.
  { name: "page:admin:overview", description: "Administrator overview page", group: "Pages" },
  { name: "page:admin:office", description: "Office management page", group: "Pages" },
  { name: "page:admin:my-office", description: "My office page", group: "Pages" },
  { name: "page:admin:user-management", description: "User management page", group: "Pages" },
  { name: "page:admin:request-management", description: "Request management page (admin)", group: "Pages" },
  { name: "page:admin:report", description: "Report management page (admin)", group: "Pages" },
  { name: "page:admin:appointment", description: "Appointments page (admin)", group: "Pages" },
  { name: "page:admin:roles", description: "Roles page", group: "Pages" },
  { name: "page:admin:permissions", description: "Permissions page", group: "Pages" },
  { name: "page:admin:audit-logs", description: "Audit logs page", group: "Pages" },
  { name: "page:admin:gallery", description: "Gallery management page", group: "Pages" },
  { name: "page:admin:about", description: "About management page", group: "Pages" },
  { name: "page:admin:languages", description: "Languages page", group: "Pages" },

  { name: "page:manager:overview", description: "Manager overview page", group: "Pages" },
  { name: "page:manager:staff", description: "Manager staff page", group: "Pages" },
  { name: "page:manager:services", description: "Manager services page", group: "Pages" },
  { name: "page:manager:appointment", description: "Manager appointments page", group: "Pages" },
  { name: "page:manager:request-management", description: "Manager request management page", group: "Pages" },
  { name: "page:manager:report", description: "Manager report page", group: "Pages" },
  { name: "page:manager:configuration", description: "Manager configuration page", group: "Pages" },
  { name: "page:manager:availability", description: "Manager availability page", group: "Pages" },

  { name: "page:staff:overview", description: "Staff overview page", group: "Pages" },
  { name: "page:staff:appointment", description: "Staff appointments page", group: "Pages" },
  { name: "page:staff:report", description: "Staff report page", group: "Pages" },
  { name: "page:staff:request-management", description: "Staff request management page", group: "Pages" },
  { name: "page:staff:service-management", description: "Staff service page", group: "Pages" },
  { name: "page:staff:profile", description: "Staff profile page", group: "Pages" },

  { name: "page:customer:overview", description: "Customer overview page", group: "Pages" },
  { name: "page:customer:apply-service", description: "Apply for a service page", group: "Pages" },
  { name: "page:customer:request", description: "My requests page", group: "Pages" },
  { name: "page:customer:appointment", description: "Customer appointments page", group: "Pages" },
  { name: "page:customer:feedback", description: "Customer feedback page", group: "Pages" },
  { name: "page:customer:profile", description: "Customer profile page", group: "Pages" },
];

/** Every permission code, in catalogue order. */
export const ALL_PERMISSION_NAMES: string[] = PERMISSION_CATALOGUE.map(
  (permission) => permission.name,
);

const CATALOGUE_BY_NAME = new Map(
  PERMISSION_CATALOGUE.map((permission) => [permission.name, permission]),
);

export function findPermission(name: string): PermissionDefinition | undefined {
  return CATALOGUE_BY_NAME.get(name);
}
