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
    console.error("[CREATE COMPANY ERROR]:", error);
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



export const toggleCompanyActive = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
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

export const searchCompanies = async (req, res) => {
  try {
    console.log("=== SEARCH COMPANIES API CALLED ===");
    console.log("User:", req.user.id, req.user.role);
    console.log("Query params:", req.query);
    const {
      search,
      createdByUserId,
      isActive,
      page = 1,
      limit = 10
    } = req.query;
    let query = {};
    if (req.user.role === "SUPER_ADMIN") {
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
    if (search && search.trim()) {
      const searchQuery = {
        $or: [
          { companyName: { $regex: search.trim(), $options: 'i' } },
          { ownerName: { $regex: search.trim(), $options: 'i' } },
          { companyEmail: { $regex: search.trim(), $options: 'i' } },
          { companyAddress: { $regex: search.trim(), $options: 'i' } },
          { companyId: { $regex: search.trim(), $options: 'i' } }
        ]
      };

      if (query.$or) {
        query = {
          $and: [
            { $or: query.$or },
            searchQuery
          ]
        };
      } else {
        query = searchQuery;
      }
    }

    if (createdByUserId) {
      query["createdBy.userId"] = createdByUserId;
    }

    if (isActive !== undefined && isActive !== 'all') {
      query.isActive = isActive === 'true' || isActive === true;
    }
    console.log("Final Query:", JSON.stringify(query, null, 2));
    const skip = (page - 1) * limit;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    console.log("Skip:", skip, "Limit:", limitNum);
    const companies = await Company.find(query)
      .populate({
        path: "createdBy.userId",
        select: "name email role"
      })
      .populate("assignedAdmins", "name email")
      .populate("assignedUsers", "name email")
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    const total = await Company.countDocuments(query);

    console.log("Found companies:", companies.length, "Total:", total);

    res.json({
      success: true,
      data: companies,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum
      }
    });
  } catch (error) {
    console.error("=== SEARCH COMPANIES ERROR ===");
    console.error("Error Message:", error.message);
    console.error("Error Stack:", error.stack);

    res.status(500).json({
      success: false,
      message: error.message,
      details: error.toString()
    });
  }
};

export const getCompanyUsers = async (req, res) => {
  try {
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

// companyController.js में
export const getCompanyStats = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === "ADMIN") {
      query.$or = [
        { "createdBy.userId": req.user.id },
        { assignedAdmins: req.user.id }
      ];
    } else if (req.user.role === "USER") {
      query.$or = [
        { "createdBy.userId": req.user.id },
        { assignedUsers: req.user.id }
      ];
    }
    // SUPER_ADMIN के लिए कोई filter नहीं (all companies)

    console.log("📊 Stats query for user:", {
      userId: req.user.id,
      role: req.user.role,
      query: query
    });

    // ✅ Correct countDocuments queries
    const [total, active, inactive] = await Promise.all([
      Company.countDocuments(query),
      Company.countDocuments({ ...query, isActive: true }),
      Company.countDocuments({ ...query, isActive: false })
    ]);

    // ✅ Only SUPER_ADMIN can see trash count
    let trashCount = 0;
    if (req.user.role === "SUPER_ADMIN") {
      trashCount = await Company.countDocuments({ isDeleted: true });
    }

    console.log("📊 Stats results:", {
      total,
      active,
      inactive,
      trashCount
    });

    res.json({
      success: true,
      data: {
        total,
        active,
        inactive,
        trashCount
      }
    });
  } catch (error) {
    console.error("[GET COMPANY STATS ERROR]:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get company stats"
    });
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

    if (company.isDeleted) {
      return res.status(400).json({ message: "Company already in trash" });
    }

    company.isDeleted = true;
    company.deletedAt = new Date();
    await company.save();

    res.json({
      success: true,
      message: "Company moved to trash"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTrashedCompanies = async (req, res) => {
  try {
    if (req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ message: "Access denied" });
    }

    const companies = await Company.findDeleted()
      .populate("createdBy.userId", "name email role")
      .sort({ deletedAt: -1 });

    res.json({
      success: true,
      data: companies
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const restoreCompany = async (req, res) => {
  try {
    const company = await Company.findOneDeleted({ _id: req.params.id });
    if (!company) {
      return res.status(404).json({ message: "Company not found in trash" });
    }

    await company.restore();

    res.json({
      success: true,
      message: "Company restored successfully"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const permanentlyDeleteCompany = async (req, res) => {
  try {
    if (req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ message: "Access denied" });
    }

    const company = await Company.findById(req.params.id);
    if (!company || !company.isDeleted) {
      return res.status(404).json({ message: "Company not found in trash" });
    }

    await User.updateMany(
      { companies: company._id },
      { $pull: { companies: company._id } }
    );

    await Company.deleteOne({ _id: company._id });

    res.json({
      success: true,
      message: "Company permanently deleted"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const emptyCompanyTrash = async (req, res) => {
  try {
    if (req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ message: "Access denied" });
    }

    const trashedCompanies = await Company.find({ isDeleted: true });

    const companyIds = trashedCompanies.map(c => c._id);

    await User.updateMany(
      { companies: { $in: companyIds } },
      { $pull: { companies: { $in: companyIds } } }
    );

    await Company.deleteMany({ isDeleted: true });

    res.json({
      success: true,
      message: "Trash emptied successfully"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



export const getCompanies = async (req, res) => {
  try {
    let companies;

    if (req.user.role === "SUPER_ADMIN") {
      companies = await Company.find() // auto excludes deleted
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

