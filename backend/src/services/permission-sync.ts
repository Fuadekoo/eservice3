import {
  ALL_PERMISSION_NAMES,
  PERMISSION_CATALOGUE,
} from "../config/permissions.js";
import { defaultPermissionsFor } from "../config/role-permissions.js";
import { prisma } from "../lib/db.js";

/**
 * Reconciles the `permission` and `role_permission` tables against the
 * catalogue in `config/permissions.ts`.
 *
 * Permissions were previously created only by running `npm run seed:permissions`
 * by hand, and that script's list had fallen behind the code. A deployment that
 * skipped the step — or ran the older list — came up with guards referring to
 * permission rows that did not exist. Because `requirePermission` lets an
 * administrator through unconditionally, this looked fine to whoever set the
 * system up and denied everyone else: managers could not approve reports, and
 * staff and customers saw an empty sidebar.
 *
 * Running this at boot makes the catalogue a property of the deployed code
 * rather than of somebody's shell history.
 *
 * Three rules keep it safe to run on every start:
 *
 *   - It only ever inserts. No permission is renamed or deleted, so a
 *     permission created by hand through the admin screens survives.
 *   - It only tops up the three built-in roles (manager, staff, customer) with
 *     grants they are missing, and only from their declared defaults. A grant
 *     an administrator removed on purpose is re-added — which is the intended
 *     behaviour for a *default*, and the reason custom roles are left alone.
 *   - Every failure is logged and swallowed. The catalogue being stale must not
 *     stop the API from serving.
 */

/** Role names whose defaults are topped up automatically. */
const MANAGED_ROLE_NAMES = ["MANAGER", "STAFF", "CUSTOMER"];

let hasRun = false;

export type PermissionSyncResult = {
  permissionsCreated: number;
  grantsCreated: number;
  rolesTouched: string[];
};

/**
 * Insert any catalogue permission the database is missing.
 *
 * Matching is on `name` *or* `code`, because two seeding conventions ended up
 * in this table: `prisma/seed.ts` writes a human label into `name` and the code
 * into `code`, while `prisma/permission-seed.ts` writes the code into `name`.
 * Inserting on a `name` mismatch alone would create a duplicate row for a
 * permission that is already present under the other column.
 */
async function syncPermissions(): Promise<number> {
  const existing = await prisma.permission.findMany({
    select: { name: true, code: true },
  });

  const known = new Set<string>();
  for (const permission of existing) {
    if (permission.name) known.add(permission.name.trim());
    if (permission.code) known.add(permission.code.trim());
  }

  const missing = PERMISSION_CATALOGUE.filter(
    (permission) => !known.has(permission.name),
  );

  if (missing.length === 0) return 0;

  // `code` is unique, so it is only filled where the value is genuinely free —
  // otherwise a row seeded the other way round would collide on it.
  const takenCodes = new Set(
    existing.map((permission) => permission.code?.trim()).filter(Boolean),
  );

  const result = await prisma.permission.createMany({
    data: missing.map((permission) => ({
      name: permission.name,
      description: permission.description,
      ...(takenCodes.has(permission.name) ? {} : { code: permission.name }),
    })),
    skipDuplicates: true,
  });

  return result.count;
}

/**
 * Give the built-in roles every default permission they are missing.
 */
async function syncRoleDefaults(): Promise<{
  grantsCreated: number;
  rolesTouched: string[];
}> {
  const roles = await prisma.role.findMany({
    select: { id: true, name: true },
  });

  if (roles.length === 0) {
    return { grantsCreated: 0, rolesTouched: [] };
  }

  const permissions = await prisma.permission.findMany({
    select: { id: true, name: true, code: true },
  });

  // One id per identifier, so a default named with a code resolves whichever
  // column that database happens to store it in.
  const idByIdentifier = new Map<string, string>();
  for (const permission of permissions) {
    if (permission.name) idByIdentifier.set(permission.name.trim(), permission.id);
    if (permission.code) idByIdentifier.set(permission.code.trim(), permission.id);
  }

  let grantsCreated = 0;
  const rolesTouched: string[] = [];

  for (const role of roles) {
    const roleKey = role.name.trim().toUpperCase();
    const defaults = defaultPermissionsFor(role.name);

    // `null` means "an administrator, who holds everything".
    const wanted = defaults === null ? ALL_PERMISSION_NAMES : defaults;

    if (defaults !== null && !MANAGED_ROLE_NAMES.includes(roleKey)) {
      // A role somebody defined themselves. Its grants are theirs to manage.
      continue;
    }

    const wantedIds = new Set(
      wanted
        .map((name) => idByIdentifier.get(name))
        .filter((id): id is string => Boolean(id)),
    );

    if (wantedIds.size === 0) continue;

    const held = await prisma.rolePermission.findMany({
      where: { roleId: role.id },
      select: { permissionId: true },
    });
    const heldIds = new Set(held.map((entry) => entry.permissionId));

    const toGrant = [...wantedIds].filter((id) => !heldIds.has(id));
    if (toGrant.length === 0) continue;

    const created = await prisma.rolePermission.createMany({
      data: toGrant.map((permissionId) => ({ roleId: role.id, permissionId })),
      skipDuplicates: true,
    });

    grantsCreated += created.count;
    rolesTouched.push(role.name);
  }

  return { grantsCreated, rolesTouched };
}

/**
 * Bring the database's permission catalogue up to date with the code.
 *
 * Safe to call more than once; the second call in a process is a no-op unless
 * `force` is set, which the seed scripts use.
 */
export async function ensurePermissionCatalogue(
  options: { force?: boolean; silent?: boolean } = {},
): Promise<PermissionSyncResult | null> {
  if (hasRun && !options.force) return null;
  hasRun = true;

  try {
    const permissionsCreated = await syncPermissions();
    const { grantsCreated, rolesTouched } = await syncRoleDefaults();

    if (!options.silent && (permissionsCreated > 0 || grantsCreated > 0)) {
      console.log(
        `[permissions] Catalogue synced: ${permissionsCreated} permission(s) ` +
          `added, ${grantsCreated} grant(s) applied` +
          (rolesTouched.length > 0 ? ` to ${rolesTouched.join(", ")}` : "") +
          ". Signed-in users pick these up on their next sign-in.",
      );
    }

    return { permissionsCreated, grantsCreated, rolesTouched };
  } catch (error) {
    // The API must still serve if this fails — a stale catalogue is a
    // degradation, an unbootable server is an outage.
    console.error(
      "[permissions] Could not sync the permission catalogue. Guarded routes " +
        "may deny non-admin users until this succeeds.",
      error,
    );
    return null;
  }
}
