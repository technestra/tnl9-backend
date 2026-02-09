// import express from "express";
// import { protect } from "../middlewares/authMiddleware.js";
// import {
//     createCompany, getCompanies, updateCompany, deleteCompany,
//     getCompanyById,
//     toggleCompanyActive,
//     getCompanyUsers,
//     searchCompanies,
//     softDeleteCompany, restoreCompany, getTrashCompanies, permanentDeleteCompany, getCompanyStats
// } from "../controllers/companyController.js";
// import { allowRoles } from '../middlewares/roleMiddleware.js';
// import { checkOwnership } from '../middlewares/ownershipMiddleware.js'

// const router = express.Router();

// router.get('/stats', protect, getCompanyStats);
// router.post("/", protect, createCompany);
// router.get("/", protect, getCompanies);
// router.put("/:id", protect, checkOwnership('Company'), updateCompany);
// router.delete('/:id', protect, allowRoles('SUPER_ADMIN'), deleteCompany);
// router.get("/:id", protect, getCompanyById);
// // companyRoutes.js me yeh routes add karein
// router.get("/search", protect, searchCompanies);
// router.get("/users/list", protect, allowRoles('SUPER_ADMIN'), getCompanyUsers);
// router.put("/:id/toggle-active", protect, toggleCompanyActive);

// router.delete("/:id/soft", protect, checkOwnership('Company'), softDeleteCompany); // Soft delete
// router.get("/trash/all", protect, allowRoles('SUPER_ADMIN'), getTrashCompanies); // Get trash
// router.patch("/:id/restore", protect, allowRoles('SUPER_ADMIN'), restoreCompany); // Restore
// router.delete("/:id/permanent", protect, allowRoles('SUPER_ADMIN'), permanentDeleteCompany); 

// export default router;

import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  createCompany, getCompanies, updateCompany, deleteCompany,
  getCompanyById,
  toggleCompanyActive,
  getCompanyUsers,
  searchCompanies,
  softDeleteCompany, restoreCompany, getTrashCompanies, permanentDeleteCompany, getCompanyStats
} from "../controllers/companyController.js";
import { allowRoles } from '../middlewares/roleMiddleware.js';
import { checkOwnership } from '../middlewares/ownershipMiddleware.js'

const router = express.Router();

// Specific routes पहले (search, stats, users/list, toggle-active, soft/restore/permanent)
router.get("/stats", protect, getCompanyStats);
router.get("/search", protect, searchCompanies);  // ये पहले आएगा → conflict खत्म
router.get("/users/list", protect, allowRoles('SUPER_ADMIN'), getCompanyUsers);
router.put("/:id/toggle-active", protect, toggleCompanyActive);
router.delete("/:id/soft", protect, checkOwnership('Company'), softDeleteCompany);
router.get("/trash/all", protect, getTrashCompanies);
router.patch("/:id/restore", protect, allowRoles('SUPER_ADMIN'), restoreCompany);
router.delete("/:id/permanent", protect, allowRoles('SUPER_ADMIN'), permanentDeleteCompany);

// General routes बाद में
router.post("/", protect, createCompany);
router.get("/", protect, getCompanies);
router.get("/:id", protect, getCompanyById);
router.put("/:id", protect, checkOwnership('Company'), updateCompany);
router.delete('/:id', protect, allowRoles('SUPER_ADMIN'), deleteCompany);

export default router;