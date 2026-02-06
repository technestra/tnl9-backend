import Lead from "../models/Lead.js";
import Prospect from "../models/Prospect.js";
import Company from "../models/Company.js";
import Suspect from "../models/Suspect.js";
import User from "../models/User.js";
import SuperAdmin from "../models/SuperAdmin.js";

export const createLead = async (req, res) => {
  try {
    const {
      prospectId,
      company,
      engagementType,
      pipelineType,
      platform,
      leadName,
      requirement,
      budget,
      timeline,
      projectCategory,
      domain,
      technologyStack,
      scopeSummary,
      engagementModel,
      estimatedDuration,
      estimatedProjectValue,
      jobTitle,
      requiredSkills,
      experienceLevel,
      numberOfResources,
      billingRateRange,
      contractDuration,
      location,
      interviewRounds,
      comments,
      stage,
      currentStatus,
      forecastCategory,
      prospectStatus,
      lastFollowUp,
      nextFollowUp,
      followUpOwner,
      proposalStatus,
      proposalVersion,
      negotiationNotes,
      clientFeedback,
      contactSnapshots = [],
      contactPersonIds = []
    } = req.body;

    // Fetch user details
    let userDetails = null;
    if (req.user.role === "SUPER_ADMIN") {
      userDetails = await SuperAdmin.findById(req.user.id).select("name email");
    } else {
      userDetails = await User.findById(req.user.id).select("name email");
    }

    if (!userDetails) {
      return res.status(404).json({ message: "User not found" });
    }

    let payload = {

      createdBy: {
        userId: req.user.id,
        userName: userDetails.name,
        userEmail: userDetails.email,
        role: req.user.role
      },
      engagementType: engagementType || "IT_SERVICES",
      pipelineType: pipelineType || "IT Services",
      stage: stage || "New",
      currentStatus: currentStatus || "Active",
      forecastCategory: forecastCategory || "Pipeline",
      isActive: true
    };

    let prospectDoc = null;
    let companyDoc = null;

    if (prospectId) {
      prospectDoc = await Prospect.findById(prospectId)
        .populate("company")
        .populate("suspect");

      if (!prospectDoc) {
        return res.status(404).json({ message: "Prospect not found" });
      }
      if (
        req.user.role !== "SUPER_ADMIN" &&
        prospectDoc.createdBy?.toString() !== req.user.id
      ) {
        return res.status(403).json({ message: "You can only convert your own prospects" });
      }
      if (prospectDoc.status === "WON") {
        return res.status(400).json({ message: "Prospect already converted to lead" });
      }
      companyDoc = prospectDoc.company;

      payload = {
        ...payload,
        prospect: prospectDoc._id,
        company: companyDoc._id,
        suspect: prospectDoc.suspect?._id,
        leadName: leadName || `${companyDoc.companyName || "Unknown"} - ${prospectDoc.requirement || "No requirement"}`,
        companySnapshot: prospectDoc.companySnapshot || {},
        contactSnapshots: prospectDoc.contactSnapshots || [],
        contactPersonIds: prospectDoc.contactPersonIds || [],
        prospectStatus: prospectDoc.prospectStatus,
        prospectSource: prospectDoc.prospectSource,
        requirement: prospectDoc.requirement || requirement,
        budget: prospectDoc.budget || budget,
        timeline: prospectDoc.timeline || timeline,
        comments: prospectDoc.comments || (comments ? [{ text: comments }] : []),
        convertedFromProspect: true
      };

      prospectDoc.status = "WON";
      await prospectDoc.save();
    }
    else {
      if (!company) {
        return res.status(400).json({ message: "Company is required for direct lead creation" });
      }

      companyDoc = await Company.findById(company);
      if (!companyDoc) {
        return res.status(404).json({ message: "Company not found" });
      }

      payload = {
        ...payload,
        company: companyDoc._id,
        leadName: leadName || `${companyDoc.companyName || "Unknown"} - Lead`,

        companySnapshot: {
          companyName: companyDoc.companyName,
          companyAddress: companyDoc.companyAddress,
          companyLinkedIn: companyDoc.companyLinkedin,
          companyWebsite: companyDoc.companyWebsite,
          companyContact: companyDoc.coordinatorContactNumber,
          companyEmail: companyDoc.companyEmail
        },

        contactSnapshots,
        contactPersonIds,
        prospectStatus,
        prospectSource: platform || "Direct", // Map platform to prospectSource
        requirement,
        budget,
        timeline,
        comments: comments ? [{ text: comments }] : []
      };
    }
    payload = {
      ...payload,

      platform,
      projectCategory,
      domain,
      technologyStack,
      scopeSummary,
      engagementModel,
      estimatedDuration,
      estimatedProjectValue,
      jobTitle,
      requiredSkills,
      experienceLevel,
      numberOfResources,
      billingRateRange,
      contractDuration,
      location,
      interviewRounds,
      lastFollowUp,
      nextFollowUp,
      followUpOwner,
      proposalStatus,
      proposalVersion,
      negotiationNotes,
      clientFeedback
    };

    const enumFields = [
      "prospectStatus",
      "engagementModel",
      "proposalStatus",
      "experienceLevel",
      "location",
      "projectCategory"
    ];

    enumFields.forEach(field => {
      if (!payload[field] || payload[field] === "") {
        delete payload[field];
      }
    });

    if (!payload.leadName?.trim()) {
      return res.status(400).json({ message: "Lead name is required" });
    }
    const lead = await Lead.create(payload);
    res.status(201).json({
      message: "Lead created successfully",
      lead
    });
  } catch (error) {
    console.error("[CREATE LEAD ERROR]:", error);
    res.status(500).json({
      message: "Server error while creating lead",
      error: error.message
    });
  }
};




