import "dotenv/config";
import app from "./app.js";
import { assertSessionConfig } from "./config/session.js";
import { prisma } from "./lib/db.js";
import { startAuditCleanupScheduler } from "./services/audit-cleanup.js";
import { startSessionCleanupScheduler } from "./services/session-cleanup.js";
import { ensurePermissionCatalogue } from "./services/permission-sync.js";

const port = Number(process.env.PORT ?? 3000);

// Fails fast in production when tokens would be signed with the placeholder
// secret, and reports the configured session lifetimes either way.
assertSessionConfig();

/**
 * The adapter opens its first connection lazily, so without this the first
 * request to arrive pays the whole connect cost — which is seconds when the
 * database itself is still cold. Spend it at boot instead of on a visitor.
 */
async function warmDatabasePool(): Promise<void> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log(`[DB] ✅ Connection pool warm (${Date.now() - start}ms)`);
  } catch (error) {
    // A cold pool is recoverable — requests reconnect on their own. Log and
    // keep serving rather than taking the process down over a warmup probe.
    console.error(
      `[DB] ⚠️  Warmup failed after ${Date.now() - start}ms; first request will reconnect.`,
      error,
    );
  }
}

// Start server
app.listen(port, () => {
  console.log(`🚀 Server listening on port ${port}`);
  console.log(`📡 API available at http://localhost:${port}/back-api`);
  console.log(`🏥 Health check: http://localhost:${port}/back-api/health`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api-docs`);

  void warmDatabasePool();

  // Start audit log cleanup scheduler
  startAuditCleanupScheduler();

  // Drop sessions that have expired, so the device list stays truthful.
  startSessionCleanupScheduler();

  // Make sure every permission the code guards on actually exists as a row,
  // and that the built-in roles hold their defaults. Without this a fresh or
  // partially seeded database denies pages to everyone but an administrator.
  void ensurePermissionCatalogue();
});
