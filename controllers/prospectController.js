import Prospect from "../models/Prospect.js";
import Company from "../models/Company.js";
import Suspect from "../models/Suspect.js";

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
      isActive: true,
      createdBy: req.user.id
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
      prospect.createdBy.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Access denied" });
    }
 
    res.json(prospect);
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
