import ContactPerson from "../models/ContactPerson.js";
import Company from "../models/Company.js";

/* =========================
   CREATE CONTACT PERSON
========================= */
export const createContact = async (req, res) => {
  try {
    const company = await Company.findById(req.body.company);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    const contact = await ContactPerson.create({
      ...req.body,
      companySnapshot: {
        companyName: company.companyName,
        ownerName: company.ownerName,
        companyLinkedin: company.companyLinkedin,
        companyContact: company.coordinatorContactNumber
      },
      createdBy: {
        userId: req.user.id,   // ✅ JWT ID
        role: req.user.role
      }
    });

    res.status(201).json(contact);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



/* =========================
   GET ALL CONTACT PERSONS
   ROLE BASED VISIBILITY
========================= */
export const getContacts = async (req, res) => {
  try {
    let filter = {};

    if (req.user.role !== "SUPER_ADMIN") {
      filter.createdBy = { userId: req.user.id };
      filter.isActive = true;
    }

    const contacts = await ContactPerson.find(filter).sort({ createdAt: -1 });
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



/* =========================
   GET SINGLE CONTACT
========================= */
export const getSingleContactPerson = async (req, res) => {
  try {
    const contact = await ContactPerson.findById(req.params.id)
      .populate("company");

    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }

    if (!contact.isActive && req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(contact);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   UPDATE CONTACT PERSON
========================= */
export const updateContact = async (req, res) => {
  const contact = await ContactPerson.findById(req.params.id);
  if (!contact) {
    return res.status(404).json({ message: "Contact not found" });
  }

  if (
    req.user.role !== "SUPER_ADMIN" &&
    contact.createdBy.userId !== req.user.id
  ) {
    return res.status(403).json({ message: "Not allowed" });
  }

  Object.assign(contact, req.body);
  await contact.save();

  res.json(contact);
};




/* =========================
   DELETE CONTACT PERSON
========================= */
export const deleteContact = async (req, res) => {
  const contact = await ContactPerson.findById(req.params.id);
  if (!contact) {
    return res.status(404).json({ message: "Contact not found" });
  }

  if (
    req.user.role !== "SUPER_ADMIN" &&
    contact.createdBy.userId !== req.user.id
  ) {
    return res.status(403).json({ message: "Not allowed" });
  }

  await contact.deleteOne();
  res.json({ message: "Contact deleted" });
};



/* =========================
   TOGGLE ACTIVE / INACTIVE
   SUPER ADMIN ONLY
========================= */
export const toggleContactActive = async (req, res) => {
  if (req.user.role !== "SUPER_ADMIN") {
    return res.status(403).json({ message: "Only Super Admin allowed" });
  }

  const contact = await ContactPerson.findById(req.params.id);
  if (!contact) {
    return res.status(404).json({ message: "Contact not found" });
  }

  contact.isActive = !contact.isActive;
  await contact.save();

  res.json({
    message: `Contact ${contact.isActive ? "Activated" : "Deactivated"}`,
    isActive: contact.isActive
  });
};
