// import Company from "../models/Company.js";
// import User from "../models/User.js";

// export const createCompany = async (req, res) => {
//   try {
//     const {
//       companyName,
//       ownerName,
//       companyEmail,
//       companyWebsite = "",
//       companyLinkedin = "",
//       companyCapability = [],
//       companySize = "Not specified",
//       companySource = "Other",
//       companyAddress = "Not provided",
//       companyCountry = "",
//       hasBench = false,
//       resourceFromMarket = false,
//       comment = ""
//     } = req.body;

//     if (!companyName || !ownerName || !companyEmail) {
//       return res.status(400).json({
//         message: "Missing required fields: companyName, ownerName, companyEmail"
//       });
//     }

//     const company = await Company.create({
//       companyName,
//       ownerName,
//       companyEmail,
//       companyWebsite,
//       companyLinkedin,
//       companyCapability,
//       companySize,
//       companySource,
//       companyAddress,
//       companyCountry,
//       hasBench,
//       resourceFromMarket,
//       comment,
//       createdBy: {
//         userId: req.user.id,
//         role: req.user.role
//       },
//       isActive: true
//     });

//     if (req.user.role === "ADMIN") {
//       company.assignedAdmins.addToSet(req.user.id);
//       await User.findByIdAndUpdate(req.user.id, {
//         $addToSet: { companies: company._id }
//       });
//     }

//     if (req.user.role === "USER") {
//       company.assignedUsers.addToSet(req.user.id);
//       await User.findByIdAndUpdate(req.user.id, {
//         $addToSet: { companies: company._id }
//       });
//     }

//     await company.save();

//     res.status(201).json({
//       message: "Company created successfully",
//       company
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: error.message });
//   }
// };

// export const getCompanies = async (req, res) => {
//   try {
//     let companies;

//     if (req.user.role === "SUPER_ADMIN") {
//       companies = await Company.find()
//         .populate("assignedAdmins", "name email")
//         .populate("assignedUsers", "name email");
//     }
//     else if (req.user.role === "ADMIN") {
//       companies = await Company.find({
//         $or: [
//           { "createdBy.userId": req.user.id },
//           { assignedAdmins: req.user.id }
//         ]
//       });
//     }
//     else {
//       companies = await Company.find({
//         $or: [
//           { "createdBy.userId": req.user.id },
//           { assignedUsers: req.user.id }
//         ]
//       });
//     }

//     res.json(companies);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// export const updateCompany = async (req, res) => {
//   try {
//     const company = await Company.findById(req.params.id);
//     if (!company) {
//       return res.status(404).json({ message: "Company not found" });
//     }

//     const isCreator =
//       company.createdBy.userId.toString() === req.user.id;
//     const isAssignedAdmin =
//       company.assignedAdmins.map(id => id.toString()).includes(req.user.id);
//     const isSuperAdmin = req.user.role === "SUPER_ADMIN";

//     if (!isCreator && !isAssignedAdmin && !isSuperAdmin) {
//       return res.status(403).json({ message: "No permission" });
//     }

//     const allowedFields = [
//       "companyName",
//       "ownerName",
//       "companyEmail",
//       "companyWebsite",
//       "companyLinkedin",
//       "companyCapability",
//       "companySize",
//       "companySource",
//       "companyAddress",
//       "companyCountry",
//       "hasBench",
//       "resourceFromMarket",
//       "availableForDiscussionAt",
//       "comment"
//     ];


//     allowedFields.forEach(field => {
//       if (req.body[field] !== undefined) {
//         company[field] = req.body[field];
//       }
//     });

//     await company.save();

//     res.json({
//       message: "Company updated successfully",
//       company
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// export const deleteCompany = async (req, res) => {
//   try {
//     if (req.user.role !== "SUPER_ADMIN") {
//       return res.status(403).json({ message: "Only Super Admin can delete" });
//     }

//     const company = await Company.findById(req.params.id);
//     if (!company) {
//       return res.status(404).json({ message: "Company not found" });
//     }

//     await User.updateMany(
//       { companies: company._id },
//       { $pull: { companies: company._id } }
//     );

//     await company.deleteOne();

//     res.json({ message: "Company deleted successfully" });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };


// export const toggleCompanyActive = async (req, res) => {
//   try {
//     const company = await Company.findById(req.params.id);
//     if (!Company) {
//       return res.status(404).json({ message: "Company not found" });
//     }

//     if (req.user.role !== "SUPER_ADMIN") {
//       return res.status(403).json({ message: "Only Super Admin allowed" });
//     }

//     company.isActive = !company.isActive;
//     await company.save();

//     res.json({
//       message: `Company ${company.isActive ? "Activated" : "Deactivated"}`,
//       isActive: company.isActive
//     });
//   } catch (error) {
//     console.error("[TOGGLE ACTIVE ERROR]:", error);
//     res.status(500).json({ message: error.message });
//   }
// };


