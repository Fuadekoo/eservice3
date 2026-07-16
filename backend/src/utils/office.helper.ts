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
  // Super admin operates globally (no office scope). The admin account may still
  // carry a staff record tied to the head office, so this check must come first —
  // otherwise office-scoped queries silently hide global rows (e.g. the base
  // admin/manager/staff/customer roles, which have officeId = null).
  if (req.isAdmin) {
    return null;
  }

  // Check if user has staff relationship (office staff)
  if (req.user?.staff?.officeId) {
    return req.user.staff.officeId;
  }

  // User with no office assignment
  return null;
}
