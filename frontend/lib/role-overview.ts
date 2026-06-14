const ADMIN_ROLES = new Set([
  "ADMIN",
  "ADMINISTRATOR",
  "SUPERADMIN",
  "SYSTEM_ADMIN",
]);

const MANAGER_ROLES = new Set(["MANAGER", "OFFICE_MANAGER"]);

export function normalizeRoleName(roleName?: string | null) {
  return roleName?.trim().toUpperCase() ?? "";
}

export function getRoleOverviewPath(roleName?: string | null) {
  const normalizedRole = normalizeRoleName(roleName);

  if (ADMIN_ROLES.has(normalizedRole)) {
    return "/admin-overview";
  }

  if (MANAGER_ROLES.has(normalizedRole)) {
    return "/manager-overview";
  }

  if (normalizedRole === "STAFF") {
    return "/staff-overview";
  }

  if (normalizedRole === "CUSTOMER") {
    return "/customer-overview";
  }

  return null;
}

export const OVERVIEW_ROLES = {
  admin: Array.from(ADMIN_ROLES),
  manager: Array.from(MANAGER_ROLES),
  staff: ["STAFF"],
  customer: ["CUSTOMER"],
};
