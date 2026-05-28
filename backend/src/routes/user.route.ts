import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/user.controller.js";

const router = Router();

router.get("/", requireAuth, asyncHandler(listUsers));
router.get("/:id", requireAuth, asyncHandler(getUser));
router.post("/", requireAuth, asyncHandler(createUser));
router.put("/:id", requireAuth, asyncHandler(updateUser));
router.delete("/:id", requireAuth, asyncHandler(deleteUser));

export default router;
