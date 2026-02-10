import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  createCompany, getCompanies, updateCompany, deleteCompany,
  getCompanyById,
  toggleCompanyActive,
  getCompanyUsers,
  searchCompanies,
  softDeleteCompany, restoreCompany, getTrashCompanies, permanentDeleteCompany, getCompanyStats, emptyTrash
} from "../controllers/companyController.js";
import { allowRoles } from '../middlewares/roleMiddleware.js';
import { checkOwnership } from '../middlewares/ownershipMiddleware.js'

const router = express.Router();

router.get("/stats", protect, getCompanyStats);
router.get("/search", protect, searchCompanies); 
router.get("/users/list", protect, allowRoles('SUPER_ADMIN'), getCompanyUsers);
router.put("/:id/toggle-active", protect, toggleCompanyActive);
router.delete("/:id/soft", protect, softDeleteCompany);

// Trash management routes
router.get("/trash/all", protect, getTrashCompanies);
router.patch("/:id/restore", protect, restoreCompany);
router.delete("/:id/permanent", protect, permanentDeleteCompany);
router.delete("/trash/empty", protect, emptyTrash);

router.post("/", protect, createCompany);
router.get("/", protect, getCompanies);
router.get("/:id", protect, getCompanyById);
router.put("/:id", protect, checkOwnership('Company'), updateCompany);
router.delete('/:id', protect, allowRoles('SUPER_ADMIN'), deleteCompany);

export default router;