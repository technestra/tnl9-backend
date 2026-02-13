// // controllers/leadController.js (add this function)
// import Onboarding from "../models/Onboarding.js";
// import Lead from "../models/Lead.js";
// import { notifyLeadStakeholders } from "../utils/notificationHelper.js";

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

//     // 1️⃣ सबसे पहले Onboarding record बनाएँ (या ढूँढें)
//     let onboarding = await Onboarding.findOne({ lead: lead._id });
//     if (!onboarding) {
//       onboarding = new Onboarding({
//         lead: lead._id,
//         engagementType: lead.engagementType,
//         status: "pending",
//       });
//       await onboarding.save();
//     }

//     // 2️⃣ Lead को Won करें
//     lead.stage = "Won";
//     await lead.save();

//     // 3️⃣ Notification भेजें (अब onboarding._id मौजूद है)
//     await notifyLeadStakeholders({
//       leadId: lead._id,
//       type: "LEAD_WON",
//       title: "Lead Converted to Won",
//       message: `Lead "${lead.leadName}" has been marked as Won and is ready for onboarding.`,
//       data: { onboardingId: onboarding._id },
//     });

//     res.status(200).json({
//       success: true,
//       message: "Lead converted to Won and onboarding created",
//       lead,
//       onboarding,
//     });
//   } catch (error) {
//     console.error("Convert to Won Error:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };


// // controllers/onboardingController.js (or add to leadController)
// export const getOnboarding = async (req, res) => {
//   try {
//     const onboarding = await Onboarding.findOne({ lead: req.params.id })
//       .populate("vendor", "name email"); // adjust populate as needed

//     if (!onboarding) {
//       return res.status(404).json({
//         success: false,
//         message: "Onboarding record not found for this lead",
//       });
//     }

//     res.status(200).json({ success: true, onboarding });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// export const updateOnboarding = async (req, res) => {
//   try {
//     const onboarding = await Onboarding.findOne({ lead: req.params.id });
//     if (!onboarding) {
//       return res.status(404).json({
//         success: false,
//         message: "Onboarding record not found",
//       });
//     }

//     // Allowed fields to update
//     const allowedFields = [
//       "status",
//       "startDate",
//       "endDate",
//       "amountFinalised",
//       "gstIncluded",
//       "tdsApplied",
//       "bankDetails",
//       // Staff Augmentation
//       "staffing",
//       "engagementMonth",
//       "vendor",
//       "resourceName",
//       // IT Services – add your confirmed fields here
//       "projectScope",
//       "deliverables",
//     ];

//     allowedFields.forEach((field) => {
//       if (req.body[field] !== undefined) {
//         onboarding[field] = req.body[field];
//       }
//     });

//     // Auto‑complete: if all required fields for the engagementType are filled, set status to completed
//     // (Define your own “required” fields per type – this is just an example)
//     if (onboarding.engagementType === "STAFF_AUGMENTATION") {
//       const required = [
//         "staffing",
//         "engagementMonth",
//         "startDate",
//         "endDate",
//         "amountFinalised",
//         "vendor",
//         "resourceName",
//         "bankDetails",
//       ];
//       const allFilled = required.every((field) => onboarding[field] != null && onboarding[field] !== "");
//       if (allFilled) onboarding.status = "completed";
//     } else if (onboarding.engagementType === "IT_SERVICES") {
//       // adjust required fields after your confirmation
//       const required = [
//         "projectScope",
//         "deliverables",
//         "startDate",
//         "endDate",
//         "amountFinalised",
//       ];
//       const allFilled = required.every((field) => onboarding[field] != null && onboarding[field] !== "");
//       if (allFilled) onboarding.status = "completed";
//     }

//      const wasCompleted = onboarding.status === "completed";

//     await onboarding.save();

//     if (!wasCompleted && onboarding.status === "completed") {
//     await notifyLeadStakeholders({
//       leadId: onboarding.lead,
//       type: "ONBOARDING_COMPLETED",
//       title: "Onboarding Completed",
//       message: `Onboarding for lead "${lead.leadName}" has been completed.`,
//       data: { onboardingId: onboarding._id },
//     });
//   }
    
