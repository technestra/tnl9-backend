import express from "express";
import upload from "../middlewares/multer.js";
import { protect } from "../middlewares/authMiddleware.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";
import {
  uploadDocuments,
  getEmployeeDocuments,
  unlockDocuments,
  generateCloudinarySignature,
  saveUploadedUrls,
  getDocumentStatus,
  unlockSingleDocument
} from "../controllers/employeeDocumentController.js";

const router = express.Router();

router.post(
  "/upload",
  protect,
  allowRoles("USER"),
  upload.fields([
    { name: "RESUME" },
    { name: "OFFER_LETTER" },
    { name: "APPOINTMENT_LETTER" },
    { name: "ID_PROOF" },
    { name: "ADDRESS_PROOF" },
    { name: "BANK_PROOF" },
    { name: "EDUCATION_CERTIFICATE" },
    { name: "EXPERIENCE_LETTER" },
    { name: "COMPLIANCE_DECLARATION" }
  ]),
  uploadDocuments
);

router.get(
  "/cloudinary-signature",
  protect,
  allowRoles("USER"),
  generateCloudinarySignature
);

router.get("/status", protect, allowRoles("USER"), getDocumentStatus);

router.post(
  "/save-urls",
  protect,
  allowRoles("USER"),
  saveUploadedUrls
);

router.get(
  "/:userId",
  protect,
  allowRoles("SUPER_ADMIN"),
  getEmployeeDocuments
);

router.put(
  "/unlock/:userId",
  protect,
  allowRoles("SUPER_ADMIN"),
  unlockDocuments
);

router.put(
  "/unlock/:userId/:field",
  protect,
  allowRoles("SUPER_ADMIN"),
  unlockSingleDocument
);

export default router;
