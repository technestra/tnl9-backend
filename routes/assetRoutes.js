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
  .put(protect, allowRoles("SUPER_ADMIN"), updateAsset)
  .delete(protect, allowRoles("SUPER_ADMIN"), trashAsset);   // ← changed: now soft delete

// New trash management routes - Admin only
router.patch("/:id/restore", protect, allowRoles("SUPER_ADMIN"), restoreAsset);
router.delete("/:id/permanent", protect, allowRoles("SUPER_ADMIN"), deleteAssetPermanently);

// Asset management routes - Admin only
router.post("/:id/assign", protect, allowRoles("SUPER_ADMIN"), assignAsset);
router.post("/:id/return", protect, allowRoles("SUPER_ADMIN"), returnAsset);

export default router;
