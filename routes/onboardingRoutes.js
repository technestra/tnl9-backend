import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { checkOwnership } from "../middlewares/authMiddleware.js";
import {
  convertToWon,
  getOnboarding,
  updateOnboarding,
  cloneLead,
  searchOnboarding,
  getAllOnboardings
} from "../controllers/onboardingController.js"; // or from onboardingController

const router = express.Router();

// ------------------ WON / ONBOARDING ------------------
router.post(
  "/:id/convert-to-won",
  protect,
  checkOwnership("Lead"),        // only creator/assigned/super admin can convert
  convertToWon
);

router.get("/search", protect, searchOnboarding);

router.get(
  "/:id/onboarding",
  protect, 
  checkOwnership("Lead"),
  getOnboarding
);

router.get("/", protect, getAllOnboardings);   

router.put(
  "/:id/onboarding",
  protect,
  checkOwnership("Lead"),
  updateOnboarding
);

// ------------------ CLONE ------------------
router.post(
  "/:id/clone",
  protect,
  checkOwnership("Lead"),       // user must have read access to original
  cloneLead
);

export default router;