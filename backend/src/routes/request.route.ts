import { Router } from "express";
import {
  requireAuth,
  requireAnyPermission,
  requirePermission,
} from "../middleware/auth.js";
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
import {
  createRequestForOther,
  listRequestsForOther,
  getRequestForOther,
} from "../controllers/request-for-other.controller.js";

const router = Router();

// Every route states the permission it needs. Controllers still scope rows to
// the caller (own requests / own office); the guards below decide who may
// reach the endpoint at all, so a customer cannot approve their own request.

// ── Requests submitted on behalf of a family member ──────────────────────
// Declared before "/:id", otherwise Express matches "for-other" as an id.
router.get(
  "/for-other",
  requireAuth,
  requirePermission("request:read"),
  asyncHandler(listRequestsForOther),
);
router.post(
  "/for-other",
  requireAuth,
  requirePermission("request:create-for-other"),
  asyncHandler(createRequestForOther),
);
router.get(
  "/for-other/:id",
  requireAuth,
  requirePermission("request:read"),
  asyncHandler(getRequestForOther),
);

// ── Ordinary self-requests ───────────────────────────────────────────────
router.get("/", requireAuth, requirePermission("request:read"), asyncHandler(listRequests));
router.get(
  "/:id",
  requireAuth,
  requirePermission("request:read"),
  asyncHandler(getRequest),
);
router.post(
  "/",
  requireAuth,
  requirePermission("request:create"),
  asyncHandler(createRequest),
);
router.patch(
  "/:id",
  requireAuth,
  requirePermission("request:update"),
  asyncHandler(updateRequest),
);
router.patch(
  "/:id/approve-staff",
  requireAuth,
  requirePermission("request:approve-staff"),
  asyncHandler(approveRequestByStaff),
);
// Managers approve through the same endpoint as admins.
router.patch(
  "/:id/approve-admin",
  requireAuth,
  requireAnyPermission("request:approve-admin", "request:approve-manager"),
  asyncHandler(approveRequestByAdmin),
);
// Rejecting is an approval-level decision, so it needs approval rights.
router.patch(
  "/:id/reject",
  requireAuth,
  requireAnyPermission(
    "request:approve-staff",
    "request:approve-manager",
    "request:approve-admin",
  ),
  asyncHandler(rejectRequest),
);
router.delete(
  "/:id",
  requireAuth,
  requirePermission("request:delete"),
  asyncHandler(deleteRequest),
);

export default router;
