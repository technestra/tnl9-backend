// import express from "express";
// import { protect } from "../middlewares/authMiddleware.js";
// import {
//   createContact,
//   getContacts,
//   updateContact,
//   deleteContact,
//   getSingleContactPerson,
//   toggleContactActive,
//   searchContacts,
//   softDeleteContactPerson, restoreContactPerson, getTrashContactPerson, permanentDeleteContactPerson
// } from "../controllers/contactPersonController.js";
// import { allowRoles } from "../middlewares/roleMiddleware.js";
// import { checkOwnership } from '../middlewares/ownershipMiddleware.js'

// const router = express.Router();

// router.post("/", protect, createContact);
// router.get("/search", protect, searchContacts);
// router.patch("/:id/toggle-active", protect, allowRoles('SUPER_ADMIN'), toggleContactActive);
// router.get("/", protect, getContacts);
// router.put("/:id", protect, checkOwnership('ContactPerson'), updateContact);
// router.get("/:id", protect, getSingleContactPerson);
// router.delete("/:id", protect, deleteContact);


// router.delete("/:id/soft", protect, checkOwnership('ContactPerson'), softDeleteContactPerson); // Soft delete
// router.get("/trash/all", protect, allowRoles('SUPER_ADMIN'), getTrashContactPerson); // Get trash
// router.patch("/:id/restore", protect, allowRoles('SUPER_ADMIN'), restoreContactPerson); // Restore
// router.delete("/:id/permanent", protect, allowRoles('SUPER_ADMIN'), permanentDeleteContactPerson); 

// export default router;
import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  createContact,
  getContacts,
  updateContact,
  deleteContact,
  getSingleContactPerson,
  toggleContactActive,
  searchContacts,
  softDeleteContactPerson,
  restoreContactPerson,
  getTrashContactPerson,
  permanentDeleteContactPerson
} from "../controllers/contactPersonController.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";
import { checkOwnership } from '../middlewares/ownershipMiddleware.js'

const router = express.Router();

router.post("/", protect, createContact);
router.get("/search", protect, searchContacts);
router.put("/:id/toggle-active", protect, allowRoles('SUPER_ADMIN'), toggleContactActive);
router.get("/", protect, getContacts);
router.put("/:id", protect, checkOwnership('ContactPerson'), updateContact);
router.get("/:id", protect, getSingleContactPerson);
router.delete("/:id", protect, deleteContact);

router.delete("/:id/soft", protect, checkOwnership('ContactPerson'), softDeleteContactPerson);
router.get("/trash/all", protect, allowRoles('SUPER_ADMIN'), getTrashContactPerson);
router.patch("/:id/restore", protect, allowRoles('SUPER_ADMIN'), restoreContactPerson);
router.delete("/:id/permanent", protect, allowRoles('SUPER_ADMIN'), permanentDeleteContactPerson);

export default router;