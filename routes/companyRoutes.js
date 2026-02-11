import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  createCompany, getCompanies, updateCompany, deleteCompany,
  getCompanyById,
  toggleCompanyActive,
  getCompanyUsers,
  searchCompanies, restoreCompany, getTrashedCompanies, permanentlyDeleteCompany, getCompanyStats, emptyCompanyTrash
} from "../controllers/companyController.js";
import { allowRoles } from '../middlewares/roleMiddleware.js';
import { checkOwnership } from '../middlewares/ownershipMiddleware.js'

const router = express.Router();

router.get("/stats", protect, getCompanyStats);
router.get("/search", protect, searchCompanies); 
router.get("/users/list", protect, allowRoles('SUPER_ADMIN'), getCompanyUsers);
router.put("/:id/toggle-active", protect, toggleCompanyActive);

router.post("/", protect, createCompany);
router.get("/", protect, getCompanies);
router.get("/:id", protect, getCompanyById);
router.put("/:id", protect, checkOwnership('Company'), updateCompany);

router.delete("/:id", protect, deleteCompany);

router.get("/trash/list", protect, getTrashedCompanies);
router.patch("/trash/restore/:id", protect, restoreCompany);
router.delete("/trash/permanent/:id", protect, permanentlyDeleteCompany);
router.delete("/trash/empty/all", protect, emptyCompanyTrash);

export default router;
