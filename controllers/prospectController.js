import Prospect from "../models/Prospect.js";
import Company from "../models/Company.js";
import Suspect from "../models/Suspect.js";
import User from "../models/User.js";
import SuperAdmin from "../models/SuperAdmin.js";

export const createProspect = async (req, res) => {
  try {
    const {
      company,
      suspect,
      prospectStatus,
      prospectSource,
      decisionMaker,
      requirement,
      budget,
      timeline,
      comments,
      contactedDate,
      lastFollowUp,
      nextFollowUp,
      followUpOwner,
      contactSnapshots = [],
      contactPersonIds = []
    } = req.body;

    let userDetails = null;
    if (req.user.role === "SUPER_ADMIN") {
      userDetails = await SuperAdmin.findById(req.user.id).select("name email");
    } else {
      userDetails = await User.findById(req.user.id).select("name email");
    }

    if (!userDetails) {
      return res.status(404).json({ message: "User not found" });
    }

    let companyDoc = null;
    let suspectDoc = null;
    let autoContactSnapshots = [];
    let autoContactPersonIds = [];
    let autoSuspectSnapshot = null;

    if (suspect) {
      suspectDoc = await Suspect.findById(suspect).populate("company");
      if (!suspectDoc) {
        return res.status(404).json({ message: "Suspect not found" });
      }

      companyDoc = suspectDoc.company;

      autoContactSnapshots = suspectDoc.contactSnapshots || [];
      autoContactPersonIds = suspectDoc.contactPersonIds || [];
      autoSuspectSnapshot = {
        suspectName: suspectDoc.contactSnapshot?.contactName || "Unknown",
        suspectEmail: suspectDoc.contactSnapshot?.contactEmail || "",
        suspectContact: suspectDoc.contactSnapshot?.contactPhone || ""
      };
    } else {
      if (!company) {
        return res.status(400).json({ message: "Company is required for direct creation" });
      }
      companyDoc = await Company.findById(company);
      if (!companyDoc) {
        return res.status(404).json({ message: "Company not found" });
      }
    }

    if (!companyDoc) {
      return res.status(400).json({ message: "Company not found" });
    }

    const year = new Date().getFullYear();
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    const prospectId = `P-${year}-${random}`;

    const prospectData = {
      prospectId,
      company: companyDoc._id,
      suspect: suspectDoc?._id || null,

      companySnapshot: {
        companyName: companyDoc.companyName,
        companyLinkedIn: companyDoc.companyLinkedin,
        companyWebsite: companyDoc.companyWebsite,
        companyLocation: companyDoc.companyAddress,
        companyEmail: companyDoc.companyEmail,
        companyContact: companyDoc.coordinatorContactNumber
      },
      suspectSnapshot: autoSuspectSnapshot || null,
      contactSnapshots: suspectDoc ? autoContactSnapshots : contactSnapshots,
      contactPersonIds: suspectDoc ? autoContactPersonIds : contactPersonIds,
      prospectStatus: prospectStatus || "Interested",
      prospectSource: prospectSource || (suspectDoc ? suspectDoc.suspectSource : "Direct"),
      decisionMaker: decisionMaker || false,
      requirement: requirement || (suspectDoc ? suspectDoc.remarks : ""),
      budget: budget || (suspectDoc ? suspectDoc.budget : ""),
      timeline: timeline || "",
      comments: comments || (suspectDoc ? [{ text: suspectDoc.remarks || "" }] : []),
      contactedDate,
      lastFollowUp,
      nextFollowUp,
      followUpOwner,
      status: "OPEN",
      createdBy: {
        userId: req.user.id,
        userName: userDetails.name,
        userEmail: userDetails.email,
        role: req.user.role
      },
      isActive: true,
    };

    const prospect = await Prospect.create(prospectData);
    if (suspectDoc) {
      suspectDoc.status = "Converted";
      suspectDoc.isConverted = true;
      await suspectDoc.save();
    }

    res.status(201).json({
      message: "Prospect created successfully",
      prospect
    });

  } catch (err) {
    console.error("Create Prospect Error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const getProspects = async (req, res) => {
  try {
    const filter = {
      isActive: true,
      status: { $ne: "WON" }
    };

    if (req.user.role !== "SUPER_ADMIN") {
      filter.createdBy = req.user.id;
    }

    if (req.query.company) {
      filter.company = req.query.company;
    }

    const prospects = await Prospect.find(filter)
      .sort({ createdAt: -1 });

    res.json(prospects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getProspectById = async (req, res) => {
  try {
    const prospect = await Prospect.findById(req.params.id);

    if (!prospect) {
      return res.status(404).json({ message: "Prospect not found" });
    }

    if (
      req.user.role !== "SUPER_ADMIN" &&
      prospect.createdBy.userId.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    let createdByUser = null;
    if (prospect.createdBy?.userId) {
      if (prospect.createdBy.role === "SUPER_ADMIN") {
        createdByUser = await SuperAdmin.findById(prospect.createdBy.userId)
          .select("name email");
      } else {
        createdByUser = await User.findById(prospect.createdBy.userId)
          .select("name email");
      }
    }

    const response = {
      ...prospect.toObject(),
      createdByUser: createdByUser || {
        name: prospect.createdBy?.userName || "Unknown",
        email: prospect.createdBy?.userEmail || "N/A"
      }
    };

    res.json(response);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateProspect = async (req, res) => {
  try {
    const prospect = await Prospect.findById(req.params.id);

    if (!prospect) {
      return res.status(404).json({ message: "Prospect not found" });
    }

    if (prospect.status === "WON") {
      return res
        .status(400)
        .json({ message: "Won prospect cannot be edited" });
    }

    if (
      req.user.role !== "SUPER_ADMIN" &&
      prospect.createdBy.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    const allowedFields = [
      "prospectStatus",
      "prospectSource",
      "decisionMaker",
      "requirement",
      "budget",
      "timeline",
      "comments",
      "contactedDate",
      "lastFollowUp",
      "nextFollowUp",
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        prospect[field] = req.body[field];
      }
    });

    await prospect.save();

    res.json({
      message: "Prospect updated successfully",
      prospect
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const convertProspectToWon = async (req, res) => {
  try {
    const prospect = await Prospect.findById(req.params.id);

    if (!prospect) {
      return res.status(404).json({ message: "Prospect not found" });
    }

    prospect.status = "WON";
    prospect.isActive = false;

    await prospect.save();

    res.json({
      message: "Prospect converted to WON",
      prospect
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const toggleProspectActive = async (req, res) => {
  try {
    const prospect = await Prospect.findById(req.params.id);

    if (!prospect) {
      return res.status(404).json({ message: "Prospect not found" });
    }
    if (req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ message: "Only Super Admin allowed" });
    }

    prospect.isActive = !prospect.isActive;
    await prospect.save();

    res.json({
      message: `Prospect ${prospect.isActive ? "activated" : "deactivated"}`,
      isActive: prospect.isActive
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// export const deleteProspect = async (req, res) => {
//   try {
//     const prospect = await Prospect.findById(req.params.id);

//     if (!prospect) {
//       return res.status(404).json({ message: "Prospect not found" });
//     }

//     if (prospect.status === "WON") {
//       return res
//         .status(400)
//         .json({ message: "Won prospect cannot be deleted" });
//     }

//     await prospect.deleteOne();

//     res.json({ message: "Prospect deleted successfully" });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

export const searchProspects = async (req, res) => {
  try {
    console.log("=== SEARCH PROSPECTS API CALLED ===");
    console.log("User:", req.user.id, req.user.role);
    console.log("Query params:", req.query);

    const {
      search,
      company,
      createdByUserId,
      isActive,
      prospectStatus,
      prospectSource,
      page = 1,
      limit = 10
    } = req.query;

    let query = {};

    if (req.user.role !== "SUPER_ADMIN") {
      query["createdBy.userId"] = req.user.id;
    }

    if (search && search.trim()) {
      const searchQuery = {
        $or: [
          { prospectId: { $regex: search.trim(), $options: 'i' } },
          { "companySnapshot.companyName": { $regex: search.trim(), $options: 'i' } },
          { "suspectSnapshot.suspectName": { $regex: search.trim(), $options: 'i' } },
          { requirement: { $regex: search.trim(), $options: 'i' } }
        ]
      };
      if (mongoose.model('Prospect').schema.path('contactSnapshots')) {
        searchQuery.$or.push(
          { "contactSnapshots.name": { $regex: search.trim(), $options: 'i' } },
          { "contactSnapshots.email": { $regex: search.trim(), $options: 'i' } },
          { "contactSnapshots.phone": { $regex: search.trim(), $options: 'i' } }
        );
      }

      if (Object.keys(query).length > 0) {
        query = { $and: [query, searchQuery] };
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

    if (prospectStatus) {
      query.prospectStatus = prospectStatus;
    }

    if (prospectSource) {
      query.prospectSource = prospectSource;
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    console.log("Final Query:", JSON.stringify(query, null, 2));
    console.log("Skip:", skip, "Limit:", limitNum);
    const prospects = await Prospect.find(query)
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });
    const total = await Prospect.countDocuments(query);
    console.log("Found prospects:", prospects.length, "Total:", total);
    res.json({
      success: true,
      data: prospects,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum
      }
    });
  } catch (error) {
    console.error("=== SEARCH PROSPECTS ERROR ===");
    console.error("Error Message:", error.message);
    console.error("Error Stack:", error.stack);

    res.status(500).json({
      success: false,
      message: error.message || "Internal server error"
    });
  }
};

export const updateFollowup = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      lastFollowUp,
      lastFollowupComment,
      nextFollowUp,
      nextFollowupComment
    } = req.body;

    const prospect = await Prospect.findById(id);
    if (!prospect) {
      return res.status(404).json({ message: "Prospect not found" });
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

    if (lastFollowUp) {
      updates.lastFollowUp = lastFollowUp;
      updates.lastFollowupComment = lastFollowupComment;

      prospect.followUpHistory.push({
        ...historyEntry,
        type: "Last Followup",
        comment: lastFollowupComment || "Followup performed"
      });
    }

    if (nextFollowUp) {
      updates.nextFollowUp = nextFollowUp;
      updates.nextFollowupComment = nextFollowupComment;

      const today = new Date();
      const nextDate = new Date(nextFollowUp);
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

      prospect.followUpHistory.push({
        ...historyEntry,
        type: "Next Followup",
        comment: nextFollowupComment || "Next followup scheduled"
      });
    }

    Object.assign(prospect, updates);
    await prospect.save();

    res.json({
      message: "Followup updated successfully",
      prospect
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getFollowupHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const prospect = await Prospect.findById(id).select("followUpHistory");

    if (!prospect) {
      return res.status(404).json({ message: "Prospect not found" });
    }

    res.json({
      history: prospect.followUpHistory || []
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// export const softDeleteProspect = async (req, res) => {
//   try {
//     const prospect = await Prospect.findById(req.params.id);

//     if (!prospect) {
//       return res.status(404).json({ message: "Prospect not found" });
//     }

//     if (req.user.role !== "SUPER_ADMIN") {
//       return res.status(403).json({ message: "Only Super Admin allowed" });
//     }

//     await prospect.softDelete({
//       userId: req.user.id,
//       role: req.user.role
//     });

//     res.json({ message: "Prospect moved to trash" });
//   } catch (err) {
//     console.error("Soft delete prospect error:", err);
//     res.status(500).json({ message: err.message });
//   }
// };

export const softDeleteProspect = async (req, res) => {
  try {
    const prospect = await Prospect.findById(req.params.id);
    if (!prospect) {
      return res.status(404).json({ message: "Suspect not found" });
    }

    const isCreator =
      prospect.createdBy.userId.toString() === req.user.id;
    const isSuperAdmin = req.user.role === "SUPER_ADMIN";

    if (!isCreator && !isSuperAdmin) {
      return res.status(403).json({ message: "No permission" });
    }

    if (prospect.isDeleted) {
      return res.status(400).json({ message: "Suspect already in trash" });
    }

    prospect.isDeleted = true;
    prospect.deletedAt = new Date();
    prospect.deletedBy = req.user.id;

    await prospect.save();

    res.json({
      success: true,
      message: "Suspect moved to trash"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTrashProspects = async (req, res) => {
  try {
    if (req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ message: "Only Super Admin allowed" });
    }

    const prospects = await Prospect.findDeleted()
      .sort({ deletedAt: -1 });

    res.json(prospects);
  } catch (err) {
    console.error("Get trash prospects error:", err);
    res.status(500).json({ message: err.message });
  }
};

// export const restoreProspect = async (req, res) => {
//   try {
//     if (req.user.role !== "SUPER_ADMIN") {
//       return res.status(403).json({ message: "Only Super Admin allowed" });
//     }

//     const prospect = await Prospect.restore({ _id: req.params.id });

//     if (!prospect) {
//       return res.status(404).json({ message: "Prospect not found in trash" });
//     }

//     res.json({ message: "Prospect restored successfully" });
//   } catch (err) {
//     console.error("Restore prospect error:", err);
//     res.status(500).json({ message: err.message });
//   }
// };
export const restoreProspect = async (req, res) => {
  try {
    const prospect = await Prospect.findOneDeleted({ _id: req.params.id });
    if (!prospect) {
      return res.status(404).json({ message: "Suspect not found in trash" });
    }

    await prospect.restore();

    res.json({
      success: true,
      message: "prospect restored successfully"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



export const permanentDeleteProspect = async (req, res) => {
  try {
    if (req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ message: "Only Super Admin allowed" });
    }

    const prospect = await Prospect.findOneDeleted({ _id: req.params.id });

    if (!prospect) {
      return res.status(404).json({ message: "Prospect not found in trash" });
    }

    await prospect.deleteOne({ force: true });

    res.json({ message: "Prospect permanently deleted" });
  } catch (err) {
    console.error("Permanent delete prospect error:", err);
    res.status(500).json({ message: err.message });
  }
};


export const emptyProspectTrash = async (req, res) => {
  try {
    if (req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ message: "Only Super Admin allowed" });
    }

    await Prospect.deleteMany(
      { isDeleted: true },
      { force: true }
    );

    res.json({ message: "Prospect trash emptied" });
  } catch (err) {
    console.error("Empty prospect trash error:", err);
    res.status(500).json({ message: err.message });
  }
};

