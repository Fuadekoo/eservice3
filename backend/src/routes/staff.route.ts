import { Router } from "express";
import { requireAuth, requirePermission } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  listStaff,
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  getStaffServices,
  syncStaffServices,
} from "../controllers/staff.controller.js";

const router = Router();

// All staff routes require authentication.
// Office-scope and role access are enforced inside each controller.
// Office scoping in the controller decides *which* office a caller may touch;
// these guards decide whether they may manage staff at all. Without them a
// customer assigned to an office could create a staff account inside it.
router.get(
  "/",
  requireAuth,
  requirePermission("staff:read"),
  asyncHandler(listStaff),
);
router.get(
  "/:id",
  requireAuth,
  requirePermission("staff:read"),
  asyncHandler(getStaff),
);
router.post(
  "/",
  requireAuth,
  requirePermission("staff:create"),
  asyncHandler(createStaff),
);
router.put(
  "/:id",
  requireAuth,
  requirePermission("staff:update"),
  asyncHandler(updateStaff),
);
router.delete(
  "/:id",
  requireAuth,
  requirePermission("staff:delete"),
  asyncHandler(deleteStaff),
);

// Staff-centric service assignment management
router.get(
  "/:id/services",
  requireAuth,
  requirePermission("staff:read"),
  asyncHandler(getStaffServices),
);
router.put(
  "/:id/services",
  requireAuth,
  requirePermission("service:assign-staff"),
  asyncHandler(syncStaffServices),
);

export default router;
