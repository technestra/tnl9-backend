import Company from "../models/Company.js";
import User from "../models/User.js";

export const createCompany = async (req, res) => {
  try {
    const {
      companyName,
      ownerName,
      companyEmail,
      companyWebsite = "",
      companyLinkedin = "",
      companyCapability = [],
      companySize = "Not specified",
      companySource = "Other",
      companyAddress = "Not provided",
      companyCountry = "",
      hasBench = false,
      resourceFromMarket = false,
      comment = ""
    } = req.body;

    if (!companyName || !ownerName || !companyEmail) {
      return res.status(400).json({
        message: "Missing required fields: companyName, ownerName, companyEmail"
      });
    }

    const company = await Company.create({
      companyName,
      ownerName,
      companyEmail,
      companyWebsite,
      companyLinkedin,
      companyCapability,
      companySize,
      companySource,
      companyAddress,
      companyCountry,
      hasBench,
      resourceFromMarket,
      comment,
      createdBy: {
        userId: req.user.id,
        role: req.user.role
      },
      isActive: true
    });

    if (req.user.role === "ADMIN") {
      company.assignedAdmins.addToSet(req.user.id);
      await User.findByIdAndUpdate(req.user.id, {
        $addToSet: { companies: company._id }
      });
    }

    if (req.user.role === "USER") {
      company.assignedUsers.addToSet(req.user.id);
      await User.findByIdAndUpdate(req.user.id, {
        $addToSet: { companies: company._id }
      });
    }

    await company.save();

    res.status(201).json({
      message: "Company created successfully",
      company
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const getCompanies = async (req, res) => {
  try {
    let companies;

    if (req.user.role === "SUPER_ADMIN") {
      companies = await Company.find()
        .populate("assignedAdmins", "name email")
        .populate("assignedUsers", "name email");
    }
    else if (req.user.role === "ADMIN") {
      companies = await Company.find({
        $or: [
          { "createdBy.userId": req.user.id },
          { assignedAdmins: req.user.id }
        ]
      });
    }
    else {
      companies = await Company.find({
        $or: [
          { "createdBy.userId": req.user.id },
          { assignedUsers: req.user.id }
        ]
      });
    }

    res.json(companies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    const isCreator =
      company.createdBy.userId.toString() === req.user.id;
    const isAssignedAdmin =
      company.assignedAdmins.map(id => id.toString()).includes(req.user.id);
    const isSuperAdmin = req.user.role === "SUPER_ADMIN";

    if (!isCreator && !isAssignedAdmin && !isSuperAdmin) {
      return res.status(403).json({ message: "No permission" });
    }

    const allowedFields = [
      "companyName",
      "ownerName",
      "companyEmail",
      "companyWebsite",
      "companyLinkedin",
      "companyCapability",
      "companySize",
      "companySource",
      "companyAddress",
      "companyCountry",
      "hasBench",
      "resourceFromMarket",
      "availableForDiscussionAt",
      "comment"
    ];


    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        company[field] = req.body[field];
      }
    });

    await company.save();

    res.json({
      message: "Company updated successfully",
      company
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteCompany = async (req, res) => {
  try {
    if (req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ message: "Only Super Admin can delete" });
    }

    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    await User.updateMany(
      { companies: company._id },
      { $pull: { companies: company._id } }
    );

    await company.deleteOne();

    res.json({ message: "Company deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const toggleCompanyActive = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!Company) {
      return res.status(404).json({ message: "Company not found" });
    }

    if (req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ message: "Only Super Admin allowed" });
    }

    company.isActive = !company.isActive;
    await company.save();

    res.json({
      message: `Company ${company.isActive ? "Activated" : "Deactivated"}`,
      isActive: company.isActive
    });
  } catch (error) {
    console.error("[TOGGLE ACTIVE ERROR]:", error);
    res.status(500).json({ message: error.message });
  }
};


export const getCompanyById = async (req, res) => {
  try {
    const companyId = req.params.id;
    const company = await Company.findById(companyId);

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    const isSuperAdmin = req.user.role === "SUPER_ADMIN";
    const isCreator = company.createdBy.userId.toString() === req.user.id;
    const isAssignedAdmin = company.assignedAdmins
      .map(id => id.toString())
      .includes(req.user.id);
    const isAssignedUser = company.assignedUsers
      .map(id => id.toString())
      .includes(req.user.id);

    if (!isSuperAdmin && !isCreator && !isAssignedAdmin && !isAssignedUser) {
      return res.status(403).json({ message: "You do not have permission to view this company" });
    }

    const populatedCompany = await Company.findById(companyId)
      .populate("createdBy.userId", "name email role")
      .populate("assignedAdmins", "name email")
      .populate("assignedUsers", "name email");

    res.status(200).json(populatedCompany);
  } catch (error) {
    console.error("Error in getCompanyById:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};






// companyController.js me yeh function add karein
export const searchCompanies = async (req, res) => {
  try {
    const {
      search,
      createdByUserId,
      isActive,
      page = 1,
      limit = 10
    } = req.query;

    let query = {};

    // Role-based access
    if (req.user.role === "SUPER_ADMIN") {
      // Super Admin ko sab companies dikhengi
    } else if (req.user.role === "ADMIN") {
      query.$or = [
        { "createdBy.userId": req.user.id },
        { assignedAdmins: req.user.id }
      ];
    } else {
      query.$or = [
        { "createdBy.userId": req.user.id },
        { assignedUsers: req.user.id }
      ];
    }

    // Search filter
    if (search) {
      query.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { ownerName: { $regex: search, $options: 'i' } },
        { companyEmail: { $regex: search, $options: 'i' } },
        { companyAddress: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by createdBy user
    if (createdByUserId) {
      query["createdBy.userId"] = createdByUserId;
    }

    // Filter by active status
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const skip = (page - 1) * limit;

    const companies = await Company.find(query)
      .populate({
        path: "createdBy.userId",
        select: "name email role"
      })
      .populate("assignedAdmins", "name email")
      .populate("assignedUsers", "name email")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Company.countDocuments(query);

    res.json({
      success: true,
      data: companies,
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

// companyController.js me yeh function add karein (users list ke liye)
export const getCompanyUsers = async (req, res) => {
  try {
    // Sirf SUPER_ADMIN hi sab users dekh sakta hai
    if (req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ message: "Access denied" });
    }

    const users = await User.find({ isActive: true })
      .select("_id name email role")
      .sort({ name: 1 });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};