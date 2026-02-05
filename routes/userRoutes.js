import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";
import {
  createUserBySuperAdmin,
  createUserByAdmin,
  getMe,
  deactivateUser,
  getAllUsers,
  toggleUserStatus
} from "../controllers/userController.js";

const router = express.Router();

router.post('/super-admin/create', protect, allowRoles('SUPER_ADMIN'), createUserBySuperAdmin);
router.post('/admin/create', protect, allowRoles('ADMIN'), createUserByAdmin);

router.get('/me', protect, allowRoles('SUPER_ADMIN', 'ADMIN', 'USER'), getMe);
router.get('/all', protect, allowRoles('SUPER_ADMIN'), getAllUsers);

router.put('/deactivate/:id', protect, allowRoles('SUPER_ADMIN'), deactivateUser);

router.patch(
  "/:id/toggle-status",
  protect, allowRoles('SUPER_ADMIN'),
  toggleUserStatus
);


export default router;