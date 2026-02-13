import express from "express";
import { protect, requireModuleAccess, checkOwnership } from "../../middlewares/authMiddleware.js";
import * as vendorController from "./vendorController.js";

const router = express.Router();

// All routes require authentication and 'vendor' module access (at least read)
router.use(protect);
router.use(requireModuleAccess("vendor", "read")); // base: user must have vendor module access

// ----------------- Vendor Company -----------------
router
  .route("/companies")
  .get(vendorController.getVendorCompanies)
  .post(requireModuleAccess("vendor", "create"), vendorController.createVendorCompany);

router
  .route("/companies/:id")
  .get(vendorController.getVendorCompanyById)
  .put(requireModuleAccess("vendor", "update"), checkOwnership("VendorCompany"), vendorController.updateVendorCompany)
  .delete(requireModuleAccess("vendor", "delete"), checkOwnership("VendorCompany"), vendorController.deleteVendorCompany);

// ----------------- Vendor Contact -----------------
router
  .route("/contacts")
  .get(vendorController.getVendorContacts)
  .post(requireModuleAccess("vendor", "create"), vendorController.createVendorContact);

router
  .route("/contacts/:id")
  .get(vendorController.getVendorContactById)
  .put(requireModuleAccess("vendor", "update"), checkOwnership("VendorContact"), vendorController.updateVendorContact)
  .delete(requireModuleAccess("vendor", "delete"), checkOwnership("VendorContact"), vendorController.deleteVendorContact);

// ----------------- Vendor Resource -----------------
router
  .route("/resources")
  .get(vendorController.getVendorResources)
  .post(requireModuleAccess("vendor", "create"), vendorController.createVendorResource);

router
  .route("/resources/:id")
  .get(vendorController.getVendorResourceById)
  .put(requireModuleAccess("vendor", "update"), checkOwnership("VendorResource"), vendorController.updateVendorResource)
  .delete(requireModuleAccess("vendor", "delete"), checkOwnership("VendorResource"), vendorController.deleteVendorResource);

export default router;