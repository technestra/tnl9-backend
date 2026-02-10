import ContactPerson from "../models/ContactPerson.js";
import Company from "../models/Company.js";
import User from "../models/User.js";
import SuperAdmin from "../models/SuperAdmin.js";

export const createContact = async (req, res) => {
  try {
    const company = await Company.findById(req.body.company);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }
    let userDetails = null;
    if (req.user.role === "SUPER_ADMIN") {
      userDetails = await SuperAdmin.findById(req.user.id).select("name email");
    } else {
      userDetails = await User.findById(req.user.id).select("name email");
    }
    if (!userDetails) {
      return res.status(404).json({ message: "User not found" });
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
        userId: req.user.id,
        userName: userDetails.name,
        userEmail: userDetails.email,
        role: req.user.role
      }
    });

    res.status(201).json(contact);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const searchContacts = async (req, res) => {
  try {
    console.log("=== SEARCH CONTACTS API CALLED ===");
    console.log("User:", req.user.id, req.user.role);
    console.log("Query params:", req.query);

    const {
      search,
      company,
      createdByUserId,
      isActive,
      page = 1,
      limit = 10
    } = req.query;

    let query = {};
    if (req.user.role !== "SUPER_ADMIN") {
      query["createdBy.userId"] = req.user.id;
    }
    if (search && search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { email: { $regex: search.trim(), $options: 'i' } },
        { phone: { $regex: search.trim(), $options: 'i' } },
        { designation: { $regex: search.trim(), $options: 'i' } },
        { professionalEmail: { $regex: search.trim(), $options: 'i' } },
        { "companySnapshot.companyName": { $regex: search.trim(), $options: 'i' } }
      ];
    }

    if (company && company.trim()) {
      query.company = company;
    }
    if (createdByUserId && createdByUserId.trim()) {
      query["createdBy.userId"] = createdByUserId;
    }
    if (isActive !== undefined && isActive !== 'all' && isActive !== '') {
      if (isActive === 'true' || isActive === 'false') {
        query.isActive = isActive === 'true';
      } else if (isActive === 'active') {
        query.isActive = true;
      } else if (isActive === 'inactive') {
        query.isActive = false;
      }
    }

    console.log("Final Query:", JSON.stringify(query, null, 2));
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const contacts = await ContactPerson.find(query)
      .populate("company", "companyName")
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    const total = await ContactPerson.countDocuments(query);

    console.log("Found contacts:", contacts.length, "Total:", total);

    res.json({
      success: true,
      data: contacts,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum
      }
    });
  } catch (error) {
    console.error("=== SEARCH CONTACTS ERROR ===");
    console.error("Error:", error.message);

    res.status(500).json({
      success: false,
      message: error.message || "Internal server error"
    });
  }
};

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

    let createdByUser = null;
    if (contact.createdBy?.userId) {
      if (contact.createdBy.role === "SUPER_ADMIN") {
        createdByUser = await SuperAdmin.findById(contact.createdBy.userId)
          .select("name email");
      } else {
        createdByUser = await User.findById(contact.createdBy.userId)
          .select("name email");
      }
    }

    const response = {
      ...contact.toObject(),
      createdByUser: createdByUser || {
        name: contact.createdBy?.userName || "Unknown",
        email: contact.createdBy?.userEmail || "N/A"
      }
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getContacts = async (req, res) => {
  try {
    const { company } = req.query;
    let filter = {};

    if (company) {
      filter.company = company;
    }

    if (req.user.role !== "SUPER_ADMIN") {
      filter["createdBy.userId"] = req.user.id;
      filter.isActive = true;
    }

    const contacts = await ContactPerson
      .find(filter)
      .sort({ createdAt: -1 });

    res.status(200).json(contacts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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

export const toggleContactActive = async (req, res) => {
  try {
    console.log("=== TOGGLE CONTACT ACTIVE DEBUG ===");
    console.log("Request User:", {
      id: req.user.id,
      role: req.user.role,
      fullUser: req.user
    });
    console.log("Contact ID:", req.params.id);
    console.log("Checking role:", req.user.role === "SUPER_ADMIN");
    if (req.user.role !== "SUPER_ADMIN") {
      console.log("FAIL: User is not SUPER_ADMIN");
      return res.status(403).json({
        success: false,
        message: "Only Super Admin can toggle active status",
        userRole: req.user.role
      });
    }
    const contact = await ContactPerson.findById(req.params.id);
    if (!contact) {
      console.log("Contact not found");
      return res.status(404).json({
        success: false,
        message: "Contact not found"
      });
    }
    console.log("Current status:", contact.isActive);
    contact.isActive = !contact.isActive;
    await contact.save();

    console.log("New status:", contact.isActive);
    res.json({
      success: true,
      message: `Contact ${contact.isActive ? "activated" : "deactivated"} successfully`,
      isActive: contact.isActive,
      contact: {
        _id: contact._id,
        name: contact.name,
        isActive: contact.isActive
      }
    });
  } catch (error) {
    console.error("Toggle error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};
// Soft delete company
export const softDeleteContactPerson = async (req, res) => {
  try {
    const contactPerson = await ContactPerson.findById(req.params.id);

    if (!contactPerson) {
      return res.status(404).json({
        success: false,
        message: "Contact Person not found"
      });
    }
    if (req.user.role !== "SUPER_ADMIN" &&
      contactPerson.createdBy.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "No permission to delete this Contact Person"
      });
    }
    await contactPerson.softDelete(req.user.id);
    res.json({
      success: true,
      message: "Contact Person moved to trash"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const restoreContactPerson = async (req, res) => {
  try {
    if (req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Only Super Admin can restore Contact Person"
      });
    }

    const contactPerson = await ContactPerson.findById(req.params.id);

    if (!contactPerson) {
      return res.status(404).json({
        success: false,
        message: "Contact Person not found"
      });
    }
    await contactPerson.restore();
    res.json({
      success: true,
      message: "Contact Person restored successfully",
      contactPerson
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getTrashContactPerson = async (req, res) => {
  try {
    if (req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }
    const contactPerson = await ContactPerson.findDeleted()
      .populate("deletedBy", "name email")
      .sort({ deletedAt: -1 });
    res.json({
      success: true,
      data: contactPerson
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const permanentDeleteContactPerson = async (req, res) => {
  try {
    if (req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Only Super Admin can permanently delete"
      });
    }
    const contactPerson = await Company.findById(req.params.id);

    if (!contactPerson) {
      return res.status(404).json({
        success: false,
        message: "Contact Person not found"
      });
    }
    await User.updateMany(
      { contactPerson: contactPerson._id },
      { $pull: { contactPersons: contactPerson._id } }
    );

    await contactPerson.deleteOne();

    res.json({
      success: true,
      message: "ContactPerson permanently deleted"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};