// export const getCompanyById = async (req, res) => {
//   try {
//     const companyId = req.params.id;
//     const company = await Company.findById(companyId);

//     if (!company) {
//       return res.status(404).json({ message: "Company not found" });
//     }

//     const isSuperAdmin = req.user.role === "SUPER_ADMIN";
//     const isCreator = company.createdBy.userId.toString() === req.user.id;
//     const isAssignedAdmin = company.assignedAdmins
//       .map(id => id.toString())
//       .includes(req.user.id);
//     const isAssignedUser = company.assignedUsers
//       .map(id => id.toString())
//       .includes(req.user.id);

//     if (!isSuperAdmin && !isCreator && !isAssignedAdmin && !isAssignedUser) {
//       return res.status(403).json({ message: "You do not have permission to view this company" });
//     }

//     const populatedCompany = await Company.findById(companyId)
//       .populate("createdBy.userId", "name email role")
//       .populate("assignedAdmins", "name email")
//       .populate("assignedUsers", "name email");

//     res.status(200).json(populatedCompany);
//   } catch (error) {
//     console.error("Error in getCompanyById:", error);
//     res.status(500).json({ message: error.message || "Server error" });
//   }
// };

// export const searchCompanies = async (req, res) => {
//   try {
//     console.log("=== SEARCH COMPANIES API CALLED ===");
//     console.log("User:", req.user.id, req.user.role);
//     console.log("Query params:", req.query);

//     const {
//       search,
//       createdByUserId,
//       isActive,
//       page = 1,
//       limit = 10
//     } = req.query;

//     // Build query
//     let query = {};

//     // Role-based access
//     if (req.user.role === "SUPER_ADMIN") {
//       // No restriction for super admin
//     } else if (req.user.role === "ADMIN") {
//       query.$or = [
//         { "createdBy.userId": req.user.id },
//         { assignedAdmins: req.user.id }
//       ];
//     } else {
//       query.$or = [
//         { "createdBy.userId": req.user.id },
//         { assignedUsers: req.user.id }
//       ];
//     }

//     // Search filter
//     if (search && search.trim()) {
//       const searchQuery = {
//         $or: [
//           { companyName: { $regex: search.trim(), $options: 'i' } },
//           { ownerName: { $regex: search.trim(), $options: 'i' } },
//           { companyEmail: { $regex: search.trim(), $options: 'i' } },
//           { companyAddress: { $regex: search.trim(), $options: 'i' } },
//           { companyId: { $regex: search.trim(), $options: 'i' } }
//         ]
//       };

//       // Combine with existing query
//       if (query.$or) {
//         query = { 
//           $and: [
//             { $or: query.$or },
//             searchQuery
//           ] 
//         };
//       } else {
//         query = searchQuery;
//       }
//     }

//     // Filter by createdBy user
//     if (createdByUserId) {
//       query["createdBy.userId"] = createdByUserId;
//     }

//     // Filter by active status
//     if (isActive !== undefined && isActive !== 'all') {
//       query.isActive = isActive === 'true' || isActive === true;
//     }

//     console.log("Final Query:", JSON.stringify(query, null, 2));

//     const skip = (page - 1) * limit;
//     const pageNum = parseInt(page);
//     const limitNum = parseInt(limit);

//     console.log("Skip:", skip, "Limit:", limitNum);

//     const companies = await Company.find(query)
//       .populate({
//         path: "createdBy.userId",
//         select: "name email role"
//       })
//       .populate("assignedAdmins", "name email")
//       .populate("assignedUsers", "name email")
//       .skip(skip)
//       .limit(limitNum)
//       .sort({ createdAt: -1 });

//     const total = await Company.countDocuments(query);

//     console.log("Found companies:", companies.length, "Total:", total);

//     res.json({
//       success: true,
//       data: companies,
//       pagination: {
//         total,
//         page: pageNum,
//         pages: Math.ceil(total / limitNum),
//         limit: limitNum
//       }
//     });

//   } catch (error) {
//     console.error("=== SEARCH COMPANIES ERROR ===");
//     console.error("Error Message:", error.message);
//     console.error("Error Stack:", error.stack);
    
//     res.status(500).json({
//       success: false,
//       message: error.message,
//       details: error.toString()
//     });
//   }
// };

// // companyController.js me yeh function add karein (users list ke liye)
// export const getCompanyUsers = async (req, res) => {
//   try {
//     // Sirf SUPER_ADMIN hi sab users dekh sakta hai
//     if (req.user.role !== "SUPER_ADMIN") {
//       return res.status(403).json({ message: "Access denied" });
//     }

