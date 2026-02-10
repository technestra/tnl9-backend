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
  getFollowupHistory,
  softDeleteProspect, restoreProspect, getTrashProspect, permanentDeleteProspect
} from "../controllers/prospectController.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";
import { checkOwnership } from "../middlewares/ownershipMiddleware.js";

const router = express.Router();

router.post("/", protect, createProspect);
router.get("/search", protect, searchProspects);
router.get("/", protect, getProspects);
router.get("/:id", protect, getProspectById);
router.put("/:id", protect, checkOwnership('Prospect'), updateProspect);
router.delete("/:id", protect, deleteProspect);

router.put("/:id/followup", protect, updateFollowup);
router.get("/:id/followup-history", protect, getFollowupHistory);

router.put("/:id/toggle-active", protect, toggleProspectActive)

router.delete("/:id/soft", protect,checkOwnership('Prospect'), softDeleteProspect); // Soft delete
router.get("/trash/all", protect, allowRoles('SUPER_ADMIN'), getTrashProspect); // Get trash
router.patch("/:id/restore", protect, allowRoles('SUPER_ADMIN'), restoreProspect); // Restore
router.delete("/:id/permanent", protect, allowRoles('SUPER_ADMIN'), permanentDeleteProspect); 

export default router;
