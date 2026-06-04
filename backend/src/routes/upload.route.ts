import { Router } from "express";
import { uploadFile } from "../controllers/upload.controller.js";
import { upload } from "../middleware/upload.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

// POST /back-api/files/upload
// The frontend sends the file in a field named "file"
router.post(
  "/upload",
  requireAuth,
  upload.single("file"),
  asyncHandler(uploadFile),
);

export default router;