export const getLeads = async (req, res) => {
  try {
    const filter = {};

    if (req.user.role !== "SUPER_ADMIN") {
      filter.createdBy = req.user.id;
    }
    const leads = await Lead.find(filter)
      .populate("company", "companyName")
      .populate("suspect", "userName email")
      .sort({ createdAt: -1 });

    res.json(leads);
  } catch (error) {
    console.error("[GET LEADS ERROR]:", error);
    res.status(500).json({ message: error.message });
  }
};
export const getLeadById = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate("company", "companyName")
      .populate("suspect", "userName email");

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }
    if (req.user.role !== "SUPER_ADMIN" && lead.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }
    res.json(lead);
  } catch (error) {
    console.error("[GET LEAD BY ID ERROR]:", error);
    res.status(500).json({ message: error.message });
  }
};

export const updateLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }
    const userId = req.user?.id?.toString();
    const leadOwnerId = lead.createdBy?.toString();

    if (req.user.role !== "SUPER_ADMIN" && userId !== leadOwnerId) {
      return res.status(403).json({ message: "You can only edit your own leads" });
    }
    console.log("[UPDATE LEAD] Updating fields:", Object.keys(req.body));

    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined && req.body[key] !== null) {
        lead[key] = req.body[key];
      }
    });
    await lead.save();

    res.json({
      message: "Lead updated successfully",
      lead
    });
  } catch (error) {
    console.error("[UPDATE LEAD ERROR]:", error);
    res.status(500).json({
      message: "Error updating lead",
      error: error.message
    });
  }
};

export const deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }
    const userId = req.user?.id?.toString();
    const leadOwnerId = lead.createdBy?.toString();

    if (req.user.role !== "SUPER_ADMIN" && userId !== leadOwnerId) {
      return res.status(403).json({ message: "No permission" });
    }
    await lead.deleteOne();

    res.json({ message: "Lead deleted successfully" });
  } catch (error) {
    console.error("[DELETE LEAD ERROR]:", error);
    res.status(500).json({ message: error.message });
  }
};

