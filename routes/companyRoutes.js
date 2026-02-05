import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
    createCompany, getCompanies, updateCompany, deleteCompany,
    getCompanyById,
    toggleCompanyActive,
    getCompanyUsers,
    searchCompanies
} from "../controllers/companyController.js";
import { allowRoles } from '../middlewares/roleMiddleware.js';

const router = express.Router();

router.post("/", protect, createCompany);
router.get("/", protect, getCompanies);
router.put("/:id", protect, updateCompany);
router.delete('/:id', protect, allowRoles('SUPER_ADMIN'), deleteCompany);
router.get("/:id", protect, getCompanyById);
// companyRoutes.js me yeh routes add karein
router.get("/search", protect, searchCompanies);
router.get("/users/list", protect, allowRoles('SUPER_ADMIN'), getCompanyUsers);
router.put("/:id/toggle-active", protect, toggleCompanyActive);

export default router;