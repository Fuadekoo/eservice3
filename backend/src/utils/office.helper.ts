import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";

/**
 * Extract office ID from the authenticated request.
 * For office staff, returns their office ID from the first staff record.
 * For super admin, returns null.
 *
 * @param req - Authenticated request with user data
 * @param res - Express response object (for error responses if needed)
 * @returns Office ID (string) or null for super admin
 */
export function getOfficeId(req: AuthRequest, res: Response): string | null {
  // Check if user has staff relationship (office staff)
  if (req.user?.staff?.officeId) {
    return req.user.staff.officeId;
  }

  // Super admin or user with no office assignment
  return null;
}
