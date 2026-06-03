import { Router } from "express";
import {
  listAdministration,
  getAdministration,
  createAdministration,
  updateAdministration,
  deleteAdministration,
} from "../controllers/administration.controller.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

/**
 * Public routes
 */
router.get("/", asyncHandler(listAdministration));
router.get("/:id", asyncHandler(getAdministration));

/**
 * Protected routes
 */
router.post("/", requireAuth, requireAdmin, asyncHandler(createAdministration));
router.put("/:id", requireAuth, requireAdmin, asyncHandler(updateAdministration));
router.delete("/:id", requireAuth, requireAdmin, asyncHandler(deleteAdministration));

export default router;