//     res.status(200).json({ success: true, onboarding });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// export const cloneLead = async (req, res) => {
//   try {
//     const originalLead = await Lead.findById(req.params.id).lean();
//     if (!originalLead) {
//       return res.status(404).json({ success: false, message: "Lead not found" });
//     }

//     // Exclude fields that must not be copied
//     const {
//       _id,
//       leadId,
//       stage,
//       isDeleted,
//       deletedAt,
//       deletedBy,
//       createdAt,
//       updatedAt,
//       convertedFromProspect,
//       followUpHistory,
//       comments,
//       // also exclude onboarding (if embedded, but we use separate model)
//       ...rest
//     } = originalLead;

//     // Set fresh values
//     const clonedLeadData = {
//       ...rest,
//       stage: "New",                // reset stage
//       isActive: true,
//       convertedFromProspect: false,
//       createdBy: {
//         userId: req.user._id,
//         userName: req.user.name,
//         userEmail: req.user.email,
//         role: req.user.role,
//       },
//     };

//     const clonedLead = new Lead(clonedLeadData);
//     // leadId will be auto‑generated in pre('save') hook
//     await clonedLead.save();

//     res.status(201).json({
//       success: true,
//       message: "Lead cloned successfully",
//       lead: clonedLead,
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// export const searchOnboarding = async (req, res) => {
//   try {
//     const {
//       q,                  // global search term
//       status,
//       engagementType,
//       leadId,
//       companyName,
//       leadName,
//       fromDate,
//       toDate,
//       page = 1,
//       limit = 20,
//       sortBy = "createdAt",
//       sortOrder = "desc",
//     } = req.query;

//     // Build lead sub‑query if searching by lead fields
//     let leadIds = null;
//     if (q || companyName || leadName || leadId) {
//       const leadQuery = {};

//       if (leadId) leadQuery._id = leadId;
//       if (leadName) leadQuery.leadName = { $regex: leadName, $options: "i" };
//       if (companyName) {
//         // We need to join with Company? Or use companySnapshot? 
//         // Assuming lead has a 'company' reference; we can use a lookup later.
//         // For simplicity, search in companySnapshot.companyName
//         leadQuery["companySnapshot.companyName"] = { $regex: companyName, $options: "i" };
//       }
//       if (q) {
//         leadQuery.$or = [
//           { leadName: { $regex: q, $options: "i" } },
//           { "companySnapshot.companyName": { $regex: q, $options: "i" } },
//           { leadId: { $regex: q, $options: "i" } },
//         ];
//       }

//       const leads = await Lead.find(leadQuery).select("_id").lean();
//       leadIds = leads.map(l => l._id);
//       if (leadIds.length === 0) {
//         // No matching leads → no onboarding results
//         return res.status(200).json({
//           success: true,
//           data: [],
//           pagination: { page: Number(page), limit: Number(limit), total: 0, pages: 0 },
//         });
//       }
//     }

//     // Onboarding filter
//     const filter = {};
//     if (leadIds) filter.lead = { $in: leadIds };
//     if (status) filter.status = status;
//     if (engagementType) filter.engagementType = engagementType;

//     // Date range (onboarding createdAt)
//     if (fromDate || toDate) {
//       filter.createdAt = {};
//       if (fromDate) filter.createdAt.$gte = new Date(fromDate);
//       if (toDate) filter.createdAt.$lte = new Date(toDate);
//     }

//     const skip = (parseInt(page) - 1) * parseInt(limit);
//     const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

//     const [data, total] = await Promise.all([
//       Onboarding.find(filter)
//         .populate("lead", "leadId leadName companySnapshot.companyName stage")
//         .populate("vendor", "name email")
//         .sort(sort)
//         .skip(skip)
//         .limit(parseInt(limit))
//         .lean(),
//       Onboarding.countDocuments(filter),
//     ]);

