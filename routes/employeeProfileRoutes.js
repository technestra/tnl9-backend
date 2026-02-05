import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";
import {
  createEmployeeProfile,
  updateEmployeeProfile,
  getMyProfile,
  getEmployeeProfileById,
  uploadPhoto
} from "../controllers/employeeProfileController.js";

const router = express.Router();

router.get("/profile/me", protect, getMyProfile);
router.get("/:userId", protect, getEmployeeProfileById);
router.post("/profile/photo", protect, uploadPhoto);

router.post("/profile", protect, createEmployeeProfile);
router.put("/profile", protect, updateEmployeeProfile);

export default router;
