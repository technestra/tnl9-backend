import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  createLead,
  getLeads,
  updateLead,
  deleteLead,
  updateLeadStage,
  getLeadById,
  toggleLeadActive,
  searchLeads
} from "../controllers/leadController.js";

const router = express.Router();

router.post("/", protect, createLead);
router.get("/", protect, getLeads);
router.get("/:id", protect, getLeadById);
router.put("/:id", protect, updateLead);
router.delete("/:id", protect, deleteLead);
router.put("/:id/stage", protect, updateLeadStage);
// leadsRoutes.js me
router.get("/search", protect, searchLeads);
router.put("/:id/toggle-active", protect, toggleLeadActive)


export default router;
