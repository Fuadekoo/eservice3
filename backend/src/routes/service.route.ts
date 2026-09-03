import { Router } from "express";
import {
  requireAuth,
  requireAdmin,
  requirePermission,
  optionalAuth,
} from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  listServices,
  getService,
  createService,
  updateService,
  deleteService,
  listServiceStaff,
  assignStaff,
  removeStaff,
} from "../controllers/service.controller.js";

const router = Router();

// Public: list services from active offices (with optional ?officeId, ?search,
// ?page, ?pageSize). `optionalAuth` leaves guests anonymous while identifying a
// signed-in office user, so their view can be scoped to their own office.
router.get("/", optionalAuth, asyncHandler(listServices));

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

// Staff assignment management (admin or manager, enforced in controller).
//
// All three gate on `service:assign-staff`, including the read. The picker that
// drives the writes used to list the office roster via `GET /staff`, which
// gates on `staff:read` — so a manager holding the permission to assign staff
// could still be refused the list of staff to assign, which is not a coherent
// thing to tell someone. The read a write needs belongs behind the write's own
// permission.
router.get(
  "/:id/staff",
  requireAuth,
  requirePermission("service:assign-staff"),
  asyncHandler(listServiceStaff),
);
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
