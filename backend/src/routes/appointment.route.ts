import { Router } from "express";
import { requireAuth, requirePermission } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  listAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  approveAppointment,
  deleteAppointment,
} from "../controllers/appointment.controller.js";

const router = Router();

// All appointment routes require authentication.
// Role-based access control is enforced inside each controller.
// Controllers still scope rows to the caller; these guards decide who may
// reach the endpoint at all. Approving is staff-and-above only.
router.get(
  "/",
  requireAuth,
  requirePermission("appointment:read"),
  asyncHandler(listAppointments),
);
router.get(
  "/:id",
  requireAuth,
  requirePermission("appointment:read"),
  asyncHandler(getAppointment),
);
router.post(
  "/",
  requireAuth,
  requirePermission("appointment:create"),
  asyncHandler(createAppointment),
);
router.patch(
  "/:id",
  requireAuth,
  requirePermission("appointment:update"),
  asyncHandler(updateAppointment),
);
router.patch(
  "/:id/approve",
  requireAuth,
  requirePermission("appointment:approve"),
  asyncHandler(approveAppointment),
);
router.delete(
  "/:id",
  requireAuth,
  requirePermission("appointment:delete"),
  asyncHandler(deleteAppointment),
);

export default router;
