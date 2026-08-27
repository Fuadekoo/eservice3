import { isAssignableRole, isOfficeAssignableRole } from "@/lib/roles";

/** A role as the roles API returns it. */
export type ApiRole = {
  id: string;
  name?: string | null;
};

/** One entry in a role dropdown — a real role, identified by its own id. */
export type AssignableRole = {
  /** The role's id. This is what gets submitted. */
  id: string;
  /** Title-cased name for display. */
  label: string;
};

const titleCase = (name: string) =>
  name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

/**
 * The roles that may be assigned, as distinct entries.
 *
 * Roles are global — a job description, not a place. Which office someone works
 * in is recorded on their staff row, so the same "manager" role serves every
 * office and there is nothing to filter by here.
 *
 * Entries are keyed on `id` rather than name so the exact row is submitted;
 * names are unique now, but an id says precisely what was chosen.
 *
 * Administrator roles are never listed: granting one from an account form
 * would turn "can add a colleague" into "can own the system". `keepRoleId`
 * exempts the role an account already holds, so editing an administrator
 * still shows their real role rather than a blank select.
 *
 * @param opts.officeOnly  Drop roles no office member can hold, i.e. the
 *                         customer role. Used by the staff dialog.
 * @param opts.keepRoleId  Always keep this role, whatever the rules say.
 */
export function assignableRoles(
  roles: ApiRole[],
  opts: { officeOnly?: boolean; keepRoleId?: string | undefined } = {},
): AssignableRole[] {
  return roles
    .filter((role) => {
      const name = role.name?.trim();
      if (!name) return false;
      if (opts.keepRoleId && role.id === opts.keepRoleId) return true;
      if (!isAssignableRole(name)) return false;
      return !opts.officeOnly || isOfficeAssignableRole(name);
    })
    .map((role) => ({ id: role.id, label: titleCase(role.name!.trim()) }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/** Whether `roleId` refers to a role no office member can hold (customer). */
export function isCustomerRoleId(
  roles: ApiRole[],
  roleId: string | undefined,
): boolean {
  if (!roleId) return false;
  const role = roles.find((entry) => entry.id === roleId);
  return Boolean(role?.name) && !isOfficeAssignableRole(role!.name!);
}