//     res.status(200).json({
//       success: true,
//       data,
//       pagination: {
//         page: Number(page),
//         limit: Number(limit),
//         total,
//         pages: Math.ceil(total / limit),
//       },
//     });
//   } catch (error) {
//     console.error("Onboarding search error:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };


// /**
//  * @desc    Get all onboarding records with pagination (no filters)
//  * @route   GET /api/onboarding
//  * @access  Private
//  */
// export const getAllOnboardings = async (req, res) => {
//   try {
//     const {
//       page = 1,
//       limit = 20,
//       sortBy = "createdAt",
//       sortOrder = "desc",
//     } = req.query;

//     // ----- 1. Access Control: User can only see onboardings of leads they own / are assigned -----
//     let accessibleLeadIds = null;
//     if (req.user.role !== "SUPER_ADMIN") {
//       // Fetch leads where user is creator OR assigned (similar to your getLeads logic)
//       const leadQuery = {
//         $or: [
//           { "createdBy.userId": req.user._id },
//           { assignedAdmins: req.user._id },
//           { assignedUsers: req.user._id },
//         ],
//       };
//       const accessibleLeads = await Lead.find(leadQuery).select("_id").lean();
//       accessibleLeadIds = accessibleLeads.map((l) => l._id);

//       if (accessibleLeadIds.length === 0) {
//         // No accessible leads → return empty list
//         return res.status(200).json({
//           success: true,
//           data: [],
//           pagination: {
//             page: Number(page),
//             limit: Number(limit),
//             total: 0,
//             pages: 0,
//           },
//         });
//       }
//     }

//     // ----- 2. Build filter -----
//     const filter = {};
//     if (accessibleLeadIds) {
//       filter.lead = { $in: accessibleLeadIds };
//     }

//     // ----- 3. Pagination & Sorting -----
//     const skip = (parseInt(page) - 1) * parseInt(limit);
//     const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

//     // ----- 4. Fetch data -----
//     const [data, total] = await Promise.all([
//       Onboarding.find(filter)
//         .populate("lead", "leadId leadName companySnapshot.companyName stage")
//         .populate("vendor", "name email")
//         .sort(sort)
//         .skip(skip)
//         .limit(parseInt(limit))
//         .lean(),
//       Onboarding.countDocuments(filter),
//     ]);

//     res.status(200).json({
//       success: true,
//       data,
//       pagination: {
//         page: Number(page),
//         limit: Number(limit),
//         total,
//         pages: Math.ceil(total / limit),
//       },
//     });
//   } catch (error) {
//     console.error("Get all onboardings error:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };


// controllers/onboardingController.js
import mongoose from "mongoose";
import Lead from "../models/Lead.js";
import Onboarding from "../models/Onboarding.js";
import { notifyLeadStakeholders } from "../utils/notificationHelper.js";

/**
 * ------------------------------------------------------------
 * 1. CONVERT LEAD TO WON & CREATE ONBOARDING
 *    Copies all Lead fields into Onboarding (editable snapshot)
 * ------------------------------------------------------------
 */
