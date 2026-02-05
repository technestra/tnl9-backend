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

    // Database se user details fetch karein
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

    // ... rest of your existing code ...

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
      // ... other fields ...
      createdBy: {  // UPDATE THIS PART
        userId: req.user.id,
        userName: userDetails.name,     // Database se name
        userEmail: userDetails.email,   // Database se email
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

    // ... rest of your code ...
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

    // Permission check update karein
    if (
      req.user.role !== "SUPER_ADMIN" &&
      prospect.createdBy.userId.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Agar needed ho toh user details fetch karein
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

    // Response me createdByUser add karein
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

export const deleteProspect = async (req, res) => {
  try {
    const prospect = await Prospect.findById(req.params.id);

    if (!prospect) {
      return res.status(404).json({ message: "Prospect not found" });
    }

    if (prospect.status === "WON") {
      return res
        .status(400)
        .json({ message: "Won prospect cannot be deleted" });
    }

    await prospect.deleteOne();

    res.json({ message: "Prospect deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



// prospectController.js me yeh function add karein
export const searchProspects = async (req, res) => {
  try {
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

    // Permission check
    if (req.user.role !== "SUPER_ADMIN") {
      query["createdBy.userId"] = req.user.id;
    }

    // Search filter
    if (search) {
      query.$or = [
        { prospectId: { $regex: search, $options: 'i' } },
        { "companySnapshot.companyName": { $regex: search, $options: 'i' } },
        { "suspectSnapshot.suspectName": { $regex: search, $options: 'i' } },
        { "contactSnapshots.name": { $regex: search, $options: 'i' } },
        { "contactSnapshots.email": { $regex: search, $options: 'i' } },
        { "contactSnapshots.phone": { $regex: search, $options: 'i' } },
        { requirement: { $regex: search, $options: 'i' } }
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

    if (prospectStatus) {
      query.prospectStatus = prospectStatus;
    }

    if (prospectSource) {
      query.prospectSource = prospectSource;
    }

    const skip = (page - 1) * limit;

    const prospects = await Prospect.find(query)
      .populate("company", "companyName")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Prospect.countDocuments(query);

    res.json({
      success: true,
      data: prospects,
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