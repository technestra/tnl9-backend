import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  createLead,
  getLeads,
  updateLead,
  // deleteLead,
  updateLeadStage,
  getLeadById,
  toggleLeadActive,
  searchLeads,
  updateFollowup,
  getFollowupHistory,
  softDeleteLead,
  restoreLead,
  getTrashedLead,
  permanentlyDeleteLead,
  emptyLeadTrash
} from "../controllers/leadController.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";
import { checkOwnership } from "../middlewares/ownershipMiddleware.js";

const router = express.Router();

router.post("/", protect, createLead);
router.get("/search", protect, searchLeads);
router.get("/", protect, getLeads);
router.get("/:id", protect, getLeadById);
router.put("/:id", protect, updateLead);
// router.delete("/:id", protect, deleteLead);
router.put("/:id/stage", protect, updateLeadStage);
router.put("/:id/followup", protect, updateFollowup);
router.get("/:id/followup-history", protect, getFollowupHistory);
router.put("/:id/toggle-active", protect, toggleLeadActive)
router.delete(
  "/:id",
  protect,
  softDeleteLead
);

// TRASH LIST
router.get(
  "/trash/all",
  protect,
  getTrashedLead
);

// RESTORE
router.patch(
  "/:id/restore",
  protect,
  allowRoles("SUPER_ADMIN"),
  restoreLead
);

// PERMANENT DELETE
router.delete(
  "/:id/permanent",
  protect,
  allowRoles("SUPER_ADMIN"),
  permanentlyDeleteLead
);

// EMPTY TRASH
router.delete(
  "/trash/empty",
  protect,
  allowRoles("SUPER_ADMIN"),
  emptyLeadTrash
);

export default router;