export const updateLeadStage = async (req, res) => {
  try {
    const { stage } = req.body;
    const allowedStages = ["New", "Qualified", "Proposal", "Negotiation", "Won", "Lost"];
    if (!allowedStages.includes(stage)) {
      return res.status(400).json({ message: "Invalid stage" });
    }
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }
    const userId = req.user?.id?.toString();
    const leadOwnerId = lead.createdBy?.toString();

    if (req.user.role !== "SUPER_ADMIN" && userId !== leadOwnerId) {
      return res.status(403).json({ message: "Access denied" });
    }
    if (["Won", "Lost"].includes(lead.stage)) {
      return res.status(400).json({ message: "Deal already closed" });
    }
    lead.stage = stage;
    await lead.save();
    res.json({ message: "Stage updated successfully", lead });
  } catch (error) {
    console.error("[UPDATE STAGE ERROR]:", error);
    res.status(500).json({ message: error.message });
  }
};

export const toggleLeadActive = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    if (req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ message: "Only Super Admin allowed" });
    }

    lead.isActive = !lead.isActive;
    await lead.save();

    res.json({
      message: `Lead ${lead.isActive ? "Activated" : "Deactivated"}`,
      isActive: lead.isActive
    });
  } catch (error) {
    console.error("[TOGGLE ACTIVE ERROR]:", error);
    res.status(500).json({ message: error.message });
  }
};



// leadsController.js me yeh function add karein
export const searchLeads = async (req, res) => {
  try {
    const {
      search,
      company,
      createdByUserId,
      isActive,
      stage,
      engagementType,
      pipelineType,
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
        { leadId: { $regex: search, $options: 'i' } },
        { leadName: { $regex: search, $options: 'i' } },
        { "companySnapshot.companyName": { $regex: search, $options: 'i' } },
        { "contactSnapshots.name": { $regex: search, $options: 'i' } },
        { "contactSnapshots.email": { $regex: search, $options: 'i' } },
        { "contactSnapshots.phone": { $regex: search, $options: 'i' } },
        { requirement: { $regex: search, $options: 'i' } },
        { domain: { $regex: search, $options: 'i' } },
        { jobTitle: { $regex: search, $options: 'i' } }
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

    if (stage) {
      query.stage = stage;
    }

    if (engagementType) {
      query.engagementType = engagementType;
    }

    if (pipelineType) {
      query.pipelineType = pipelineType;
    }

    const skip = (page - 1) * limit;

    const leads = await Lead.find(query)
      .populate("company", "companyName")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Lead.countDocuments(query);

    res.json({
      success: true,
      data: leads,
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


// Add these functions to leadController.js

// Update followup for lead
export const updateFollowup = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      lastFollowUp, 
      lastFollowupComment,
      nextFollowUp, 
      nextFollowupComment 
    } = req.body;

    const lead = await Lead.findById(id);
    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    // Get user details
    let userDetails = null;
    if (req.user.role === "SUPER_ADMIN") {
      userDetails = await SuperAdmin.findById(req.user.id).select("name email");
    } else {
      userDetails = await User.findById(req.user.id).select("name email");
    }

    // Prepare updates
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

    // Update last followup
    if (lastFollowUp) {
      updates.lastFollowUp = lastFollowUp;
      updates.lastFollowupComment = lastFollowupComment;
      
      lead.followUpHistory.push({
        ...historyEntry,
        type: "Last Followup",
        comment: lastFollowupComment || "Followup performed"
      });
    }

    // Update next followup
    if (nextFollowUp) {
      updates.nextFollowUp = nextFollowUp;
      updates.nextFollowupComment = nextFollowupComment;
      
      // Calculate reminder status
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
      
      lead.followUpHistory.push({
        ...historyEntry,
        type: "Next Followup",
        comment: nextFollowupComment || "Next followup scheduled"
      });
    }

    // Apply updates
    Object.assign(lead, updates);
    await lead.save();

    res.json({
      message: "Followup updated successfully",
      lead
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get followup history for lead
export const getFollowupHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const lead = await Lead.findById(id).select("followUpHistory");
    
    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    res.json({
      history: lead.followUpHistory || []
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};