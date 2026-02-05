import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  createSuspect,
  getAllSuspects,
  getCompanySuspects,
  updateSuspect,
  deleteSuspect,
  getSuspectById,
  toggleSuspectActive,
  searchSuspects
} from "../controllers/suspectController.js";

const router = express.Router();

/* GLOBAL */
router.get("/suspects", protect, getAllSuspects);

/* COMPANY WISE */
router.post("/companies/:companyId/suspects", protect, createSuspect);
router.get("/companies/:companyId/suspects", protect, getCompanySuspects);
router.get("/suspects/:id", protect, getSuspectById);

// suspectRoutes.js me
router.get("/search", protect, searchSuspects);
/* SINGLE */
router.put("/suspects/:id", protect, updateSuspect);
router.delete("/suspects/:id", protect, deleteSuspect);
router.put("/:id/toggle-active", protect, toggleSuspectActive);

export default router;
