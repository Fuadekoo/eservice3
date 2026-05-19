import type { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/db.js";
import type { AuthRequest } from "./auth.js";

type AuditLogDelegate = {
  create(args: {
    data: {
      actor: string;
      role?: string;
      action: string;
      resource: string;
      status: string;
      metadata: Record<string, unknown>;
      userId?: string;
    };
  }): Promise<unknown>;
};

/**
 * Middleware to log activity for every API request.
 * It listens for the response finish event so it can capture final status code.
 * The middleware is tolerant if authentication hasn't run yet (actor will be `anonymous`).
 */
export function auditLogger(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const start = Date.now();
  const auditLog = (prisma as unknown as { auditLog?: AuditLogDelegate }).auditLog;

  // After response finishes, write an audit record (best-effort, non-blocking)
  res.on("finish", async () => {
    try {
      if (!auditLog) {
        return;
      }

      const duration = Date.now() - start;
      const authReq = req as AuthRequest;

      // Get actor information from authenticated user or use IP/unknown
      const actor =
        authReq.user?.username ||
        authReq.user?.name ||
        authReq.userId ||
        req.ip ||
        "anonymous";
      const role = authReq.user?.roleName;
      const userId = authReq.userId || authReq.user?.id;

      // Build a small metadata object - avoid storing large bodies
      const metadata: Record<string, unknown> = {
        method: req.method,
        path: req.originalUrl || req.path,
        durationMs: duration,
        userAgent: req.get("user-agent") || undefined,
      };

      // Include params if present
      if (req.params && Object.keys(req.params).length > 0) {
        metadata.params = req.params;
      }

      // Include query if present
      if (req.query && Object.keys(req.query).length > 0) {
        metadata.query = req.query;
      }

      // Include body for non-file requests but cap size by JSON.stringify length
      if (req.body && typeof req.body === "object") {
        try {
          const bodyStr = JSON.stringify(req.body);
          if (bodyStr.length < 2000) {
            metadata.body = req.body;
          } else {
            metadata.bodyTruncated = bodyStr.substring(0, 2000);
          }
        } catch {
          // ignore body serialization errors
        }
      }

      // Determine status
      const status =
        res.statusCode >= 200 && res.statusCode < 300 ? "SUCCESS" : "FAILED";

      // Persist audit log (best effort)
      await auditLog.create({
        data: {
          actor,
          ...(role ? { role } : {}),
          action: `${req.method} ${req.path}`,
          resource: req.originalUrl || req.path,
          status,
          metadata,
          ...(userId ? { userId } : {}),
        },
      });
    } catch (err) {
      // Don't block requests on audit failures
      console.warn("[Audit] Failed to write audit log:", err);
    }
  });

  next();
}
