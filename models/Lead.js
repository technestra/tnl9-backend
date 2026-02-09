import mongoose from "mongoose";
import softDeletePlugin from "../middlewares/softDeletePlugin.js";

const leadSchema = new mongoose.Schema(
  {
    leadId: {
      type: String,
      unique: true 
    },

    prospect: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Prospect",
      required: false
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true
    },
    suspect: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Suspect",
      required: false
    },
    companySnapshot: {
      companyName: String,
      companyAddress: String,
      companyLinkedIn: String,
      companyWebsite: String,
      companyContact: String,
      companyEmail: String
    },

    contactSnapshots: [
      {
        name: { type: String, required: true },
        email: String,
        phone: { type: String, required: true },
        designation: String,
        linkedin: String,
        contactLocation: String
      }
    ],

    contactPersonIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ContactPerson"
      }
    ],

    prospectStatus: {
      type: String,
      enum: ["Interested", "To Be Contacted", "Lost", "Junk"]
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
        "Other"
      ]
    },

    requirement: String,
    budget: String,
    timeline: String,

    comments: [
      {
        text: String,
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ],

followUpHistory: [
  {
    date: { type: Date, required: true },
    type: { 
      type: String, 
      enum: ["Last Followup", "Next Followup", "General"],
      required: true 
    },
    comment: { type: String, required: true },
    performedBy: {
      userId: mongoose.Schema.Types.ObjectId,
      userName: String,
      userEmail: String,
      role: String
    },
    performedAt: { type: Date, default: Date.now }
  }
],
lastFollowupComment: String,
nextFollowupComment: String,
followupReminder: {
  status: { type: String, enum: ["None", "Today", "1 Day", "2 Days", "Overdue"], default: "None" },
  notifiedAt: Date
},
    followUpOwner: String,

    leadName: {
      type: String,
      required: true
    },

    engagementType: {
      type: String,
      enum: ["IT_SERVICES", "STAFF_AUGMENTATION"],
      required: true
    },

    platform: {
      type: String,
      enum: ["LinkedIn", "Direct", "Referral", "Website", "UpWork", "Event", "Old Client", "Tender", "Other"]
    },

    pipelineType: {
      type: String,
      enum: ["IT Services", "Staff Augmentation"],
      required: true
    },

    stage: {
      type: String,
      enum: ["New", "Qualified", "Proposal", "Negotiation", "Won", "Lost"],
      default: "New"
    },

    currentStatus: {
      type: String,
      enum: ["Active", "On Hold", "Closed"],
      default: "Active"
    },

    forecastCategory: {
      type: String,
      enum: ["Pipeline", "Best Case", "Commit", "Closed"],
      default: "Pipeline"
    },

    projectCategory: {
      type: String,
      enum: ["Web", "Mobile", "AI", "Support"]
    },

    domain: String,
    technologyStack: String,
    scopeSummary: String,

    engagementModel: {
      type: String,
      enum: ["Fixed", "T&M"]
    },

    estimatedDuration: String,
    estimatedProjectValue: String,

    proposalStatus: {
      type: String,
      enum: ["Draft", "Sent", "Approved", "Rejected"]
    },

    proposalVersion: String,
    negotiationNotes: String,

    jobTitle: String,
    requiredSkills: String,

    experienceLevel: {
      type: String,
      enum: ["Junior", "Mid", "Senior"]
    },

    numberOfResources: Number,
    billingRateRange: String,
    contractDuration: String,

    location: {
      type: String,
      enum: ["Remote", "Onsite", "Hybrid"],
      default: "Remote"
    },

    interviewRounds: Number,
    clientFeedback: String,

    convertedFromProspect: {
      type: Boolean,
      default: false
    },

    isActive: {
      type: Boolean,
      default: true
    },

    createdBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      userName: {
        type: String,
      },
      userEmail: {   
        type: String,
      },
      role: {
        type: String,
        enum: ["SUPER_ADMIN", "ADMIN", "USER"],
      },
    },
  },
  { timestamps: true }
);

leadSchema.pre("save", async function () {
  if (!this.leadId) {
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.leadId = `L-${year}-${random}`;
  }
});

leadSchema.plugin(softDeletePlugin);
export default mongoose.model("Lead", leadSchema);