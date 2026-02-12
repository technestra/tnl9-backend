// controllers/leadController.js (add this function)
import Onboarding from "../models/Onboarding.js";
import Lead from "../models/Lead.js";
import { notifyLeadStakeholders } from "../utils/notificationHelper.js";

// export const convertToWon = async (req, res) => {
//   try {
//     const lead = await Lead.findById(req.params.id);
//     if (!lead) {
//       return res.status(404).json({ success: false, message: "Lead not found" });
//     }

//     // Prevent re‑conversion if already Won
//     if (lead.stage === "Won") {
//       return res.status(400).json({
//         success: false,
//         message: "Lead is already in Won stage",
//       });
//     }

//     // Update stage to Won
//     lead.stage = "Won";
//     await lead.save();
//     await onboarding.save();

//      await notifyLeadStakeholders({
//     leadId: lead._id,
//     type: "LEAD_WON",
//     title: "Lead Converted to Won",
//     message: `Lead "${lead.leadName}" has been marked as Won and is ready for onboarding.`,
//     data: { onboardingId: onboarding._id },
//   });

//     // Create onboarding record (if not already exists)
//     let onboarding = await Onboarding.findOne({ lead: lead._id });
//     if (!onboarding) {
//       onboarding = new Onboarding({
//         lead: lead._id,
//         engagementType: lead.engagementType,
//         status: "pending",
//       });
//       await onboarding.save();
//     }

