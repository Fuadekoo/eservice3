import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
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
router.get("/", requireAuth, asyncHandler(listStaff));
router.get("/:id", requireAuth, asyncHandler(getStaff));
router.post("/", requireAuth, asyncHandler(createStaff));
router.put("/:id", requireAuth, asyncHandler(updateStaff));
router.delete("/:id", requireAuth, asyncHandler(deleteStaff));

// Staff-centric service assignment management
router.get("/:id/services", requireAuth, asyncHandler(getStaffServices));
router.put("/:id/services", requireAuth, asyncHandler(syncStaffServices));

export default router;
