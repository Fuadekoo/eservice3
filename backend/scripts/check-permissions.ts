/**
 * Fails the build when a permission is guarded but not catalogued.
 *
 * The reported defect — "permissions not pre-seeded" — was this drift. Routes
 * and dashboard pages were written against permission codes that
 * `prisma/permission-seed.ts` had never heard of, so the rows did not exist and
 * the guards denied everyone. It went unnoticed because `requirePermission`
 * lets administrators through without checking, and administrators are who
 * tests the system.
 *
 * `src/config/permissions.ts` is now the single source of truth, and this
 * compares three things against it:
 *
 *   1. Every permission named in a backend route guard.
 *   2. Every permission in ROLE_PERMISSION_DEFAULTS.
 *   3. Every permission in the frontend's config/page-access.ts.
 *
 * Run it with `npm run check:permissions`, or as part of `npm run build`.
 */

import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

import { ALL_PERMISSION_NAMES } from "../src/config/permissions.ts";
import { ROLE_PERMISSION_DEFAULTS } from "../src/config/role-permissions.ts";

const catalogued = new Set(ALL_PERMISSION_NAMES);
const problems: string[] = [];

/** Permission codes inside a requirePermission / requireAnyPermission call. */
function guardedPermissionsIn(source: string): string[] {
  const found: string[] = [];
  const callPattern =
    /require(?:Permission|AnyPermission|AllPermissions)\s*\(([^)]*)\)/g;

  for (const call of source.matchAll(callPattern)) {
    const args = call[1] ?? "";
    for (const literal of args.matchAll(/["']([^"']+)["']/g)) {
      const code = literal[1];
      if (code) found.push(code);
    }
  }

  return found;
}

function checkRouteGuards(): void {
  const routesDir = resolve(import.meta.dirname, "../src/routes");
  const files = readdirSync(routesDir).filter((name) => name.endsWith(".ts"));

  for (const file of files) {
    const source = readFileSync(join(routesDir, file), "utf8");

    for (const code of new Set(guardedPermissionsIn(source))) {
      if (!catalogued.has(code)) {
        problems.push(
          `routes/${file} guards on "${code}", which is not in the catalogue.`,
        );
      }
    }
  }
}

function checkRoleDefaults(): void {
  for (const [role, permissions] of Object.entries(ROLE_PERMISSION_DEFAULTS)) {
    for (const code of permissions) {
      if (!catalogued.has(code)) {
        problems.push(
          `${role} defaults include "${code}", which is not in the catalogue.`,
        );
      }
    }
  }
}

/**
 * The dashboard's page map.
 *
 * Skipped rather than failed when the frontend is not checked out beside the
 * backend, so this stays usable in a backend-only deployment.
 */
function checkFrontendPageAccess(): void {
  const pageAccess = resolve(
    import.meta.dirname,
    "../../frontend/config/page-access.ts",
  );

  if (!existsSync(pageAccess)) {
    console.log("· frontend/config/page-access.ts not found — skipping.");
    return;
  }

  const source = readFileSync(pageAccess, "utf8");
  const body = source.slice(
    source.indexOf("PAGE_ACCESS"),
    source.indexOf("export function resolvePageAccess"),
  );

  for (const literal of body.matchAll(/["']([a-z][a-zA-Z0-9_.:-]*[.:][a-zA-Z0-9_.:-]+)["']/g)) {
    const code = literal[1];
    if (code && !catalogued.has(code)) {
      problems.push(
        `frontend page-access declares "${code}", which is not in the catalogue.`,
      );
    }
  }
}

checkRouteGuards();
checkRoleDefaults();
checkFrontendPageAccess();

if (problems.length > 0) {
  console.error("\n❌ Permission catalogue is out of date:\n");
  for (const problem of new Set(problems)) {
    console.error("   · " + problem);
  }
  console.error(
    "\nAdd the missing entries to src/config/permissions.ts. A guard on a\n" +
      "permission that has no row denies every non-admin user, silently.\n",
  );
  process.exit(1);
}

console.log(
  `✅ Permission catalogue is complete (${catalogued.size} permissions).`,
);
