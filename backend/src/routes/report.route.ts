import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
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

router.get("/admins", requireAuth, asyncHandler(getAdminUsers));
router.get("/managers", requireAuth, asyncHandler(getManagerUsers));
router.get("/", requireAuth, asyncHandler(listReports));
router.post("/", requireAuth, asyncHandler(createReport));
router.get("/:id", requireAuth, asyncHandler(getReport));
router.patch("/:id/status", requireAuth, asyncHandler(updateReportStatus));
router.delete("/:id", requireAuth, asyncHandler(deleteReport));

export default router;
