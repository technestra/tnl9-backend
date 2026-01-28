import express from "express";
import upload from "../middlewares/multer.js";
import { protect } from "../middlewares/authMiddleware.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";
import {
  uploadDocuments,
  getEmployeeDocuments,
  unlockDocuments,
  generateCloudinarySignature,
  saveUploadedUrls
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

router.get(
  "/:userId",
  protect,
  allowRoles("SUPER_ADMIN"),
  getEmployeeDocuments
);

router.post(
  "/save-urls",
  protect,
  allowRoles("USER"),
  saveUploadedUrls
);


router.put(
  "/unlock/:userId",
  protect,
  allowRoles("SUPER_ADMIN"),
  unlockDocuments
);

export default router;
