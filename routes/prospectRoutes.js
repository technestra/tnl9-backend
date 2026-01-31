import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  createProspect,
  getProspects,
  getProspectById,
  updateProspect,
  deleteProspect,
  toggleProspectActive
} from "../controllers/prospectController.js";

const router = express.Router();

router.post("/", protect, createProspect);
router.get("/", protect, getProspects);
router.get("/:id", protect, getProspectById);
router.put("/:id", protect, updateProspect);
router.delete("/:id", protect, deleteProspect);
router.put("/:id/toggle-active", protect, toggleProspectActive)

export default router;
