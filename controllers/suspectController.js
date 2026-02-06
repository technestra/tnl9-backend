import Suspect from "../models/Suspect.js";
import Company from "../models/Company.js";
import User from "../models/User.js";
import SuperAdmin from "../models/SuperAdmin.js";

export const createSuspect = async (req, res) => {
  try {
    const { companyId } = req.params;

    const company = await Company.findById(companyId);
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
        userName: userDetails.name,
        userEmail: userDetails.email,
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

    const isCreator = suspect.createdBy?.userId?.toString() === req.user.id;
    const isSuperAdmin = req.user.role === "SUPER_ADMIN";

    if (!isCreator && !isSuperAdmin) {
      return res.status(403).json({ message: "No permission to view suspect" });
    }

    res.json(suspect);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const searchSuspects = async (req, res) => {
  try {
    const {
      search,
      company,
      createdByUserId,
      isActive,
      status,
      page = 1,
      limit = 10
    } = req.query;

    let query = {};

    if (req.user.role !== "SUPER_ADMIN") {
      query["createdBy.userId"] = req.user.id;
    }

    if (search) {
      query.$or = [
        { suspectId: { $regex: search, $options: 'i' } },
        { "companySnapshot.companyName": { $regex: search, $options: 'i' } },
        { "contactSnapshots.name": { $regex: search, $options: 'i' } },
        { "contactSnapshots.email": { $regex: search, $options: 'i' } },
        { "contactSnapshots.phone": { $regex: search, $options: 'i' } }
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

    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const suspects = await Suspect.find(query)
      .populate("company", "companyName")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Suspect.countDocuments(query);

    res.json({
      success: true,
      data: suspects,
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

export const updateFollowup = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      lastFollowedUpOn,
      lastFollowupComment,
      nextFollowUpOn,
      nextFollowupComment
    } = req.body;

    const suspect = await Suspect.findById(id);
    if (!suspect) {
      return res.status(404).json({ message: "Suspect not found" });
    }

    let userDetails = null;
    if (req.user.role === "SUPER_ADMIN") {
      userDetails = await SuperAdmin.findById(req.user.id).select("name email");
    } else {
      userDetails = await User.findById(req.user.id).select("name email");
    }

    const updates = {};
    const historyEntry = {
      date: new Date(),
      performedBy: {
        userId: req.user.id,
        userName: userDetails?.name || req.user.name,
        userEmail: userDetails?.email || req.user.email,
        role: req.user.role
      }
    };
    if (lastFollowedUpOn) {
      updates.lastFollowedUpOn = lastFollowedUpOn;
      updates.lastFollowupComment = lastFollowupComment;

      suspect.followUpHistory.push({
        ...historyEntry,
        type: "Last Followup",
        comment: lastFollowupComment || "Followup performed"
      });
    }

    if (nextFollowUpOn) {
      updates.nextFollowUpOn = nextFollowUpOn;
      updates.nextFollowupComment = nextFollowupComment;

      const today = new Date();
      const nextDate = new Date(nextFollowUpOn);
      const diffDays = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));

      let status = "None";
      if (diffDays < 0) status = "Overdue";
      else if (diffDays === 0) status = "Today";
      else if (diffDays === 1) status = "1 Day";
      else if (diffDays === 2) status = "2 Days";

      updates.followupReminder = {
        status,
        notifiedAt: null
      };

      suspect.followUpHistory.push({
        ...historyEntry,
        type: "Next Followup",
        comment: nextFollowupComment || "Next followup scheduled"
      });
    }

    Object.assign(suspect, updates);
    await suspect.save();

    res.json({
      message: "Followup updated successfully",
      suspect
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getFollowupHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const suspect = await Suspect.findById(id).select("followUpHistory");

    if (!suspect) {
      return res.status(404).json({ message: "Suspect not found" });
    }

    res.json({
      history: suspect.followUpHistory || []
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};