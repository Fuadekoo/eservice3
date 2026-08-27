import { Router } from "express";
import {
  listOffices,
  getOverviewStats,
  getPublicOffice,
  getOffice,
  createOffice,
  updateOffice,
  deleteOffice,
} from "../controllers/office.controller.js";
import {
  requireAuth,
  requireAdmin,
  requireAnyPermission,
} from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

/**
 * Public routes
 */
router.get("/", asyncHandler(listOffices));
router.get("/:id/public", asyncHandler(getPublicOffice));

/**
 * Protected routes
 *
 * `/stats` is declared ahead of `/:id` so the literal path is not swallowed by
 * the id parameter. It reports system-wide totals, so the controller gates it
 * on the admin roles itself — `requireAdmin` accepts only the exact "ADMIN"
 * role, while the admin overview is also reachable as ADMINISTRATOR and the
 * super-admin aliases.
 */
router.get("/stats", requireAuth, asyncHandler(getOverviewStats));
router.get("/:id", requireAuth, asyncHandler(getOffice));
router.post("/", requireAuth, requireAdmin, asyncHandler(createOffice));
// Managers configure their own office, admins any office. updateOffice
// re-checks the office scope, so this guard only decides who may edit at all.
router.put(
  "/:id",
  requireAuth,
  requireAnyPermission("office:update", "office:manage", "office:configure"),
  asyncHandler(updateOffice),
);
router.delete("/:id", requireAuth, requireAdmin, asyncHandler(deleteOffice));

export default router;
