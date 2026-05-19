import type { Request, Response, NextFunction } from "express";
/**
 * Middleware to log activity for every API request.
 * It listens for the response finish event so it can capture final status code.
 * The middleware is tolerant if authentication hasn't run yet (actor will be `anonymous`).
 */
export declare function auditLogger(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=audit.d.ts.map