import { Router } from "express";
import { uploadFile, serveByFilepath } from "../controllers/upload.controller.js";
import { upload } from "../middleware/upload.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadLimiter } from "../middleware/rate-limit.js";

const router = Router();

// POST /back-api/files/upload
// The frontend sends the file in a field named "file"
router.post(
  "/upload",
  uploadLimiter,
  requireAuth,
  upload.single("file"),
  asyncHandler(uploadFile),
);

// GET /back-api/files/by-path/:filepath
// Serves static files by relative filepath (under uploadDir or filedataDir)
router.get(
  "/by-path/:filepath",
  requireAuth,
  asyncHandler(serveByFilepath as any),
);

export default router;
