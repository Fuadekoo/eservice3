import { Router } from "express";
import {
  listOffices,
  getPublicOffice,
  getOffice,
  createOffice,
  updateOffice,
  deleteOffice,
} from "../controllers/office.controller.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

/**
 * Public routes
 */
router.get("/", asyncHandler(listOffices));
router.get("/:id/public", asyncHandler(getPublicOffice));

/**
 * Protected routes
 */
router.get("/:id", requireAuth, asyncHandler(getOffice));
router.post("/", requireAuth, requireAdmin, asyncHandler(createOffice));
router.put("/:id", requireAuth, asyncHandler(updateOffice));
router.delete("/:id", requireAuth, requireAdmin, asyncHandler(deleteOffice));

export default router;