export const convertToWon = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const leadId = req.params.id;
    const lead = await Lead.findById(leadId).session(session);
    if (!lead) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: "Lead not found" });
    }

    if (lead.stage === "Won") {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: "Lead is already in Won stage" });
    }

    // Check if onboarding already exists
    let onboarding = await Onboarding.findOne({ lead: lead._id }).session(session);
    if (!onboarding) {
      // Convert lead document to plain object and remove internal fields
      const leadData = lead.toObject();
      delete leadData._id;
      delete leadData.__v;
      delete leadData.createdAt;
      delete leadData.updatedAt;
      delete leadData.leadId; // will be regenerated? Keep if you want, but we already have lead reference

      onboarding = new Onboarding({
        ...leadData,                 // ALL LEAD FIELDS COPIED HERE
        lead: lead._id,             // link to original lead
        leadName: lead.leadName,
        engagementType: lead.engagementType,
        pipelineType: lead.pipelineType,
        // Onboarding specific defaults
        onboardingStatus: "pending",
        approvalStatus: "pending_approval",
        submittedBy: req.user ? {
          userId: req.user._id,
          userName: req.user.name,
          userEmail: req.user.email,
          role: req.user.role,
        } : undefined,
        submittedAt: new Date(),
      });
      await onboarding.save({ session });
    }

    // Update lead stage to Won
    lead.stage = "Won";
    lead.currentStatus = "Closed";
    lead.forecastCategory = "Closed";
    await lead.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Send notification to all superadmins
    await notifyLeadStakeholders({
      leadId: lead._id,
      type: "LEAD_WON",
      title: "Lead Converted to Won",
      message: `Lead "${lead.leadName}" has been marked as Won. Onboarding record created and pending approval.`,
      data: { onboardingId: onboarding._id },
      roles: ["SUPER_ADMIN"], // only superadmins
    });

    res.status(200).json({
      success: true,
      message: "Lead converted to Won and onboarding created",
      lead,
      onboarding,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Convert to Won Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * ------------------------------------------------------------
 * 2. GET ONBOARDING BY LEAD ID
 * ------------------------------------------------------------
 */
export const getOnboarding = async (req, res) => {
  try {
    const onboarding = await Onboarding.findOne({ lead: req.params.id });
    if (!onboarding) {
      return res.status(404).json({ success: false, message: "Onboarding record not found" });
    }
    res.status(200).json({ success: true, onboarding });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * ------------------------------------------------------------
 * 3. UPDATE ONBOARDING (ANY FIELD) – EDITABLE SNAPSHOT
 *    Only users with access to the linked Lead can update.
 * ------------------------------------------------------------
 */
export const updateOnboarding = async (req, res) => {
  try {
    const leadId = req.params.id;
    // 1. Verify user has access to the lead (reuse your existing lead access logic)
    const lead = await Lead.findById(leadId);
    if (!lead) return res.status(404).json({ success: false, message: "Lead not found" });

    // Example access check – adjust to match your project
    const isAdmin = ["SUPER_ADMIN", "ADMIN"].includes(req.user.role);
    const isCreator = lead.createdBy?.userId?.toString() === req.user._id.toString();
    const isAssigned = [...(lead.assignedAdmins || []), ...(lead.assignedUsers || [])]
      .some(id => id.toString() === req.user._id.toString());
    if (!isAdmin && !isCreator && !isAssigned) {
      return res.status(403).json({ success: false, message: "You don't have permission to edit this onboarding" });
    }

    const onboarding = await Onboarding.findOne({ lead: leadId });
    if (!onboarding) {
      return res.status(404).json({ success: false, message: "Onboarding record not found" });
    }

    // Block updates if already approved? (optional – you decide)
    // if (onboarding.approvalStatus === "approved") {
    //   return res.status(400).json({ success: false, message: "Onboarding already approved. Cannot edit." });
    // }

    // ALLOWED FIELDS – all fields are allowed, but we restrict certain system fields
    const allowedFields = Object.keys(Onboarding.schema.paths).filter(
      key => !["_id", "__v", "lead", "createdAt", "updatedAt", "approvalStatus", "onboardingStatus", "approvedBy", "approvedAt", "rejectionReason", "submittedBy", "submittedAt"].includes(key)
    );

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        onboarding[field] = req.body[field];
      }
    });

    // If the record was previously rejected, reset approval status to pending_approval after edit
    if (onboarding.approvalStatus === "rejected") {
      onboarding.approvalStatus = "pending_approval";
      onboarding.rejectionReason = undefined;
    }

    await onboarding.save();

    res.status(200).json({ success: true, onboarding });
  } catch (error) {
    console.error("Update onboarding error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * ------------------------------------------------------------
 * 4. SUBMIT ONBOARDING FOR APPROVAL
 *    User explicitly sends for superadmin review.
 * ------------------------------------------------------------
 */
export const submitForApproval = async (req, res) => {
  try {
    const onboarding = await Onboarding.findOne({ lead: req.params.id });
    if (!onboarding) {
      return res.status(404).json({ success: false, message: "Onboarding record not found" });
    }

    // Cannot submit if already approved
    if (onboarding.approvalStatus === "approved") {
      return res.status(400).json({ success: false, message: "Onboarding already approved" });
    }

    // Update submission metadata
    onboarding.approvalStatus = "pending_approval";
    onboarding.submittedBy = {
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      role: req.user.role,
    };
    onboarding.submittedAt = new Date();
    onboarding.rejectionReason = undefined; // clear any previous rejection
    await onboarding.save();

    // Notify all superadmins
    await notifyLeadStakeholders({
      leadId: onboarding.lead,
      type: "ONBOARDING_SUBMITTED",
      title: "Onboarding Ready for Approval",
      message: `Onboarding for lead "${onboarding.leadName}" has been submitted for approval.`,
      data: { onboardingId: onboarding._id },
      roles: ["SUPER_ADMIN"],
    });

    res.status(200).json({ success: true, message: "Onboarding submitted for approval", onboarding });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * ------------------------------------------------------------
 * 5. APPROVE ONBOARDING (SUPERADMIN ONLY)
 * ------------------------------------------------------------
 */
export const approveOnboarding = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const onboarding = await Onboarding.findOne({ lead: req.params.id }).session(session);
    if (!onboarding) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: "Onboarding record not found" });
    }

    if (onboarding.approvalStatus === "approved") {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: "Onboarding already approved" });
    }

    onboarding.approvalStatus = "approved";
    onboarding.approvedBy = {
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      role: req.user.role,
    };
    onboarding.approvedAt = new Date();
    onboarding.rejectionReason = undefined;
    await onboarding.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Notify the submitter (and optionally other stakeholders)
    if (onboarding.submittedBy?.userId) {
      await notifyLeadStakeholders({
        leadId: onboarding.lead,
        type: "ONBOARDING_APPROVED",
        title: "Onboarding Approved",
        message: `Onboarding for lead "${onboarding.leadName}" has been approved. You can now proceed.`,
        data: { onboardingId: onboarding._id },
        userIds: [onboarding.submittedBy.userId], // direct notification to submitter
      });
    }

    res.status(200).json({ success: true, message: "Onboarding approved", onboarding });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * ------------------------------------------------------------
 * 6. REJECT ONBOARDING (SUPERADMIN ONLY)
 * ------------------------------------------------------------
 */
export const rejectOnboarding = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { rejectionReason } = req.body;
    if (!rejectionReason) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: "Rejection reason is required" });
    }

    const onboarding = await Onboarding.findOne({ lead: req.params.id }).session(session);
    if (!onboarding) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: "Onboarding record not found" });
    }

    onboarding.approvalStatus = "rejected";
    onboarding.rejectionReason = rejectionReason;
    onboarding.approvedBy = undefined; // clear any previous approval
    onboarding.approvedAt = undefined;
    await onboarding.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Notify the submitter
    if (onboarding.submittedBy?.userId) {
      await notifyLeadStakeholders({
        leadId: onboarding.lead,
        type: "ONBOARDING_REJECTED",
        title: "Onboarding Rejected",
        message: `Onboarding for lead "${onboarding.leadName}" was rejected. Reason: ${rejectionReason}`,
        data: { onboardingId: onboarding._id, rejectionReason },
        userIds: [onboarding.submittedBy.userId],
      });
    }

    res.status(200).json({ success: true, message: "Onboarding rejected", onboarding });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * ------------------------------------------------------------
 * 7. COMPLETE ONBOARDING (MARK ONBOARDING PROCESS AS DONE)
 *    Can be called manually or automatically after all required fields are filled.
 * ------------------------------------------------------------
 */
