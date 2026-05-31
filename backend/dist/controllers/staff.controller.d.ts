import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";
/**
 * GET /staff
 * Auth required. Paginated + filterable list of staff, scoped to the actor's office.
 * Query params: page, pageSize, search, status, roleId, officeId
 */
export declare function listStaff(req: AuthRequest, res: Response): Promise<Response | void>;
/**
 * GET /staff/:id
 * Auth required. Looks up a staff record by staff id or user id.
 */
export declare function getStaff(req: AuthRequest, res: Response): Promise<Response | void>;
/**
 * POST /staff
 * Auth required. Creates a User + Staff assignment atomically.
 * Admins may specify any officeId; non-wide-access actors are auto-scoped to their office.
 */
export declare function createStaff(req: AuthRequest, res: Response): Promise<Response | void>;
/**
 * PUT /staff/:id
 * Auth required. Updates the User record and/or office assignment atomically.
 * Providing a new officeId reassigns the staff member (subject to office-scope rules).
 */
export declare function updateStaff(req: AuthRequest, res: Response): Promise<Response | void>;
/**
 * DELETE /staff/:id
 * Auth required. Removes the staff assignment.
 * If this is the user's only office assignment the User record is also deleted (via transaction).
 */
export declare function deleteStaff(req: AuthRequest, res: Response): Promise<Response | void>;
//# sourceMappingURL=staff.controller.d.ts.map