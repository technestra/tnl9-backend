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
