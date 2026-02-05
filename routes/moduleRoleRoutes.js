import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  assignModuleRole,
  removeModuleRole,
  getAllUsersWithModuleRoles,
  getModulePermissionsSummary
} from "../controllers/moduleRoleController.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get all users with module roles
router.get("/all-users", getAllUsersWithModuleRoles);

// Get module permissions summary
router.get("/summary", getModulePermissionsSummary);

// Assign module role to user
router.post("/assign", assignModuleRole);

// Remove module role from user
router.post("/remove", removeModuleRole);

export default router;