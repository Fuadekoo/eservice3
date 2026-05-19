import { Router } from "express";
import authRoutes from "./auth.route.js";

const router = Router();

router.use("/auth", authRoutes);
// router.use("/staff", staffRoute);

export default router;
