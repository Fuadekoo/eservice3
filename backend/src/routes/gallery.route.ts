import { Router } from "express";
import {
  listGalleries,
  getGallery,
  createGallery,
  updateGallery,
  deleteGallery,
  addImageToGallery,
  deleteImage,
} from "../controllers/gallery.controller.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

/**
 * Public routes
 */
router.get("/", asyncHandler(listGalleries));
router.get("/:id", asyncHandler(getGallery));

/**
 * Protected routes
 */
router.post("/", requireAuth, requireAdmin, asyncHandler(createGallery));
router.put("/:id", requireAuth, requireAdmin, asyncHandler(updateGallery));
router.delete("/:id", requireAuth, requireAdmin, asyncHandler(deleteGallery));
router.post("/:id/images", requireAuth, requireAdmin, asyncHandler(addImageToGallery));
router.delete("/images/:id", requireAuth, requireAdmin, asyncHandler(deleteImage));

export default router;
