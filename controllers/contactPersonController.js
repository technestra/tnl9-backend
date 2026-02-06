import ContactPerson from "../models/ContactPerson.js";
import Company from "../models/Company.js";
// Import required models at top
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

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { designation: { $regex: search, $options: 'i' } },
        { "companySnapshot.companyName": { $regex: search, $options: 'i' } }
      ];
    }

    if (company) {
      query.company = company;
    }

    if (createdByUserId) {
      query["createdBy.userId"] = createdByUserId;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const skip = (page - 1) * limit;

    const contacts = await ContactPerson.find(query)
      .populate("company", "companyName")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await ContactPerson.countDocuments(query);

    res.json({
      success: true,
      data: contacts,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
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


