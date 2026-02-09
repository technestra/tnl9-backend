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
  searchSuspects,
  updateFollowup,
  getFollowupHistory,
  softDeleteSuspect, restoreSuspect, getTrashSuspect, permanentDeleteSuspect
} from "../controllers/suspectController.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";
import { checkOwnership } from "../middlewares/ownershipMiddleware.js";

const router = express.Router();

/* GLOBAL */
router.get("/suspects", protect, getAllSuspects);

/* COMPANY WISE */
router.post("/companies/:companyId/suspects", protect, createSuspect);
router.get("/companies/:companyId/suspects", protect, getCompanySuspects);
router.get("/suspects/:id", protect, getSuspectById);

// Add these routes
router.put("/:id/followup", protect, updateFollowup);
router.get("/:id/followup-history", protect, getFollowupHistory);

// suspectRoutes.js me
router.get("/search", protect, searchSuspects);
/* SINGLE */
router.put("/suspects/:id", protect, checkOwnership('Suspect'), updateSuspect);
router.delete("/suspects/:id", protect, deleteSuspect);
router.put("/:id/toggle-active", protect, toggleSuspectActive);

router.delete("/:id/soft", protect, checkOwnership('Suspect'), softDeleteSuspect); // Soft delete
router.get("/trash/all", protect, allowRoles('SUPER_ADMIN'), getTrashSuspect); // Get trash
router.patch("/:id/restore", protect, allowRoles('SUPER_ADMIN'), restoreSuspect); // Restore
router.delete("/:id/permanent", protect, allowRoles('SUPER_ADMIN'), permanentDeleteSuspect); 

export default router;
