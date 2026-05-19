import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";
/**
 * List all staff assignments.
 */
export declare function listStaff(req: AuthRequest, res: Response): Promise<Response | void>;
/**
 * Get a single staff assignment by staff id or user id.
 */
export declare function getStaff(req: AuthRequest, res: Response): Promise<Response | void>;
/**
 * Create a new staff user and staff assignment.
 */
export declare function createStaff(req: AuthRequest, res: Response): Promise<Response | void>;
/**
 * Update a staff assignment or the linked user account.
 */
export declare function updateStaff(req: AuthRequest, res: Response): Promise<Response | void>;
/**
 * Delete a staff assignment. If it is the user's last assignment, delete the user.
 */
export declare function deleteStaff(req: AuthRequest, res: Response): Promise<Response | void>;
//# sourceMappingURL=staff.controller.d.ts.map