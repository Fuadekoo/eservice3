import { Router } from "express";
import { requireAuth, requirePermission } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/user.controller.js";

const router = Router();

// The directory exposes every account, phone numbers included, so reading it
// needs an explicit grant rather than merely being signed in. Self-service
// runs through /auth/profile, not these endpoints.
router.get(
  "/",
  requireAuth,
  requirePermission("user:read"),
  asyncHandler(listUsers),
);
router.get(
  "/:id",
  requireAuth,
  requirePermission("user:read"),
  asyncHandler(getUser),
);
router.post(
  "/",
  requireAuth,
  requirePermission("user:create"),
  asyncHandler(createUser),
);
router.put(
  "/:id",
  requireAuth,
  requirePermission("user:update"),
  asyncHandler(updateUser),
);
router.delete(
  "/:id",
  requireAuth,
  requirePermission("user:delete"),
  asyncHandler(deleteUser),
);

export default router;
