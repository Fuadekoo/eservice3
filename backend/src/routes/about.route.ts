import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  listAbout,
  getAbout,
  createAbout,
  updateAbout,
  deleteAbout,
} from "../controllers/about.controller.js";

const router = Router();

// Public: anyone can read about content
router.get("/", asyncHandler(listAbout));
router.get("/:id", asyncHandler(getAbout));

// Admin only: manage about content
router.post("/", requireAuth, requireAdmin, asyncHandler(createAbout));
router.put("/:id", requireAuth, requireAdmin, asyncHandler(updateAbout));
router.delete("/:id", requireAuth, requireAdmin, asyncHandler(deleteAbout));

export default router;
