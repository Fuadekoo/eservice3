/**
 * Role de-duplication for filter and assignment dropdowns.
 *
 * Roles are stored per-office and their `name` column is not unique, so the
 * same logical role (e.g. "MANAGER") exists many times — once per office plus
 * an optional global copy — and often with mixed casing ("manager" vs
 * "MANAGER"). Listing them raw produces confusing, repeated dropdown entries.
 *
 * This collapses roles to one entry per distinct name (case-insensitive). The
 * returned `key` is the lower-cased name — pass it to APIs as `roleName`, which
 * the backend matches case-insensitively — and `label` is a Title-cased display
 * name.
 */
export type DistinctRole = {
  /** Lower-cased role name; send this to the API as `roleName`. */
  key: string;
  /** Title-cased name for display. */
  label: string;
};

export function dedupeRolesByName(
  roles: Array<{ name?: string | null }>,
): DistinctRole[] {
  const seen = new Map<string, string>();

  for (const role of roles) {
    const name = role.name?.trim();
    if (!name) {
      continue;
    }
    const key = name.toLowerCase();
    if (!seen.has(key)) {
      seen.set(key, name.charAt(0).toUpperCase() + name.slice(1).toLowerCase());
    }
  }

  return Array.from(seen, ([key, label]) => ({ key, label })).sort((a, b) =>
    a.label.localeCompare(b.label),
  );
}
