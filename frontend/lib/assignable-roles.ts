import { isOfficeAssignableRole } from "@/lib/roles";

/** A role as the roles API returns it. */
export type ApiRole = {
  id: string;
  name?: string | null;
  officeId?: string | null;
  office?: { id: string; name: string } | null;
};

/** One entry in a role dropdown — a real role, identified by its own id. */
export type AssignableRole = {
  /** The role's id. This is what gets submitted. */
  id: string;
  /** Title-cased name for display. */
  label: string;
  /** The office it belongs to, or null for a shared base role. */
  officeId: string | null;
  officeName: string | null;
};

const titleCase = (name: string) =>
  name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

/**
 * The roles that may be assigned within a given office scope, as distinct
 * entries.
 *
 * Roles are stored per office and their names are not unique — a database can
 * hold two dozen rows all called "manager", one per office. Collapsing them by
 * name (as the dropdowns used to) hid every role after the first with a given
 * name, so a second role in an office simply never appeared, and submitting a
 * name left the server to guess which row was meant.
 *
 * Keying on `id` fixes both: every role of the chosen office is listed, and the
 * exact row is submitted.
 *
 * @param officeId  The office being assigned into, or null/undefined for none —
 *                  in which case only the shared base roles are offered.
 * @param opts.officeOnly  Drop roles that cannot belong to an office member,
 *                         i.e. the customer role. Used by the staff dialog.
 */
export function assignableRoles(
  roles: ApiRole[],
  officeId: string | null | undefined,
  opts: { officeOnly?: boolean } = {},
): AssignableRole[] {
  const scoped = roles.filter((role) => {
    const name = role.name?.trim();
    if (!name) return false;
    if (opts.officeOnly && !isOfficeAssignableRole(name)) return false;

    // A shared base role is always available; an office's own role only when
    // that office is the one being assigned into.
    if (!role.officeId) return true;
    return Boolean(officeId) && role.officeId === officeId;
  });

  return scoped
    .map((role) => ({
      id: role.id,
      label: titleCase(role.name!.trim()),
      officeId: role.officeId ?? null,
      officeName: role.office?.name ?? null,
    }))
    .sort((a, b) => {
      // Office-specific roles first — they are the ones being chosen between —
      // then the shared roles, each group alphabetical.
      const aShared = a.officeId === null;
      const bShared = b.officeId === null;
      if (aShared !== bShared) return aShared ? 1 : -1;
      return a.label.localeCompare(b.label);
    });
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
