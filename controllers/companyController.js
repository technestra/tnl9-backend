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
      // coordinatorContactNumber,
      companyCapability = [],           // default empty array
      companySize = "Not specified",
      companySource = "Other",
      companyAddress = "Not provided",
      companyCountry= "",
      hasBench = false,
      resourceFromMarket = false,
      comment = ""
    } = req.body;

    if (!companyName || !ownerName || !companyEmail ) {
      return res.status(400).json({
        message: "Missing required fields: companyName, ownerName, companyEmail"
      });
    }
    const currentUser = await User.findById(req.user.id);
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
export const getCompanyById = async (req, res) => {
  try {
    const companyId = req.params.id;
    const company = await Company.findById(companyId);

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Permission check (तुम्हारा पुराना logic)
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

    // IMPORTANT: Populate createdBy.userId + assigned users
    const populatedCompany = await Company.findById(companyId)
      .populate({
        path: "createdBy.userId",
        select: "name email role"  // सिर्फ name, email, role चाहिए
      })
      .populate("assignedAdmins", "name email")   // अगर name/email चाहिए
      .populate("assignedUsers", "name email");

    // Fallback अगर user delete हो गया हो या populate fail हो
    if (!populatedCompany.createdBy.userId) {
      populatedCompany.createdBy = {
        userId: { name: "Unknown", email: "N/A", role: company.createdBy.role }
      };
    }

    res.status(200).json(populatedCompany);
  } catch (error) {
    console.error("Error in getCompanyById:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};