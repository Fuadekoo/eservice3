import { PERMISSION_CATALOGUE } from "../src/config/permissions.ts";
import { ensurePermissionCatalogue } from "../src/services/permission-sync.ts";
import { prisma } from "../src/lib/db.ts";

/**
 * Permission seed.
 *
 * The catalogue itself lives in `src/config/permissions.ts` and is applied by
 * `src/services/permission-sync.ts`, which also runs automatically at server
 * start. This script exists so the same reconciliation can be triggered on
 * demand — after a restore, or before a first boot — and so it reports what it
 * did in a form a person can read.
 *
 * It used to hold its own hand-maintained list, which had drifted: it seeded 71
 * permissions while the code guarded on roughly a hundred, and every route or
 * page gated on one of the missing ones denied all but administrators. Keeping
 * one list in one place is what stops that recurring.
 *
 *   npm run seed:permissions
 */
async function main() {
  console.log("🌱 Syncing the permission catalogue…\n");

  // Confirm the schema is actually in place, so a missing migration reports
  // itself clearly instead of as an opaque query failure.
  try {
    await prisma.$queryRaw`SELECT 1 FROM permission LIMIT 1`;
  } catch (error: any) {
    if (error.code === "P2021" || error.code === "42S02") {
      console.error("❌ The database tables do not exist yet.");
      console.error("   Run the migrations first:\n");
      console.error("     npx prisma migrate deploy\n");
      throw new Error(
        "Database tables are missing. Run `npx prisma migrate deploy` first.",
      );
    }
    throw error;
  }

  console.log(`📝 Catalogue holds ${PERMISSION_CATALOGUE.length} permissions.`);

  const result = await ensurePermissionCatalogue({ force: true, silent: true });

  if (!result) {
    throw new Error(
      "Permission sync failed. The error above says why; nothing was changed.",
    );
  }

  const total = await prisma.permission.count();

  console.log("\n📊 Summary:");
  console.log(`   ✅ Added:   ${result.permissionsCreated} permission(s)`);
  console.log(`   ✅ Granted: ${result.grantsCreated} role permission(s)`);
  if (result.rolesTouched.length > 0) {
    console.log(`   👥 Roles updated: ${result.rolesTouched.join(", ")}`);
  }
  console.log(`   📦 Total in database: ${total}\n`);

  console.log("🎉 Permission catalogue is up to date.");
  console.log(
    "\n💡 Signed-in users pick up new grants on their next sign-in, because " +
      "permissions are read into the session at login.",
  );
}

main()
  .catch((e) => {
    console.error("❌ Permission seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
