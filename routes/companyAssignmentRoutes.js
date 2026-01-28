import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";
import { assignUserToCompany, removeUserFromCompany } from "../controllers/companyAssignmentController.js";

const router = express.Router();

router.post("/assign", protect, allowRoles("SUPER_ADMIN"), assignUserToCompany);
router.post("/remove", protect, allowRoles("SUPER_ADMIN"), removeUserFromCompany);

export default router;