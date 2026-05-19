import "dotenv/config";
import app from "./app.js";
import { startAuditCleanupScheduler } from "./services/audit-cleanup.js";
const port = Number(process.env.PORT ?? 3000);
// Start server
app.listen(port, () => {
    console.log(`🚀 Server listening on port ${port}`);
    console.log(`📡 API available at http://localhost:${port}/back-api`);
    console.log(`🏥 Health check: http://localhost:${port}/back-api/health`);
    console.log(`📚 Swagger docs: http://localhost:${port}/api-docs`);
    console.log(`\n💡 Note: Database connection test is handled in prisma.ts`);
    // Start audit log cleanup scheduler
    startAuditCleanupScheduler();
});
//# sourceMappingURL=server.js.map