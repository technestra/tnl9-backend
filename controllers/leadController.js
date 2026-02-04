import Lead from "../models/Lead.js";
import Prospect from "../models/Prospect.js";
import Company from "../models/Company.js";
import Suspect from "../models/Suspect.js";

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

    let payload = {
      createdBy: req.user.id,
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