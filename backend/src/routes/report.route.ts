import { Router } from "express";
import { requireAuth, requirePermission } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  listReports,
  createReport,
  getReport,
  updateReportStatus,
  deleteReport,
  getAdminUsers,
  getManagerUsers,
} from "../controllers/report.controller.js";

const router = Router();

// The /admins and /managers lookups exist to pick a report recipient, so they
// are gated on being able to send a report rather than on merely signing in.
router.get(
  "/admins",
  requireAuth,
  requirePermission("report:create"),
  asyncHandler(getAdminUsers),
);
router.get(
  "/managers",
  requireAuth,
  requirePermission("report:create"),
  asyncHandler(getManagerUsers),
);
router.get(
  "/",
  requireAuth,
  requirePermission("report:read"),
  asyncHandler(listReports),
);
router.post(
  "/",
  requireAuth,
  requirePermission("report:create"),
  asyncHandler(createReport),
);
router.get(
  "/:id",
  requireAuth,
  requirePermission("report:read"),
  asyncHandler(getReport),
);
router.patch(
  "/:id/status",
  requireAuth,
  requirePermission("report:approve"),
  asyncHandler(updateReportStatus),
);
router.delete(
  "/:id",
  requireAuth,
  requirePermission("report:delete"),
  asyncHandler(deleteReport),
);

export default router;
