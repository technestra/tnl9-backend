import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  createContact,
  getContacts,
  updateContact,
  deleteContact,
  getSingleContactPerson,
  toggleContactActive,
  searchContacts
} from "../controllers/contactPersonController.js";

const router = express.Router();

router.post("/", protect, createContact);
router.get("/", protect, getContacts);
router.get("/search", protect, searchContacts);
router.put("/:id", protect, updateContact);
router.get("/:id", protect, getSingleContactPerson);
router.delete("/:id", protect, deleteContact);
router.patch("/:id/toggle-active", protect, toggleContactActive);

export default router;
