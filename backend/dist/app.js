import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.js";
import { auditLogger } from "./middleware/audit.js";
import routes from "./routes/index.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.use(helmet({}));
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    credentials: true, // if you're using cookies or auth headers
    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "Cache-Control",
        "Pragma",
    ],
}));
// Increase payload size limit for file uploads (1GB = 1000MB)
app.use(express.json({ limit: "1000mb" }));
app.use(express.urlencoded({ extended: true, limit: "1000mb" }));
app.use(cookieParser());
app.use(morgan("dev"));
// Serve static files from uploads and filedata directories
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/filedata", express.static(path.join(__dirname, "../filedata")));
// Swagger API Documentation
// Register at root level for local development
try {
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
        customCss: ".swagger-ui .topbar { display: none }",
        customSiteTitle: "E-service  API Documentation",
        swaggerOptions: {
            persistAuthorization: true, // Keep auth token after page refresh
        },
    }));
    // Also register under /back-api for production compatibility
    app.use("/back-api/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
        customCss: ".swagger-ui .topbar { display: none }",
        customSiteTitle: "E-service  API Documentation",
        swaggerOptions: {
            persistAuthorization: true,
        },
    }));
    // Serve Swagger JSON spec at root level
    app.get("/api-docs.json", (_req, res) => {
        res.setHeader("Content-Type", "application/json");
        res.send(swaggerSpec);
    });
    // Also serve Swagger JSON spec under /back-api for production
    app.get("/back-api/api-docs.json", (_req, res) => {
        res.setHeader("Content-Type", "application/json");
        res.send(swaggerSpec);
    });
    console.log("[App] ✅ Swagger UI available at /api-docs (local)");
    console.log("[App] ✅ Swagger UI available at /back-api/api-docs (production)");
    console.log("[App] ✅ Swagger JSON spec available at /api-docs.json and /back-api/api-docs.json");
}
catch (error) {
    console.error("[App] ❌ Error setting up Swagger:", error);
}
// Root route
app.get("/", (_req, res) => {
    res.json({
        message: "E-service System API",
        version: "1.0.0",
        endpoints: {
            health: "/back-api/health",
            auth: "/back-api/auth",
            docs: {
                local: "/api-docs",
                production: "/back-api/api-docs",
            },
            docsJson: {
                local: "/api-docs.json",
                production: "/back-api/api-docs.json",
            },
        },
    });
});
// Test route to verify Swagger setup
app.get("/test-swagger", (_req, res) => {
    res.json({
        message: "Swagger test route",
        swaggerAvailable: !!swaggerSpec,
        swaggerPath: "/api-docs",
    });
});
// Simple health check that doesn't require database
app.get("/back-api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});
// Debug middleware to log all incoming API requests (before routes)
app.use("/back-api", (req, res, next) => {
    console.log(`[App] Incoming request: ${req.method} ${req.originalUrl}`);
    console.log(`[App] Request path: ${req.path}`);
    console.log(`[App] Request query:`, req.query);
    next();
});
// Audit logger: capture activity for all API requests
app.use("/back-api", auditLogger);
// Register API routes
app.use("/back-api", routes);
app.get("/back-api/ping", (_req, res) => {
    res.json({
        message: "API is reachable",
        timestamp: new Date().toISOString(),
    });
});
// 404 handler - must be last
app.use((req, res) => {
    console.log(`[404] Route not found: ${req.method} ${req.originalUrl}`);
    console.log(`[404] Path: ${req.path}`);
    console.log(`[404] Base URL: ${req.baseUrl}`);
    res.status(404).json({
        error: "NotFound",
        message: `Route ${req.originalUrl} does not exist.`,
    });
});
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err, _req, res, _next) => {
    console.error("❌ Error:", err);
    const status = err.status ?? 500;
    res.status(status).json({
        error: err.name || "InternalServerError",
        message: err.message || "An unexpected error occurred.",
    });
});
export default app;
//# sourceMappingURL=app.js.map