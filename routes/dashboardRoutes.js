import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { getDashboardStats, getFunnelStats } from "../controllers/dashboardController.js";

const router = express.Router();
router.get("/", protect, getDashboardStats);
router.get("/funnel", protect, getFunnelStats);

export default router;
