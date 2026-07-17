import "dotenv/config";
import app from "./app.js";
import { prisma } from "./lib/db.js";
import { startAuditCleanupScheduler } from "./services/audit-cleanup.js";
const port = Number(process.env.PORT ?? 3000);
/**
 * The adapter opens its first connection lazily, so without this the first
 * request to arrive pays the whole connect cost — which is seconds when the
 * database itself is still cold. Spend it at boot instead of on a visitor.
 */
async function warmDatabasePool() {
    const start = Date.now();
    try {
        await prisma.$queryRaw `SELECT 1`;
        console.log(`[DB] ✅ Connection pool warm (${Date.now() - start}ms)`);
    }
    catch (error) {
        // A cold pool is recoverable — requests reconnect on their own. Log and
        // keep serving rather than taking the process down over a warmup probe.
        console.error(`[DB] ⚠️  Warmup failed after ${Date.now() - start}ms; first request will reconnect.`, error);
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
});
//# sourceMappingURL=server.js.map