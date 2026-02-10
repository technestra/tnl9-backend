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
    console.log("=== SEARCH SUSPECTS API CALLED ===");
    console.log("User:", req.user.id, req.user.role);
    console.log("Query params:", req.query);

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
          { suspectId: { $regex: search.trim(), $options: 'i' } },
          { "companySnapshot.companyName": { $regex: search.trim(), $options: 'i' } },
          { "contactSnapshots.name": { $regex: search.trim(), $options: 'i' } },
          { "contactSnapshots.email": { $regex: search.trim(), $options: 'i' } },
          { "contactSnapshots.phone": { $regex: search.trim(), $options: 'i' } }
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

    if (company) {
      query.company = company;
    }

    if (createdByUserId) {
      query["createdBy.userId"] = createdByUserId;
    }

    if (isActive !== undefined && isActive !== 'all') {
      query.isActive = isActive === 'true' || isActive === true;
    }

    if (status) {
      query.status = status;
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    console.log("Final Query:", JSON.stringify(query, null, 2));
    console.log("Skip:", skip, "Limit:", limitNum);

    const suspects = await Suspect.find(query)
      .populate("company", "companyName")
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    const total = await Suspect.countDocuments(query);

    console.log("Found suspects:", suspects.length, "Total:", total);

    res.json({
      success: true,
      data: suspects,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum
      }
    });
  } catch (error) {
    console.error("=== SEARCH SUSPECTS ERROR ===");
    console.error("Error Message:", error.message);
    console.error("Error Stack:", error.stack);

    res.status(500).json({
      success: false,
      message: error.message,
      details: error.toString()
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

export const softDeleteSuspect = async (req, res) => {
  try {
    const suspect = await Suspect.findById(req.params.id);

    if (!suspect) {
      return res.status(404).json({
        success: false,
        message: "Suspect not found"
      });
    }

    if (req.user.role !== "SUPER_ADMIN" &&
      suspect.createdBy.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "No permission to delete this Suspect"
      });
    }

    await suspect.softDelete(req.user.id);

    res.json({
      success: true,
      message: "Suspect moved to trash"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const restoreSuspect = async (req, res) => {
  try {
    if (req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Only Super Admin can restore Suspect"
      });
    }

    const suspect = await Suspect.findById(req.params.id);

    if (!suspect) {
      return res.status(404).json({
        success: false,
        message: "Suspect not found"
      });
    }

    await suspect.restore();

    res.json({
      success: true,
      message: "Suspect restored successfully",
      suspect
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getTrashSuspect = async (req, res) => {
  try {
    if (req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    const Suspects = await Suspect.findDeleted()
      .populate("deletedBy", "name email")
      .sort({ deletedAt: -1 });

    res.json({
      success: true,
      data: Suspects
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Permanent delete
export const permanentDeleteSuspect = async (req, res) => {
  try {
    if (req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Only Super Admin can permanently delete"
      });
    }

    const suspect = await Suspect.findById(req.params.id);

    if (!suspect) {
      return res.status(404).json({
        success: false,
        message: "Suspect not found"
      });
    }

    // Remove company from users' Suspects array
    await User.updateMany(
      { Suspects: suspect._id },
      { $pull: { Suspects: suspect._id } }
    );

    await suspect.deleteOne();

    res.json({
      success: true,
      message: "Suspect permanently deleted"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};