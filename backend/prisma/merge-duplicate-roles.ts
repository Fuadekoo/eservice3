import { prisma } from "../src/lib/db.ts";

/**
 * Collapses per-office duplicates of a role into one role per name.
 *
 * Roles used to carry an `officeId`, so each office got its own copy of
 * "manager" — two dozen rows describing the same job. Office membership belongs
 * to the staff row, not the role, so the copies are being removed and `officeId`
 * dropped from `role`.
 *
 * The survivor for each name is the row with the most permissions, because a
 * narrower copy is the one that has fallen behind. Every permission held by any
 * copy is then added to the survivor, so no user can come out with less than
 * they had, and users are repointed before the losers are deleted.
 *
 * Safe to re-run: with one role per name there is nothing to merge, and
 * `role.name` is unique now, so it should always report exactly that. Kept
 * as a check rather than deleted — a database restored from an older dump
 * still needs it.
 *
 *   npm run merge:duplicate-roles
 */

type RoleRow = {
  id: string;
  name: string;
  rolePermissions: { permissionId: string }[];
  users: { id: string }[];
};

function groupByName(roles: RoleRow[]): Map<string, RoleRow[]> {
  const groups = new Map<string, RoleRow[]>();
  for (const role of roles) {
    const key = role.name.trim().toLowerCase();
    groups.set(key, [...(groups.get(key) ?? []), role]);
  }
  return groups;
}

/** The row to keep: most permissions, with the id breaking ties. */
function pickSurvivor(group: RoleRow[]): RoleRow {
  return [...group].sort(
    (a, b) =>
      b.rolePermissions.length - a.rolePermissions.length ||
      a.id.localeCompare(b.id),
  )[0]!;
}

async function main(): Promise<void> {
  const roles = (await prisma.role.findMany({
    select: {
      id: true,
      name: true,
      rolePermissions: { select: { permissionId: true } },
      users: { select: { id: true } },
    },
  })) as RoleRow[];

  const groups = groupByName(roles);
  console.log(`${roles.length} role(s) across ${groups.size} distinct name(s)\n`);

  let merged = 0;
  let movedUsers = 0;
  let addedPermissions = 0;

  for (const [name, group] of groups) {
    if (group.length === 1) {
      console.log(`  ${name}: single row, nothing to merge`);
      continue;
    }

    const survivor = pickSurvivor(group);
    const losers = group.filter((role) => role.id !== survivor.id);

    await prisma.$transaction(async (tx) => {
      // Union the permissions onto the survivor first, so nobody is moved onto
      // a role that is briefly missing something they had.
      const held = new Set(survivor.rolePermissions.map((p) => p.permissionId));
      const missing = new Set<string>();
      for (const loser of losers) {
        for (const entry of loser.rolePermissions) {
          if (!held.has(entry.permissionId)) missing.add(entry.permissionId);
        }
      }

      if (missing.size > 0) {
        await tx.rolePermission.createMany({
          data: [...missing].map((permissionId) => ({
            roleId: survivor.id,
            permissionId,
          })),
          skipDuplicates: true,
        });
        addedPermissions += missing.size;
      }

      const loserIds = losers.map((role) => role.id);

      const moved = await tx.user.updateMany({
        where: { roleId: { in: loserIds } },
        data: { roleId: survivor.id },
      });
      movedUsers += moved.count;

      // Their permission rows go with them; the roles themselves then go.
      await tx.rolePermission.deleteMany({ where: { roleId: { in: loserIds } } });
      await tx.role.deleteMany({ where: { id: { in: loserIds } } });
    });

    merged += losers.length;
    console.log(
      `  ${name}: kept ${survivor.id} (${survivor.rolePermissions.length + 0} perms), ` +
        `removed ${losers.length} duplicate(s)`,
    );
  }

  console.log(
    `\n${merged} duplicate role(s) removed, ${movedUsers} user(s) repointed, ` +
      `${addedPermissions} permission(s) added to survivors.`,
  );

  if (merged > 0) {
    console.log(
      "Affected users pick up the change on their next sign-in, because " +
        "permissions are read into the session at login.",
    );
  }
}

main()
  .catch((error) => {
    console.error("Failed to merge duplicate roles:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
