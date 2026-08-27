import { prisma } from "../src/lib/db.ts";
import { assignDefaultPermissionsToRole } from "./role-permissions-assignment.ts";

/**
 * Gives every existing role the default permissions defined for its name.
 *
 * Two naming conventions ended up in the permission table: `seed.ts` writes a
 * human label into `name` and the code into `code` ("Create Request" /
 * "request:create"), while `permission-seed.ts` writes the code into `name`.
 * `requireAuth` builds a user's permission list from `permission.name`, so only
 * the second kind can ever satisfy a `requirePermission("request:create")`
 * guard. A database seeded the first way therefore denies every guarded route.
 *
 * This reconciles that by assigning the code-named permissions to each role.
 * It only ever adds — `assignDefaultPermissionsToRole` skips grants that are
 * already present and deletes nothing — so custom grants made through the roles
 * screen survive, and re-running it is a no-op.
 *
 * Run `npx tsx prisma/permission-seed.ts` first so the permissions exist.
 *
 *   npm run assign:role-permissions
 */
async function main(): Promise<void> {
  const roles = await prisma.role.findMany({
    select: { id: true, name: true, officeId: true },
    orderBy: { name: "asc" },
  });

  if (roles.length === 0) {
    console.log("No roles found — nothing to do.");
    return;
  }

  console.log(`Assigning default permissions to ${roles.length} role(s)…\n`);

  let changed = 0;
  let skipped = 0;

  for (const role of roles) {
    const result = await assignDefaultPermissionsToRole(role.id, role.name);
    const where = role.officeId ? ` (office ${role.officeId})` : " (global)";

    if (!result.success) {
      console.warn(`  ✗ ${role.name}${where}: ${result.error}`);
      continue;
    }

    if (result.error) {
      // Reported as success with a note — nothing needed changing.
      console.log(`  · ${role.name}${where}: ${result.error}`);
      skipped++;
      continue;
    }

    console.log(
      `  ✓ ${role.name}${where}: ${result.assignedCount} permission(s) assigned`,
    );
    changed++;
  }

  console.log(
    `\n${changed} role(s) updated, ${skipped} already complete.\n` +
      "Signed-in users pick this up on their next sign-in, because permissions " +
      "are read into the session at login.",
  );
}

main()
  .catch((error) => {
    console.error("Failed to assign role permissions:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