//     const users = await User.find({ isActive: true })
//       .select("_id name email role")
//       .sort({ name: 1 });

//     res.json({
//       success: true,
//       data: users
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };



// // Soft delete company
// export const softDeleteCompany = async (req, res) => {
//   try {
//     const companyId = req.params.id;
    
//     console.log("Soft deleting company:", companyId, "User:", req.user.id); // Debug

//     const company = await Company.findOne({ _id: companyId, isDeleted: false });
    
//     if (!company) {
//       return res.status(404).json({ 
//         success: false,
//         message: "Company not found or already deleted" 
//       });
//     }

//     // Permission check
//     const isSuperAdmin = req.user.role === "SUPER_ADMIN";
//     const isCreator = company.createdBy?.userId?.toString() === req.user.id;
    
//     console.log("Permission check:", { isSuperAdmin, isCreator }); // Debug

//     if (!isSuperAdmin && !isCreator) {
//       return res.status(403).json({ 
//         success: false,
//         message: "No permission to delete this company" 
//       });
//     }

//     // Soft delete
//     company.isDeleted = true;
//     company.deletedAt = new Date();
//     company.deletedBy = req.user.id;
    
//     await company.save();
    
//     console.log("Company soft deleted successfully:", companyId); // Debug

//     res.json({
//       success: true,
//       message: "Company moved to trash successfully"
//     });
//   } catch (error) {
//     console.error("Soft delete error:", error);
//     res.status(500).json({ 
//       success: false,
//       message: error.message 
//     });
//   }
// };

// // Restore company from trash
// export const restoreCompany = async (req, res) => {
//   try {
//     if (req.user.role !== "SUPER_ADMIN") {
//       return res.status(403).json({ 
//         success: false,
//         message: "Only Super Admin can restore companies" 
//       });
//     }

//     const company = await Company.findById(req.params.id);
    
//     if (!company) {
//       return res.status(404).json({ 
//         success: false,
//         message: "Company not found" 
//       });
//     }

//     await company.restore();
    
//     res.json({
//       success: true,
//       message: "Company restored successfully",
//       company
//     });
//   } catch (error) {
//     res.status(500).json({ 
//       success: false,
//       message: error.message 
//     });
//   }
// };

// // Get trash companies
// export const getTrashCompanies = async (req, res) => {
//   try {
//     if (req.user.role !== "SUPER_ADMIN") {
//       return res.status(403).json({ 
//         success: false,
//         message: "Access denied" 
//       });
//     }

//     const companies = await Company.findDeleted()
//       .populate("deletedBy", "name email")
//       .sort({ deletedAt: -1 });
    
//     res.json({
//       success: true,
//       data: companies
//     });
//   } catch (error) {
//     res.status(500).json({ 
//       success: false,
//       message: error.message 
//     });
//   }
// };

// // Permanent delete
// export const permanentDeleteCompany = async (req, res) => {
//   try {
//     if (req.user.role !== "SUPER_ADMIN") {
//       return res.status(403).json({ 
//         success: false,
//         message: "Only Super Admin can permanently delete" 
//       });
//     }

//     const company = await Company.findById(req.params.id);
    
//     if (!company) {
//       return res.status(404).json({ 
//         success: false,
//         message: "Company not found" 
//       });
//     }

//     // Remove company from users' companies array
//     await User.updateMany(
//       { companies: company._id },
//       { $pull: { companies: company._id } }
//     );

//     await company.deleteOne();
    
//     res.json({
//       success: true,
//       message: "Company permanently deleted"
//     });
//   } catch (error) {
//     res.status(500).json({ 
//       success: false,
//       message: error.message 
//     });
//   }
// };
// // CompanyController.js mein yeh function add karo
// export const getCompanyStats = async (req, res) => {
//   try {
//     let totalQuery = {};
//     let activeQuery = { isActive: true };
//     let inactiveQuery = { isActive: false };
    
//     // Role-based filtering for non-super admins
//     if (req.user.role === "ADMIN") {
//       totalQuery.$or = [
//         { "createdBy.userId": req.user.id },
//         { assignedAdmins: req.user.id }
//       ];
//       activeQuery.$or = [
//         { "createdBy.userId": req.user.id },
//         { assignedAdmins: req.user.id }
//       ];
//       inactiveQuery.$or = [
//         { "createdBy.userId": req.user.id },
//         { assignedAdmins: req.user.id }
//       ];
//     } else if (req.user.role === "USER") {
//       totalQuery.$or = [
//         { "createdBy.userId": req.user.id },
//         { assignedUsers: req.user.id }
//       ];
//       activeQuery.$or = [
//         { "createdBy.userId": req.user.id },
//         { assignedUsers: req.user.id }
//       ];
//       inactiveQuery.$or = [
//         { "createdBy.userId": req.user.id },
//         { assignedUsers: req.user.id }
//       ];
//     }

