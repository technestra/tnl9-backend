import express from "express";
import { createSuperAdmin, loginSuperAdmin } from "../controllers/SuperAdminController.js";

const router = express.Router(); 

router.post("/create", createSuperAdmin);
router.post("/login", loginSuperAdmin);

export default router;
