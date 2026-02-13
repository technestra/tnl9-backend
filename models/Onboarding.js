// import mongoose from "mongoose";

// const onboardingSchema = new mongoose.Schema(
//   {
//     lead: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Lead",
//       required: true,
//       unique: true, // one-to-one with a lead
//     },
//     status: {
//       type: String,
//       enum: ["pending", "completed"],
//       default: "pending",
//     },
//     engagementType: {
//       type: String,
//       enum: ["IT_SERVICES", "STAFF_AUGMENTATION"],
//       required: true,
//     },
//     // Common fields (optional – can be used for both types)
//     startDate: Date,
//     endDate: Date,
//     amountFinalised: Number,
//     gstIncluded: { type: Boolean, default: false },
//     tdsApplied: { type: Boolean, default: false },
//     bankDetails: String,

//     // STAFF_AUGMENTATION specific
//     staffing: String,              // e.g., "Full Time", "Part Time"
//     engagementMonth: Date,         // or store as string, e.g. "2025-03"
//     vendor: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Vendor",              // assume Vendor model exists
//     },
//     resourceName: String,         // resource name from vendor

//     // IT_SERVICES specific – YOU MUST CONFIRM THESE FIELDS
//     projectScope: String,
//     deliverables: String,
//     // amount, dates, gst, tds, bankDetails are already shared above
//     // Additional IT‑specific fields can be added here
//   },
//   { timestamps: true }
// );

// export default mongoose.model("Onboarding", onboardingSchema);



// models/Onboarding.js
import mongoose from "mongoose";

const onboardingSchema = new mongoose.Schema(
  {
    // ====================================================================
    // 1. ALL LEAD FIELDS (copied exactly from Lead schema)
    //    – No unique constraints, no pre-save hooks, no softDelete plugin
    //    – Every field is separate and fully editable
    // ====================================================================

    leadId: { type: String }, // unique removed

    prospect: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Prospect",
      required: false,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    suspect: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Suspect",
      required: false,
    },

    companySnapshot: {
      companyName: String,
      companyAddress: String,
      companyLinkedIn: String,
      companyWebsite: String,
      companyContact: String,
      companyEmail: String,
    },

    contactSnapshots: [
      {
        name: { type: String, required: true },
        email: String,
        phone: { type: String, required: true },
        designation: String,
        linkedin: String,
        contactLocation: String,
      },
    ],

    contactPersonIds: [
      { type: mongoose.Schema.Types.ObjectId, ref: "ContactPerson" },
    ],

    prospectStatus: {
      type: String,
      enum: ["Interested", "To Be Contacted", "Lost", "Junk"],
    },

    prospectSource: {
      type: String,
      enum: [
        "LinkedIn",
        "UpWork",
        "Event",
        "Old Client",
        "Direct",
        "Tender",
        "Other",
      ],
    },

    requirement: String,
    budget: String,
    timeline: String,

    comments: [
      {
        text: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],

    followUpHistory: [
      {
        date: { type: Date, required: true },
        type: {
          type: String,
          enum: ["Last Followup", "Next Followup", "General"],
          required: true,
        },
        comment: { type: String, required: true },
        performedBy: {
          userId: mongoose.Schema.Types.ObjectId,
          userName: String,
          userEmail: String,
          role: String,
        },
        performedAt: { type: Date, default: Date.now },
      },
    ],

    lastFollowup: { type: Date, default: null },
    nextFollowup: { type: Date, default: null },
    lastFollowupComment: String,
    nextFollowupComment: String,

    followupReminder: {
      status: {
        type: String,
        enum: ["None", "Today", "1 Day", "2 Days", "Overdue"],
        default: "None",
      },
      notifiedAt: Date,
    },

    leadName: { type: String, required: true },

    engagementType: {
      type: String,
      enum: ["IT_SERVICES", "STAFF_AUGMENTATION"],
      required: true,
    },

    platform: {
      type: String,
      enum: [
        "LinkedIn",
        "Direct",
        "Referral",
        "Website",
        "UpWork",
        "Event",
        "Old Client",
        "Tender",
        "Other",
      ],
    },

    pipelineType: {
      type: String,
      enum: ["IT Services", "Staff Augmentation"],
      required: true,
    },

    stage: {
      type: String,
      enum: ["New", "PreSales", "Proposal", "Negotiation", "Won", "Lost", "Hold"],
      default: "New",
    },

    currentStatus: {
      type: String,
      enum: ["Active", "On Hold", "Closed"],
      default: "Active",
    },

    forecastCategory: {
      type: String,
      enum: ["Pipeline", "Best Case", "Commit", "Closed"],
      default: "Pipeline",
    },

    // IT_SERVICES specific fields
    projectCategory: {
      type: String,
      enum: ["Web", "Mobile", "AI", "Support"],
    },
    domain: String,
    technologyStack: String,
    scopeSummary: String,
    engagementModel: {
      type: String,
      enum: ["Fixed", "T&M"],
    },
    estimatedDuration: String,
    estimatedProjectValue: String,
    proposalStatus: {
      type: String,
      enum: ["Draft", "Sent", "Approved", "Rejected"],
    },
    proposalVersion: String,
    negotiationNotes: String,

    // STAFF_AUGMENTATION specific fields
    jobTitle: String,
    requiredSkills: String,
    experienceLevel: {
      type: String,
      enum: ["Junior", "Mid", "Senior"],
    },
    numberOfResources: Number,
    billingRateRange: String,
    contractDuration: String,
    location: {
      type: String,
      enum: ["Remote", "Onsite", "Hybrid"],
      default: "Remote",
    },
    interviewRounds: Number,
    clientFeedback: String,

    convertedFromProspect: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },

    // Soft delete fields (added by softDeletePlugin in Lead)
    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,

    createdBy: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      userName: String,
      userEmail: String,
      role: { type: String, enum: ["SUPER_ADMIN", "ADMIN", "USER"] },
    },

    // ====================================================================
    // 2. ONBOARDING SPECIFIC FIELDS
    // ====================================================================

    // Link to the original Lead (one-to-one, unique)
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      required: true,
      unique: true,
    },

    // Onboarding progress status
    onboardingStatus: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },

    // Approval workflow (superadmin approval)
    approvalStatus: {
      type: String,
      enum: ["pending_approval", "approved", "rejected"],
      default: "pending_approval",
    },

    submittedBy: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      userName: String,
      userEmail: String,
      role: { type: String, enum: ["SUPER_ADMIN", "ADMIN", "USER"] },
    },
    submittedAt: { type: Date, default: Date.now },

    approvedBy: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      userName: String,
      userEmail: String,
      role: { type: String, enum: ["SUPER_ADMIN", "ADMIN", "USER"] },
    },
    approvedAt: Date,
    rejectionReason: String,

    // Extra business fields (your requirements)
    profitMargin: Number,
    earlyDate: Date,
    workingTime: String,        // e.g., "Full Time", "Part Time"
    estimatedHours: Number,
    legalAgreements: [String],  // e.g., ["NDA", "MSA"]
    projectType: String,        // e.g., "Web", "Mobile", "Staff Augmentation"

    // STAFF_AUGMENTATION specific (vendor removed as requested)
    staffing: String,           // "Full Time", "Part Time"
    engagementMonth: Date,
    resourceName: String,

    // IT_SERVICES specific
    projectScope: String,
    deliverables: String,
  },
  { timestamps: true }
);

export default mongoose.model("Onboarding", onboardingSchema);