import Lead from "../models/Lead.js";
import Prospect from "../models/Prospect.js";

export const createLead = async (req, res) => {
  try {
    console.log("[CREATE LEAD] User:", {
      id: req.user?.id,
      role: req.user?.role,
      full: req.user
    });

    if (!req.user?.id) {
      return res.status(401).json({ message: "Authentication failed - user ID not found" });
    }

    const { prospectId } = req.body;

    let payload = {
      createdBy: req.user.id,
      engagementType: "IT_SERVICES",
      pipelineType: "IT Services",
      stage: "New",
      currentStatus: "Active",
      isActive: true
    };

    console.log("[CREATE LEAD] Base payload:", JSON.stringify(payload, null, 2));

    if (prospectId) {
      const prospect = await Prospect.findById(prospectId)
        .populate("company")
        .populate("suspect");

      if (!prospect) {
        return res.status(404).json({ message: "Prospect not found" });
      }

      if (
        req.user.role !== "SUPER_ADMIN" &&
        prospect.createdBy?.toString() !== req.user.id
      ) {
        return res.status(403).json({ message: "You can only convert your own prospects" });
      }

      if (prospect.status === "WON") {
        return res.status(400).json({ message: "Prospect already converted to lead" });
      }

      payload = {
        ...payload,
        prospect: prospect._id,
        company: prospect.company?._id,
        suspect: prospect.suspect?._id,

        leadName: `${prospect.companySnapshot?.companyName || "Unknown"} - ${prospect.requirement || "No requirement"}`,
        platform: prospect.prospectSource,

        companySnapshot: prospect.companySnapshot || {},
        contactSnapshot: prospect.contactSnapshot || {},

        requirement: prospect.requirement,
        budget: prospect.budget,
        timeline: prospect.timeline,
        prospectStatus: prospect.prospectStatus,
        comments: prospect.comments || [],

        convertedFromProspect: true
      };

      prospect.status = "WON";
      await prospect.save();

      console.log("[CREATE LEAD] Converted from prospect:", prospect._id);
    }
    else {
      payload = { ...payload, ...req.body };

      if (!["IT_SERVICES", "STAFF_AUGMENTATION"].includes(payload.engagementType)) {
        payload.engagementType = "IT_SERVICES";
      }
      if (!["IT Services", "Staff Augmentation"].includes(payload.pipelineType)) {
        payload.pipelineType = payload.engagementType === "IT_SERVICES" ? "IT Services" : "Staff Augmentation";
      }
    }

    if (!payload.leadName?.trim()) {
      return res.status(400).json({ message: "leadName is required" });
    }

    console.log("[CREATE LEAD] Final payload before save:", JSON.stringify(payload, null, 2));

    const lead = await Lead.create(payload);

    res.status(201).json({
      message: "Lead created successfully",
      lead
    });
  } catch (error) {
    console.error("[CREATE LEAD ERROR]:", error);
    res.status(500).json({
      message: "Server error while creating lead",
      error: error.message,
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