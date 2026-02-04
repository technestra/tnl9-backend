import Suspect from "../models/Suspect.js";
import Company from "../models/Company.js";

export const createSuspect = async (req, res) => {
  try { 
    const { companyId } = req.params;

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    const isOwner = company.createdBy.userId.toString() === req.user.id;
    const isAssigned =
      company.assignedAdmins.includes(req.user.id) ||
      company.assignedUsers.includes(req.user.id);
    const isSuperAdmin = req.user.role === "SUPER_ADMIN";

    if (!isOwner && !isAssigned && !isSuperAdmin) {
      return res.status(403).json({ message: "No permission to add suspect" });
    }

    const year = new Date().getFullYear();
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    const suspectId = `S-${year}-${random}`;

    const suspect = await Suspect.create({
      suspectId,
      ...req.body,  
      company: companyId,
      companySnapshot: {
        companyName: company.companyName,
        companyEmail: company.companyEmail,
        companyWebsite: company.companyWebsite,
        companyLinkedin: company.companyLinkedin,
        companyAddress: company.companyAddress
      },
      createdBy: {
        userId: req.user.id,
        role: req.user.role
      }
    });

    res.status(201).json({
      message: "Suspect created successfully",
      suspect
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllSuspects = async (req, res) => {
  try {
    const { company } = req.query;
    let filter = {
      status: { $ne: "Converted" }
    };

    if (req.user.role !== "SUPER_ADMIN") {
      filter["createdBy.userId"] = req.user.id;
    }
    if (company) {
      filter.company = company;
    }
    const suspects = await Suspect.find(filter)
      .populate("company", "companyName")
      .sort({ createdAt: -1 });
    res.json(suspects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCompanySuspects = async (req, res) => {
  try {
    const { companyId } = req.params;

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    const isOwner =
      company.createdBy.userId.toString() === req.user.id;

    const isSuperAdmin = req.user.role === "SUPER_ADMIN";

    if (!isOwner && !isSuperAdmin) {
      return res.status(403).json({ message: "No permission" });
    }

    const suspects = await Suspect.find({ company: companyId })
      .populate("company", "companyName")
      .sort({ createdAt: -1 });

    res.json(suspects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateSuspect = async (req, res) => {
  try {
    const suspect = await Suspect.findById(req.params.id);

    if (!suspect) {
      return res.status(404).json({ message: "Suspect not found" });
    }

    const isCreator =
      suspect.createdBy.userId.toString() === req.user.id;
    const isSuperAdmin = req.user.role === "SUPER_ADMIN";

    if (!isCreator && !isSuperAdmin) {
      return res.status(403).json({ message: "No permission to update suspect" });
    }

    const allowedFields = [
      "contactSnapshots",        
      "contactPersonIds",      
      "currentCompany",
      "budget",
      "firstContactedOn",
      "lastFollowedUpOn",
      "nextFollowUpOn",
      "interestLevel",
      "companySnapshot",
      "remarks",
      "suspectSource",
      "status",
      "isActive"
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        suspect[field] = req.body[field];
      }
    });

    await suspect.save();

    res.json({
      message: "Suspect updated successfully",
      suspect
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteSuspect = async (req, res) => {
  try {
    const suspect = await Suspect.findById(req.params.id);
    if (!suspect) {
      return res.status(404).json({ message: "Suspect not found" });
    }

    const isCreator =
      suspect.createdBy.userId.toString() === req.user.id;

    const isSuperAdmin = req.user.role === "SUPER_ADMIN";

    if (!isCreator && !isSuperAdmin) {
      return res.status(403).json({ message: "No permission" });
    }

    await suspect.deleteOne();

    res.json({ message: "Suspect deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const toggleSuspectActive = async (req, res) => {
  try {
    console.log("REQ.USER IN CONTROLLER:", req.user);
    
    if (req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ message: "Only Super Admin allowed" });
    }

    const suspect = await Suspect.findById(req.params.id);
    if (!suspect) {
      return res.status(404).json({ message: "Suspect not found" });
    }

    suspect.isActive = !suspect.isActive;
    await suspect.save();

    res.json({
      message: `Suspect ${suspect.isActive ? "Activated" : "Deactivated"}`,
      isActive: suspect.isActive
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSuspectById = async (req, res) => {
  try {
    const suspect = await Suspect.findById(req.params.id)
      .populate("company", "companyName");

    if (!suspect) {
      return res.status(404).json({ message: "Suspect not found" });
    }

    const isCreator =
      suspect.createdBy.userId.toString() === req.user.id;

    const isSuperAdmin = req.user.role === "SUPER_ADMIN";

    if (!isCreator && !isSuperAdmin) {
      return res.status(403).json({ message: "No permission to view suspect" });
    }

    res.json(suspect);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
