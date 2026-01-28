import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { createCompany, getCompanies, updateCompany, deleteCompany } from "../controllers/companyController.js";
import { allowRoles } from '../middlewares/roleMiddleware.js';

const router = express.Router();

router.post("/", protect, createCompany);
router.get("/", protect, getCompanies);
router.put("/:id", protect, updateCompany);
router.delete('/:id', protect, allowRoles('SUPER_ADMIN'), deleteCompany);

export default router;