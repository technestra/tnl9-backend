import Lead from "../models/Lead.js";
import Prospect from "../models/Prospect.js";
import Company from "../models/Company.js";
import Suspect from "../models/Suspect.js";
import User from "../models/User.js";
import SuperAdmin from "../models/SuperAdmin.js";

export const createLead = async (req, res) => {
  try {
    const {
      prospect,
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
      proposalStatus,
      proposalVersion,
      negotiationNotes,
      clientFeedback,
      contactSnapshots = [],
      contactPersonIds = []
    } = req.body;
    console.log("[CREATE LEAD REQUEST BODY]:", req.body);
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

    if (prospect) {
      console.log("[CONVERTING FROM PROSPECT] ID:", prospect);

      prospectDoc = await Prospect.findById(prospect)
        .populate("company")
        .populate("suspect");

      console.log("[PROSPECT DOCUMENT]:", prospectDoc);

      if (!prospectDoc) {
        return res.status(404).json({ message: "Prospect not found" });
      }

      if (
        req.user.role !== "SUPER_ADMIN" &&
        prospectDoc.createdBy?.userId?.toString() !== req.user.id
      ) {
        return res.status(403).json({ message: "You can only convert your own prospects" });
      }

      if (prospectDoc.status === "WON") {
        return res.status(400).json({ message: "Prospect already converted to lead" });
      }

      companyDoc = prospectDoc.company;

      if (!companyDoc) {
        return res.status(400).json({ message: "Prospect does not have a company" });
      }
      payload = {
        ...payload,
        prospect: prospectDoc._id,
        company: companyDoc._id,
        suspect: prospectDoc.suspect?._id,
        leadName: leadName || `${companyDoc.companyName || "Unknown"} - ${prospectDoc.requirement || "Lead"}`,
        companySnapshot: {
          companyName: companyDoc.companyName || "",
          companyAddress: companyDoc.companyAddress || "",
          companyLinkedIn: companyDoc.companyLinkedin || "",
          companyWebsite: companyDoc.companyWebsite || "",
          companyContact: companyDoc.coordinatorContactNumber || "",
          companyEmail: companyDoc.companyEmail || ""
        },
        contactSnapshots: prospectDoc.contactSnapshots || [],
        contactPersonIds: prospectDoc.contactPersonIds || [],
        prospectStatus: prospectDoc.prospectStatus,
        prospectSource: prospectDoc.prospectSource,
        requirement: prospectDoc.requirement || requirement,
        budget: prospectDoc.budget || budget,
        timeline: prospectDoc.timeline || timeline,
        comments: prospectDoc.comments ? [{ text: prospectDoc.comments.text }] : (comments ? [{ text: comments }] : []),
        convertedFromProspect: true
      };
      prospectDoc.status = "WON";
      await prospectDoc.save();

      console.log("[PROSPECT CONVERTED TO WON]");
    } else {
      console.log("[DIRECT LEAD CREATION]");
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
        prospectSource: platform || "Direct",
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
      lastFollowup: lastFollowUp,
      nextFollowUp: nextFollowUp,
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
    console.log("[FINAL LEAD PAYLOAD]:", payload);
    const lead = await Lead.create(payload);

    res.status(201).json({
      success: true,
      message: "Lead created successfully",
      lead
    });
  } catch (error) {
    console.error("[CREATE LEAD ERROR]:", error);
    res.status(500).json({
      success: false,
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
    console.log("=== UPDATE LEAD DEBUG ===");
    console.log("Lead ID to update:", req.params.id);
    console.log("Request body keys:", Object.keys(req.body));
    console.log("Full request body:", JSON.stringify(req.body, null, 2));

    const requiredFields = ['leadName', 'engagementType', 'pipelineType', 'company'];
    const missingFields = [];

    requiredFields.forEach(field => {
      if (!req.body[field]) {
        missingFields.push(field);
      }
    });

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found"
      });
    }
    console.log("Found lead:", lead.leadId, lead.leadName);
    const updateData = { ...req.body };
    delete updateData._id;
    delete updateData.leadId;
    delete updateData.createdBy;
    delete updateData.convertedFromProspect;
    if (updateData.lastFollowUp !== undefined) {
      updateData.lastFollowup = updateData.lastFollowUp || null;
      delete updateData.lastFollowUp;
    }

    if (updateData.nextFollowUp !== undefined) {
      updateData.nextFollowUp = updateData.nextFollowUp || null;
    }
    if (updateData.comments && typeof updateData.comments === 'string') {
      if (updateData.comments.trim()) {
        updateData.comments = [{ text: updateData.comments, createdAt: new Date() }];
      } else {
        delete updateData.comments;
      }
    }
    console.log("Update data after processing:", updateData);
    const updatedLead = await Lead.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
        context: 'query'
      }
    );

    if (!updatedLead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found after update"
      });
    }
    console.log("Update successful!");
    res.json({
      success: true,
      message: "Lead updated successfully",
      lead: updatedLead
    });

  } catch (error) {
    console.error("=== UPDATE ERROR DETAILS ===");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);

    if (error.name === 'ValidationError') {
      const errors = {};
      Object.keys(error.errors).forEach(key => {
        errors[key] = error.errors[key].message;
      });

      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errors
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: `Invalid value for field ${error.path}: ${error.value}`
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
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

export const searchLeads = async (req, res) => {
  try {
    console.log("=== SEARCH LEADS API CALLED ===");
    console.log("User:", req.user.id, req.user.role);
    console.log("Query params:", req.query);

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
    if (req.user.role !== "SUPER_ADMIN") {
      query["createdBy.userId"] = req.user.id;
    }
    if (search && search.trim()) {
      const searchQuery = {
        $or: [
          { leadId: { $regex: search.trim(), $options: 'i' } },
          { leadName: { $regex: search.trim(), $options: 'i' } },
          { "companySnapshot.companyName": { $regex: search.trim(), $options: 'i' } },
          { requirement: { $regex: search.trim(), $options: 'i' } },
          { domain: { $regex: search.trim(), $options: 'i' } },
          { jobTitle: { $regex: search.trim(), $options: 'i' } }
        ]
      };
      if (mongoose.model('Lead').schema.path('contactSnapshots')) {
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
    if (stage) {
      query.stage = stage;
    }
    if (engagementType) {
      query.engagementType = engagementType;
    }
    if (pipelineType) {
      query.pipelineType = pipelineType;
    }
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    console.log("Final Query:", JSON.stringify(query, null, 2));
    console.log("Skip:", skip, "Limit:", limitNum);

    const leads = await Lead.find(query)
      .populate("company", "companyName")
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    const total = await Lead.countDocuments(query);

    console.log("Found leads:", leads.length, "Total:", total);

    res.json({
      success: true,
      data: leads,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum
      }
    });
  } catch (error) {
    console.error("=== SEARCH LEADS ERROR ===");
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

    const lead = await Lead.findById(id);
    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
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

      lead.followUpHistory.push({
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

      lead.followUpHistory.push({
        ...historyEntry,
        type: "Next Followup",
        comment: nextFollowupComment || "Next followup scheduled"
      });
    }

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

export const softDeleteLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found"
      });
    }
    if (req.user.role !== "SUPER_ADMIN" &&
      lead.createdBy.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "No permission to delete this company"
      });
    }
    await lead.softDelete(req.user.id);

    res.json({
      success: true,
      message: "Lead moved to trash"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const restoreLead = async (req, res) => {
  try {
    if (req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Only Super Admin can restore Lead"
      });
    }

    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found"
      });
    }

    await lead.restore();

    res.json({
      success: true,
      message: "Lead restored successfully",
      lead
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getTrashLead = async (req, res) => {
  try {
    if (req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    const leads = await Lead.findDeleted()
      .populate("deletedBy", "name email")
      .sort({ deletedAt: -1 });

    res.json({
      success: true,
      data: lead
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const permanentDeleteLead = async (req, res) => {
  try {
    if (req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Only Super Admin can permanently delete"
      });
    }

    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found"
      });
    }

    await User.updateMany(
      { leads: lead._id },
      { $pull: { leads: lead._id } }
    );

    await lead.deleteOne();

    res.json({
      success: true,
      message: "Lead permanently deleted"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};