//     res.status(200).json({
//       success: true,
//       message: "Lead converted to Won and onboarding created",
//       lead,
//       onboarding,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };
export const convertToWon = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead not found" });
    }

    // Prevent re‑conversion if already Won
    if (lead.stage === "Won") {
      return res.status(400).json({
        success: false,
        message: "Lead is already in Won stage",
      });
    }

    // 1️⃣ सबसे पहले Onboarding record बनाएँ (या ढूँढें)
    let onboarding = await Onboarding.findOne({ lead: lead._id });
    if (!onboarding) {
      onboarding = new Onboarding({
        lead: lead._id,
        engagementType: lead.engagementType,
        status: "pending",
      });
      await onboarding.save();
    }

    // 2️⃣ Lead को Won करें
    lead.stage = "Won";
    await lead.save();

    // 3️⃣ Notification भेजें (अब onboarding._id मौजूद है)
    await notifyLeadStakeholders({
      leadId: lead._id,
      type: "LEAD_WON",
      title: "Lead Converted to Won",
      message: `Lead "${lead.leadName}" has been marked as Won and is ready for onboarding.`,
      data: { onboardingId: onboarding._id },
    });

    res.status(200).json({
      success: true,
      message: "Lead converted to Won and onboarding created",
      lead,
      onboarding,
    });
  } catch (error) {
    console.error("Convert to Won Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


// controllers/onboardingController.js (or add to leadController)
export const getOnboarding = async (req, res) => {
  try {
    const onboarding = await Onboarding.findOne({ lead: req.params.id })
      .populate("vendor", "name email"); // adjust populate as needed

    if (!onboarding) {
      return res.status(404).json({
        success: false,
        message: "Onboarding record not found for this lead",
      });
    }

    res.status(200).json({ success: true, onboarding });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateOnboarding = async (req, res) => {
  try {
    const onboarding = await Onboarding.findOne({ lead: req.params.id });
    if (!onboarding) {
      return res.status(404).json({
        success: false,
        message: "Onboarding record not found",
      });
    }

    // Allowed fields to update
    const allowedFields = [
      "status",
      "startDate",
      "endDate",
      "amountFinalised",
      "gstIncluded",
      "tdsApplied",
      "bankDetails",
      // Staff Augmentation
      "staffing",
      "engagementMonth",
      "vendor",
      "resourceName",
      // IT Services – add your confirmed fields here
      "projectScope",
      "deliverables",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        onboarding[field] = req.body[field];
      }
    });

    // Auto‑complete: if all required fields for the engagementType are filled, set status to completed
    // (Define your own “required” fields per type – this is just an example)
    if (onboarding.engagementType === "STAFF_AUGMENTATION") {
      const required = [
        "staffing",
        "engagementMonth",
        "startDate",
        "endDate",
        "amountFinalised",
        "vendor",
        "resourceName",
        "bankDetails",
      ];
      const allFilled = required.every((field) => onboarding[field] != null && onboarding[field] !== "");
      if (allFilled) onboarding.status = "completed";
    } else if (onboarding.engagementType === "IT_SERVICES") {
      // adjust required fields after your confirmation
      const required = [
        "projectScope",
        "deliverables",
        "startDate",
        "endDate",
        "amountFinalised",
      ];
      const allFilled = required.every((field) => onboarding[field] != null && onboarding[field] !== "");
      if (allFilled) onboarding.status = "completed";
    }

     const wasCompleted = onboarding.status === "completed";

    await onboarding.save();

    if (!wasCompleted && onboarding.status === "completed") {
    await notifyLeadStakeholders({
      leadId: onboarding.lead,
      type: "ONBOARDING_COMPLETED",
      title: "Onboarding Completed",
      message: `Onboarding for lead "${lead.leadName}" has been completed.`,
      data: { onboardingId: onboarding._id },
    });
  }
    
    res.status(200).json({ success: true, onboarding });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const cloneLead = async (req, res) => {
  try {
    const originalLead = await Lead.findById(req.params.id).lean();
    if (!originalLead) {
      return res.status(404).json({ success: false, message: "Lead not found" });
    }

    // Exclude fields that must not be copied
    const {
      _id,
      leadId,
      stage,
      isDeleted,
      deletedAt,
      deletedBy,
      createdAt,
      updatedAt,
      convertedFromProspect,
      followUpHistory,
      comments,
      // also exclude onboarding (if embedded, but we use separate model)
      ...rest
    } = originalLead;

    // Set fresh values
    const clonedLeadData = {
      ...rest,
      stage: "New",                // reset stage
      isActive: true,
      convertedFromProspect: false,
      createdBy: {
        userId: req.user._id,
        userName: req.user.name,
        userEmail: req.user.email,
        role: req.user.role,
      },
    };

    const clonedLead = new Lead(clonedLeadData);
    // leadId will be auto‑generated in pre('save') hook
    await clonedLead.save();

    res.status(201).json({
      success: true,
      message: "Lead cloned successfully",
      lead: clonedLead,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const searchOnboarding = async (req, res) => {
  try {
    const {
      q,                  // global search term
      status,
      engagementType,
      leadId,
      companyName,
      leadName,
      fromDate,
      toDate,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build lead sub‑query if searching by lead fields
    let leadIds = null;
    if (q || companyName || leadName || leadId) {
      const leadQuery = {};

      if (leadId) leadQuery._id = leadId;
      if (leadName) leadQuery.leadName = { $regex: leadName, $options: "i" };
      if (companyName) {
        // We need to join with Company? Or use companySnapshot? 
        // Assuming lead has a 'company' reference; we can use a lookup later.
        // For simplicity, search in companySnapshot.companyName
        leadQuery["companySnapshot.companyName"] = { $regex: companyName, $options: "i" };
      }
      if (q) {
        leadQuery.$or = [
          { leadName: { $regex: q, $options: "i" } },
          { "companySnapshot.companyName": { $regex: q, $options: "i" } },
          { leadId: { $regex: q, $options: "i" } },
        ];
      }

      const leads = await Lead.find(leadQuery).select("_id").lean();
      leadIds = leads.map(l => l._id);
      if (leadIds.length === 0) {
        // No matching leads → no onboarding results
        return res.status(200).json({
          success: true,
          data: [],
          pagination: { page: Number(page), limit: Number(limit), total: 0, pages: 0 },
        });
      }
    }

    // Onboarding filter
    const filter = {};
    if (leadIds) filter.lead = { $in: leadIds };
    if (status) filter.status = status;
    if (engagementType) filter.engagementType = engagementType;

    // Date range (onboarding createdAt)
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = new Date(fromDate);
      if (toDate) filter.createdAt.$lte = new Date(toDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    const [data, total] = await Promise.all([
      Onboarding.find(filter)
        .populate("lead", "leadId leadName companySnapshot.companyName stage")
        .populate("vendor", "name email")
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Onboarding.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Onboarding search error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


/**
 * @desc    Get all onboarding records with pagination (no filters)
 * @route   GET /api/onboarding
 * @access  Private
 */
export const getAllOnboardings = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // ----- 1. Access Control: User can only see onboardings of leads they own / are assigned -----
    let accessibleLeadIds = null;
    if (req.user.role !== "SUPER_ADMIN") {
      // Fetch leads where user is creator OR assigned (similar to your getLeads logic)
      const leadQuery = {
        $or: [
          { "createdBy.userId": req.user._id },
          { assignedAdmins: req.user._id },
          { assignedUsers: req.user._id },
        ],
      };
      const accessibleLeads = await Lead.find(leadQuery).select("_id").lean();
      accessibleLeadIds = accessibleLeads.map((l) => l._id);

      if (accessibleLeadIds.length === 0) {
        // No accessible leads → return empty list
        return res.status(200).json({
          success: true,
          data: [],
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: 0,
            pages: 0,
          },
        });
      }
    }

    // ----- 2. Build filter -----
    const filter = {};
    if (accessibleLeadIds) {
      filter.lead = { $in: accessibleLeadIds };
    }

    // ----- 3. Pagination & Sorting -----
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    // ----- 4. Fetch data -----
    const [data, total] = await Promise.all([
      Onboarding.find(filter)
        .populate("lead", "leadId leadName companySnapshot.companyName stage")
        .populate("vendor", "name email")
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Onboarding.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get all onboardings error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};