export const completeOnboarding = async (req, res) => {
  try {
    const onboarding = await Onboarding.findOne({ lead: req.params.id });
    if (!onboarding) {
      return res.status(404).json({ success: false, message: "Onboarding record not found" });
    }

    // Only allow completion if approved
    if (onboarding.approvalStatus !== "approved") {
      return res.status(400).json({ success: false, message: "Onboarding must be approved before it can be completed" });
    }

    onboarding.onboardingStatus = "completed";
    await onboarding.save();

    await notifyLeadStakeholders({
      leadId: onboarding.lead,
      type: "ONBOARDING_COMPLETED",
      title: "Onboarding Completed",
      message: `Onboarding for lead "${onboarding.leadName}" has been completed.`,
      data: { onboardingId: onboarding._id },
    });

    res.status(200).json({ success: true, message: "Onboarding completed", onboarding });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * ------------------------------------------------------------
 * 8. SEARCH ONBOARDINGS – Direct query on onboarding fields
 *    (All Lead data is inside onboarding document)
 * ------------------------------------------------------------
 */
export const searchOnboarding = async (req, res) => {
  try {
    const {
      q,
      onboardingStatus,
      approvalStatus,
      engagementType,
      leadName,
      companyName,
      fromDate,
      toDate,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build filter directly on onboarding schema
    const filter = {};

    if (onboardingStatus) filter.onboardingStatus = onboardingStatus;
    if (approvalStatus) filter.approvalStatus = approvalStatus;
    if (engagementType) filter.engagementType = engagementType;
    if (leadName) filter.leadName = { $regex: leadName, $options: "i" };
    if (companyName) filter["companySnapshot.companyName"] = { $regex: companyName, $options: "i" };

    // Global search across multiple fields
    if (q) {
      filter.$or = [
        { leadName: { $regex: q, $options: "i" } },
        { "companySnapshot.companyName": { $regex: q, $options: "i" } },
        { leadId: { $regex: q, $options: "i" } },
        { requirement: { $regex: q, $options: "i" } },
        { jobTitle: { $regex: q, $options: "i" } },
        { projectCategory: { $regex: q, $options: "i" } },
      ];
    }

    // Date range (createdAt of onboarding)
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = new Date(fromDate);
      if (toDate) filter.createdAt.$lte = new Date(toDate);
    }

    // Apply access control: users can only see onboardings of leads they own/assigned
    if (req.user.role !== "SUPER_ADMIN") {
      // Find accessible leads
      const leadQuery = {
        $or: [
          { "createdBy.userId": req.user._id },
          { assignedAdmins: req.user._id },
          { assignedUsers: req.user._id },
        ],
      };
      const accessibleLeads = await Lead.find(leadQuery).select("_id").lean();
      const leadIds = accessibleLeads.map(l => l._id);
      if (leadIds.length === 0) {
        return res.status(200).json({
          success: true,
          data: [],
          pagination: { page: Number(page), limit: Number(limit), total: 0, pages: 0 },
        });
      }
      filter.lead = { $in: leadIds };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    const [data, total] = await Promise.all([
      Onboarding.find(filter)
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
 * ------------------------------------------------------------
 * 9. GET ALL ONBOARDINGS (with access control)
 * ------------------------------------------------------------
 */
export const getAllOnboardings = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const filter = {};

    // Access control – non‑superadmins see only their own leads' onboardings
    if (req.user.role !== "SUPER_ADMIN") {
      const leadQuery = {
        $or: [
          { "createdBy.userId": req.user._id },
          { assignedAdmins: req.user._id },
          { assignedUsers: req.user._id },
        ],
      };
      const accessibleLeads = await Lead.find(leadQuery).select("_id").lean();
      const leadIds = accessibleLeads.map(l => l._id);
      if (leadIds.length === 0) {
        return res.status(200).json({
          success: true,
          data: [],
          pagination: { page: Number(page), limit: Number(limit), total: 0, pages: 0 },
        });
      }
      filter.lead = { $in: leadIds };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    const [data, total] = await Promise.all([
      Onboarding.find(filter)
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

/**
 * ------------------------------------------------------------
 * 10. CLONE LEAD (existing, but updated to include all lead fields)
 * ------------------------------------------------------------
 */
export const cloneLead = async (req, res) => {
  try {
    const originalLead = await Lead.findById(req.params.id).lean();
    if (!originalLead) {
      return res.status(404).json({ success: false, message: "Lead not found" });
    }

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
      ...rest
    } = originalLead;

    const clonedLeadData = {
      ...rest,
      stage: "New",
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