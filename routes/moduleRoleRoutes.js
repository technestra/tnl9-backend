import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  assignModuleRole,
  removeModuleRole,
  getAllUsersWithModuleRoles,
  getModulePermissionsSummary
} from "../controllers/moduleRoleController.js";

const router = express.Router();

router.use(protect);

router.get("/all-users", getAllUsersWithModuleRoles);

router.get("/summary", getModulePermissionsSummary);

router.post("/assign", assignModuleRole);

router.post("/remove", removeModuleRole);

export default router;