//     const [total, active, inactive, trashCount] = await Promise.all([
//       Company.countDocuments(totalQuery),
//       Company.countDocuments({ ...activeQuery, isActive: true }),
//       Company.countDocuments({ ...inactiveQuery, isActive: false }),
//       req.user.role === "SUPER_ADMIN" ? 
//         Company.countDocuments({ isDeleted: true }) : 0
//     ]);

//     res.json({
//       success: true,
//       data: {
//         total,
//         active,
//         inactive,
//         trashCount
//       }
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };


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

    // Role-based assignment (create के बाद save की जरूरत नहीं, क्योंकि create ने save कर दिया)
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

    // No need for await company.save() here - create() already saved it
    // But if you modified assignedAdmins/assignedUsers, save once more
    await company.save();  // ये जरूरी है क्योंकि assignedAdmins/users update किए

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

    // Role-based access
    if (req.user.role === "SUPER_ADMIN") {
      // No restriction for super admin
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

      // Combine with existing query
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

    // Filter by createdBy user
    if (createdByUserId) {
      query["createdBy.userId"] = createdByUserId;
    }

    // Filter by active status
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

export const softDeleteCompany = async (req, res) => {
  try {
    const companyId = req.params.id;
    
    console.log("[SOFT DELETE] Attempting to delete ID:", companyId);

    // Find the company (normal findById)
    const company = await Company.findById(companyId);
    
    if (!company) {
      console.log("[SOFT DELETE] Company not found");
      return res.status(404).json({ 
        success: false,
        message: "Company not found" 
      });
    }

    const isSuperAdmin = req.user.role === "SUPER_ADMIN";
    const isCreator = company.createdBy?.userId?.toString() === req.user.id;

    if (!isSuperAdmin && !isCreator) {
      console.log("[SOFT DELETE] Permission denied");
      return res.status(403).json({ 
        success: false,
        message: "No permission to delete this company" 
      });
    }

    // Manual update (plugin method की बजाय direct update – safe & reliable)
    await Company.updateOne(
      { _id: companyId },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: req.user.id
        }
      }
    );

    console.log("[SOFT DELETE] Success - updated ID:", companyId);

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
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // findWithDeleted + explicit isDeleted: true filter
    const companies = await Company.findWithDeleted({ isDeleted: true })
      .populate("deletedBy", "name email")
      .sort({ deletedAt: -1 })
      .lean();

    res.json({
      success: true,
      count: companies.length,
      data: companies
    });
  } catch (error) {
    console.error("[GET TRASH ERROR]:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Restore company from trash
export const restoreCompany = async (req, res) => {
  try {
    if (req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ 
        success: false,
        message: "Only Super Admin can restore companies" 
      });
    }

    // withDeleted: true से trash में company ढूंढो
    const company = await Company.findById(req.params.id, null, { withDeleted: true });
    
    if (!company) {
      return res.status(404).json({ 
        success: false,
        message: "Company not found (even in trash)" 
      });
    }

    if (!company.isDeleted) {
      return res.status(400).json({ 
        success: false,
        message: "Company is not in trash" 
      });
    }

    // Plugin का restore method
    await company.restore();

    res.json({
      success: true,
      message: "Company restored successfully",
      restoredCompany: company  // optional: returned company
    });
  } catch (error) {
    console.error("[RESTORE ERROR]:", error);
    res.status(500).json({ 
      success: false,
      message: error.message || "Restore failed"
    });
  }
};

// Permanent delete (trash से)
export const permanentDeleteCompany = async (req, res) => {
  try {
    if (req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ 
        success: false,
        message: "Only Super Admin can permanently delete" 
      });
    }

    // Trash में company ढूंढो
    const company = await Company.findById(req.params.id, null, { withDeleted: true });
    
    if (!company) {
      return res.status(404).json({ 
        success: false,
        message: "Company not found (even in trash)" 
      });
    }

    if (!company.isDeleted) {
      return res.status(400).json({ 
        success: false,
        message: "Company is not in trash" 
      });
    }

    // User से remove
    await User.updateMany(
      { companies: company._id },
      { $pull: { companies: company._id } }
    );

    await company.deleteOne();

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

// CompanyController.js mein yeh function add karo
export const getCompanyStats = async (req, res) => {
  try {
    let query = {};

    // Role-based filtering
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

    const [total, active, inactive, trashCount] = await Promise.all([
      Company.countDocuments(query),
      Company.countDocuments({ ...query, isActive: true }),
      Company.countDocuments({ ...query, isActive: false }),
      req.user.role === "SUPER_ADMIN" ? 
        Company.countDocuments({ isDeleted: true }) : 0
    ]);

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
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};