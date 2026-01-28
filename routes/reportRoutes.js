import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { getMonthlyReport, monthlyReport, exportMonthlyReport} from "../controllers/reportController.js";

const router = express.Router();

// router.get("/monthly", protect, monthlyReport);
router.get("/monthly/export", protect, exportMonthlyReport);

router.get("/monthly", protect, getMonthlyReport);

export default router;