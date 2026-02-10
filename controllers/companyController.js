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

export const getCompanies = async (req, res) => {
  try {
    let companies;

    if (req.user.role === "SUPER_ADMIN") {
      companies = await Company.find()
        .populate("assignedAdmins", "name email")
        .populate("assignedUsers", "name email");
    } else if (req.user.role === "ADMIN") {
      companies = await Company.find({
        $or: [
          { "createdBy.userId": req.user.id },
          { assignedAdmins: req.user.id }
        ]
      });
    } else {
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




export const softDeleteCompany = async (req, res) => {
  try {
    const companyId = req.params.id;

    // Find company with deleted records (include trashed)
    const company = await Company.findOneWithDeleted({ _id: companyId });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found"
      });
    }

    // Check if already deleted
    if (company.isDeleted) {
      return res.status(400).json({
        success: false,
        message: "Company is already in trash"
      });
    }

    // Check permissions - Creator, Assigned Admin, or Super Admin can delete
    const isCreator = company.createdBy?.userId?.toString() === req.user.id;
    const isAssignedAdmin = company.assignedAdmins?.some(
      adminId => adminId.toString() === req.user.id
    );
    const isSuperAdmin = req.user.role === "SUPER_ADMIN";

    if (!isCreator && !isAssignedAdmin && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: "No permission to delete this company"
      });
    }

    // Use the plugin's softDelete method
    await company.softDelete(req.user.id);

    console.log("[SOFT DELETE] Success - ID:", companyId);

    res.json({
      success: true,
      message: "Company moved to trash successfully"
    });
  } catch (error) {
    console.error("[SOFT DELETE ERROR]:", error.message, error.stack);
    res.status(500).json({
      success: false,
      message: error.message || "Soft delete failed"
    });
  }
};

export const getTrashCompanies = async (req, res) => {
  try {
    if (req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only Super Admin can view trash."
      });
    }

    // Use the plugin's findDeleted method
    const companies = await Company.findDeleted({})
      .populate("deletedBy", "name email")
      .populate("createdBy.userId", "name email")
      .sort({ deletedAt: -1 });

    res.json({
      success: true,
      count: companies.length,
      data: companies
    });
  } catch (error) {
    console.error("[GET TRASH ERROR]:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// companyController.js में restoreCompany function को ये करें
export const restoreCompany = async (req, res) => {
  try {
    console.log("🔍 [RESTORE REQUEST START]");
    console.log("Company ID:", req.params.id);
    console.log("User ID:", req.user.id);
    console.log("User Role:", req.user.role);

    // Permission check
    if (req.user.role !== "SUPER_ADMIN") {
      console.log("❌ [RESTORE] Permission denied - Not SUPER_ADMIN");
      return res.status(403).json({
        success: false,
        message: "Only Super Admin can restore companies"
      });
    }

    const companyId = req.params.id;

    // DEBUG: पहले ये check करें कि company exists है या नहीं
    console.log("🔍 [RESTORE] Looking for company with ID:", companyId);

    // Option 1: Simple findById
    const company = await Company.findById(companyId);

    console.log("🔍 [RESTORE] Company found via findById:", {
      found: !!company,
      id: company?._id,
      name: company?.companyName,
      isDeleted: company?.isDeleted,
      deletedAt: company?.deletedAt
    });

    if (!company) {
      console.log("❌ [RESTORE] Company not found with simple findById");

      // Option 2: Try with withDeleted option
      try {
        const companyWithDeleted = await Company.findById(companyId, null, { withDeleted: true });
        console.log("🔍 [RESTORE] Company found with withDeleted:", {
          found: !!companyWithDeleted,
          isDeleted: companyWithDeleted?.isDeleted
        });
      } catch (findError) {
        console.log("❌ [RESTORE] Error finding with withDeleted:", findError.message);
      }

      return res.status(404).json({
        success: false,
        message: "Company not found"
      });
    }

    // Check if company is actually deleted
    console.log("🔍 [RESTORE] Checking isDeleted status:", company.isDeleted);

    if (!company.isDeleted) {
      console.log("⚠️ [RESTORE] Company is NOT deleted (isDeleted = false)");
      return res.status(400).json({
        success: false,
        message: "Company is not in trash"
      });
    }

    console.log("✅ [RESTORE] Company is deleted, proceeding to restore...");

    // SIMPLE RESTORE - Direct update
    company.isDeleted = false;
    company.deletedAt = null;
    company.deletedBy = null;

    await company.save();

    console.log("✅ [RESTORE] Company restored successfully");

    res.json({
      success: true,
      message: "Company restored successfully",
      data: {
        _id: company._id,
        companyName: company.companyName,
        isDeleted: company.isDeleted
      }
    });

  } catch (error) {
    console.error("❌ [RESTORE ERROR]:", error);
    console.error("❌ [RESTORE ERROR Stack]:", error.stack);

    res.status(500).json({
      success: false,
      message: error.message || "Restore failed",
      errorDetails: error.message
    });
  }
};

export const permanentDeleteCompany = async (req, res) => {
  try {
    // Only Super Admin can permanently delete
    if (req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Only Super Admin can permanently delete"
      });
    }

    // Find company including deleted ones
    const company = await Company.findOneWithDeleted({ _id: req.params.id });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found"
      });
    }

    // Check if it's in trash
    if (!company.isDeleted) {
      return res.status(400).json({
        success: false,
        message: "Company is not in trash. Use normal delete instead."
      });
    }

    // Remove company from users' companies array before deleting
    await User.updateMany(
      { companies: company._id },
      { $pull: { companies: company._id } }
    );

    // Permanent delete
    await company.deleteOne();

    console.log("[PERMANENT DELETE] Success - ID:", req.params.id);

    res.json({
      success: true,
      message: "Company permanently deleted from trash"
    });
  } catch (error) {
    console.error("[PERMANENT DELETE ERROR]:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Permanent delete failed"
    });
  }
};

// Add this function for emptying trash
export const emptyTrash = async (req, res) => {
  try {
    if (req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Only Super Admin can empty trash"
      });
    }

    // Find all deleted companies
    const deletedCompanies = await Company.findDeleted({});

    if (deletedCompanies.length === 0) {
      return res.json({
        success: true,
        message: "Trash is already empty"
      });
    }

    // Remove from users' companies array
    for (const company of deletedCompanies) {
      await User.updateMany(
        { companies: company._id },
        { $pull: { companies: company._id } }
      );
    }

    // Delete all permanently
    await Company.deleteMany({ isDeleted: true });

    console.log("[EMPTY TRASH] Deleted", deletedCompanies.length, "companies");

    res.json({
      success: true,
      message: `Trash emptied successfully. ${deletedCompanies.length} companies permanently deleted.`
    });
  } catch (error) {
    console.error("[EMPTY TRASH ERROR]:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to empty trash"
    });
  }
};
