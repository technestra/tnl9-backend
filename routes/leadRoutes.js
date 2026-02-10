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
  searchLeads,
  updateFollowup,
  getFollowupHistory,
  softDeleteLead, restoreLead, getTrashLead, permanentDeleteLead
} from "../controllers/leadController.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";
import { checkOwnership } from "../middlewares/ownershipMiddleware.js";

const router = express.Router();

router.post("/", protect, createLead);
router.get("/", protect, getLeads);
router.get("/:id", protect, getLeadById);
router.put("/:id", protect, updateLead);
router.delete("/:id", protect, deleteLead);
router.put("/:id/stage", protect, updateLeadStage);
router.put("/:id/followup", protect, updateFollowup);
router.get("/:id/followup-history", protect, getFollowupHistory);
router.get("/search", protect, searchLeads);
router.put("/:id/toggle-active", protect, toggleLeadActive)

router.delete("/:id/soft", protect, checkOwnership("Lead"), softDeleteLead);
router.get("/trash/all", protect, allowRoles('SUPER_ADMIN'), getTrashLead); 
router.patch("/:id/restore", protect, allowRoles('SUPER_ADMIN'), restoreLead); 
router.delete("/:id/permanent", protect, allowRoles('SUPER_ADMIN'), permanentDeleteLead); 

router.post("/test-validation", protect, async (req, res) => {
  try {
    console.log("=== TEST VALIDATION ===");
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    
    // Try to create a lead with the same data
    const testLead = new Lead(req.body);
    
    // Validate without saving
    await testLead.validate();
    
    res.json({
      success: true,
      message: "Validation passed",
      data: req.body
    });
    
  } catch (error) {
    console.error("Validation error:", error);
    
    if (error.name === 'ValidationError') {
      const errors = {};
      Object.keys(error.errors).forEach(key => {
        errors[key] = error.errors[key].message;
      });
      
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors,
        errorDetails: error.errors
      });
    }
    
    res.status(400).json({
      success: false,
      message: error.message,
      error: error.name
    });
  }
});

export default router;
