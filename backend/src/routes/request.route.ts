import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  listRequests,
  getRequest,
  createRequest,
  updateRequest,
  approveRequestByStaff,
  approveRequestByAdmin,
  rejectRequest,
  deleteRequest,
} from "../controllers/request.controller.js";

const router = Router();

// All request routes require authentication
// Role-based access control is enforced inside each controller
router.get("/", requireAuth, asyncHandler(listRequests));
router.get("/:id", requireAuth, asyncHandler(getRequest));
router.post("/", requireAuth, asyncHandler(createRequest));
router.patch("/:id", requireAuth, asyncHandler(updateRequest));
router.patch(
  "/:id/approve-staff",
  requireAuth,
  asyncHandler(approveRequestByStaff),
);
router.patch(
  "/:id/approve-admin",
  requireAuth,
  asyncHandler(approveRequestByAdmin),
);
router.patch("/:id/reject", requireAuth, asyncHandler(rejectRequest));
router.delete("/:id", requireAuth, asyncHandler(deleteRequest));

export default router;
