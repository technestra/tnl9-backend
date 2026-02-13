// import express from "express";
// import { protect } from "../middlewares/authMiddleware.js";
// import { checkOwnership } from "../middlewares/authMiddleware.js";
// import {
//   convertToWon,
//   getOnboarding,
//   updateOnboarding,
//   cloneLead,
//   searchOnboarding,
//   getAllOnboardings
// } from "../controllers/onboardingController.js"; // or from onboardingController

// const router = express.Router();

// // ------------------ WON / ONBOARDING ------------------
// router.post(
//   "/:id/convert-to-won",
//   protect,
//   checkOwnership("Lead"),        // only creator/assigned/super admin can convert
//   convertToWon
// );

// router.get("/search", protect, searchOnboarding);

// router.get(
//   "/:id/onboarding",
//   protect, 
//   checkOwnership("Lead"),
//   getOnboarding
// );

// router.get("/", protect, getAllOnboardings);   

// router.put(
//   "/:id/onboarding",
//   protect,
//   checkOwnership("Lead"),
//   updateOnboarding
// );

// // ------------------ CLONE ------------------
// router.post(
//   "/:id/clone",
//   protect,
//   checkOwnership("Lead"),       // user must have read access to original
//   cloneLead
// );

// export default router;


// routes/onboardingRoutes.js
import express from "express";
import { protect } from "../middlewares/authMiddleware.js";      // ✅ your protect
import { requireRoles } from "../middlewares/roleMiddleware.js"; // ✅ your role guard
import {
  convertToWon,
  getOnboarding,
  updateOnboarding,
  submitForApproval,
  approveOnboarding,
  rejectOnboarding,
  completeOnboarding,
  searchOnboarding,
  getAllOnboardings,
  cloneLead,
} from "../controllers/onboardingController.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// ----- Lead Conversion -----
router.put("/leads/:id/convert-to-won", convertToWon);
router.post("/leads/:id/clone", cloneLead);

// ----- Onboarding CRUD -----
router.get("/lead/:id", getOnboarding);
router.put("/lead/:id", updateOnboarding);
router.post("/lead/:id/submit", submitForApproval);

// 🟢 SUPER ADMIN ONLY endpoints – use your requireRoles
router.post(
  "/lead/:id/approve",
  requireRoles("SUPER_ADMIN"),    // ✅ instead of restrictTo
  approveOnboarding
);
router.post(
  "/lead/:id/reject",
  requireRoles("SUPER_ADMIN"),    // ✅ instead of restrictTo
  rejectOnboarding
);

router.post("/lead/:id/complete", completeOnboarding);

// ----- Listing & Search -----
router.get("/", getAllOnboardings);
router.get("/search", searchOnboarding);

export default router;