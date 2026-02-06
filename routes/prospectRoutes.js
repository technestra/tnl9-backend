import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  createProspect,
  getProspects,
  getProspectById,
  updateProspect,
  deleteProspect,
  toggleProspectActive,
  searchProspects,
  updateFollowup,
  getFollowupHistory
} from "../controllers/prospectController.js";

const router = express.Router();

router.post("/", protect, createProspect);
router.get("/", protect, getProspects);
router.get("/:id", protect, getProspectById);
router.put("/:id", protect, updateProspect);
router.delete("/:id", protect, deleteProspect);

// Add these routes
router.put("/:id/followup", protect, updateFollowup);
router.get("/:id/followup-history", protect, getFollowupHistory);

// prospectRoutes.js me
router.get("/search", protect, searchProspects);
router.put("/:id/toggle-active", protect, toggleProspectActive)

export default router;
