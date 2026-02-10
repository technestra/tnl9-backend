import express from "express";
const router = express.Router();
import {
  getAllAssets,
  getAssetById,
  createAsset,
  updateAsset,
  trashAsset,              // ← new
  restoreAsset,            // ← new
  deleteAssetPermanently,  // ← new (permanent delete)
  assignAsset,
  returnAsset,
  getAssetStats
} from "../controllers/assetController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";

// Asset CRUD routes - All protected
// router.route("/")
  // .get(protect, getAllAssets)
  // .post(protect, allowRoles("admin", "superadmin"), createAsset);

  router.route("/")
  .get(getAllAssets)
  .post(createAsset);

router.route("/stats")
  .get(protect, getAssetStats);

router.route("/:id")
  .get(protect, getAssetById)
  .put(protect, allowRoles("admin", "superadmin"), updateAsset)
  .delete(protect, allowRoles("admin", "superadmin"), trashAsset);   // ← changed: now soft delete

// New trash management routes - Admin only
router.patch("/:id/restore", protect, allowRoles("admin", "superadmin"), restoreAsset);
router.delete("/:id/permanent", protect, allowRoles("admin", "superadmin"), deleteAssetPermanently);

// Asset management routes - Admin only
router.post("/:id/assign", protect, allowRoles("admin", "superadmin"), assignAsset);
router.post("/:id/return", protect, allowRoles("admin", "superadmin"), returnAsset);

export default router;

// import express from "express";
// const router = express.Router();
// import {
//   getAllAssets,
//   getAssetById,
//   createAsset,
//   updateAsset,
//   trashAsset,
//   restoreAsset,
//   deleteAssetPermanently,
//   assignAsset,
//   returnAsset,
//   getAssetStats
// } from "../controllers/assetController.js";

// // --- SECURITY REMOVED FOR TESTING ---


// // Asset CRUD routes
// router.route("/")
//   .get(getAllAssets)
//   .post(createAsset);

// router.route("/stats")
//   .get(getAssetStats);

// router.route("/:id")
//   .get(getAssetById)
//   .put(updateAsset)
//   .delete(trashAsset); // Soft delete

// // Trash management routes
// router.patch("/:id/restore", restoreAsset);
// router.delete("/:id/permanent", deleteAssetPermanently);

// // Asset management routes
// router.post("/:id/assign", assignAsset);
// router.post("/:id/return", returnAsset);

// export default router;