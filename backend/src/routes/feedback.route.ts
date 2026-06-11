import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  listFeedback,
  getFeedback,
  createFeedback,
  upsertFeedback,
  updateFeedback,
  deleteFeedback,
} from "../controllers/feedback.controller.js";
import { writeLimiter } from "../middleware/rate-limit.js";

const router = Router();

// All feedback routes require authentication.
// Role-based access control is enforced inside each controller.
router.get("/", requireAuth, asyncHandler(listFeedback));
router.get("/:requestId", requireAuth, asyncHandler(getFeedback));
router.post("/:requestId", writeLimiter, requireAuth, asyncHandler(createFeedback));
router.put("/:requestId", writeLimiter, requireAuth, asyncHandler(upsertFeedback));
router.patch("/:requestId", writeLimiter, requireAuth, asyncHandler(updateFeedback));
router.delete("/:requestId", requireAuth, asyncHandler(deleteFeedback));

export default router;
