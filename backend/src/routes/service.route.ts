import { Router } from "express";
import {
  requireAuth,
  requireAdmin,
  requirePermission,
} from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  listServices,
  getService,
  createService,
  updateService,
  deleteService,
  assignStaff,
  removeStaff,
} from "../controllers/service.controller.js";

const router = Router();

// Public: list services from active offices (with optional ?officeId, ?search, ?page, ?pageSize)
router.get("/", asyncHandler(listServices));

// Auth required
router.get("/:id", requireAuth, asyncHandler(getService));
router.post(
  "/",
  requireAuth,
  requirePermission("service:create"),
  asyncHandler(createService),
);
router.put(
  "/:id",
  requireAuth,
  requirePermission("service:update"),
  asyncHandler(updateService),
);
router.delete("/:id", requireAuth, requireAdmin, asyncHandler(deleteService));

// Staff assignment management (admin or manager, enforced in controller)
router.post(
  "/:id/staff",
  requireAuth,
  requirePermission("service:assign-staff"),
  asyncHandler(assignStaff),
);
router.delete(
  "/:id/staff/:staffId",
  requireAuth,
  requirePermission("service:assign-staff"),
  asyncHandler(removeStaff),
);

export default router;
