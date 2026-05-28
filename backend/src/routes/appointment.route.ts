import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
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
router.get("/", requireAuth, asyncHandler(listAppointments));
router.get("/:id", requireAuth, asyncHandler(getAppointment));
router.post("/", requireAuth, asyncHandler(createAppointment));
router.patch("/:id", requireAuth, asyncHandler(updateAppointment));
router.patch("/:id/approve", requireAuth, asyncHandler(approveAppointment));
router.delete("/:id", requireAuth, asyncHandler(deleteAppointment));

export default router;
