import { Router } from "express";
import authRoutes from "./auth.route.js";
import officeRoutes from "./office.route.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/offices", officeRoutes);
// router.use("/staff", staffRoute);

export default router;
