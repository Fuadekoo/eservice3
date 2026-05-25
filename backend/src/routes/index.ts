import { Router } from "express";
import authRoutes from "./auth.route.js";
import officeRoutes from "./office.route.js";
import serviceRoutes from "./service.route.js";
import aboutRoutes from "./about.route.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/offices", officeRoutes);
router.use("/services", serviceRoutes);
router.use("/about", aboutRoutes);
// router.use("/staff", staffRoute);

export default router;
