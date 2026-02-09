import mongoose from "mongoose";
import softDeletePlugin from "../middlewares/softDeletePlugin.js";

const suspectSchema = new mongoose.Schema(
  {
    suspectId: {
      type: String,
      required: true,
      unique: true
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true
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
    currentCompany: {
      type: String
    },
    budget: {
      type: String
    },
    firstContactedOn: {
      type: Date
    },
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
    lastFollowedUpOn: Date,
    lastFollowupComment: String,
    nextFollowUpOn: Date,
    nextFollowupComment: String,
    followupReminder: {
      status: { type: String, enum: ["None", "Today", "1 Day", "2 Days", "Overdue"], default: "None" },
      notifiedAt: Date
    },
    interestLevel: {
      type: String,
      enum: ["High", "Medium", "Low"]
    },
    companySnapshot: {
      companyName: {
        type: String,
        required: true
      },
      companyEmail: {
        type: String
      },
      companyWebsite: {
        type: String
      },
      companyLinkedin: {
        type: String
      },
      companyAddress: {
        type: String
      }
    },
    remarks: {
      type: String
    },
    isConverted: {
      type: Boolean,
      default: false
    },
    suspectSource: {
      type: String,
      enum: ["LinkedIn", "UpWork", "Event", "Referral", "Cold Email", "Tender", "Other"],
      required: true
    },
    status: {
      type: String,
      enum: ["SUSPECT", "New", "Contacted", "Converted", "Junk"],
      default: "SUSPECT"
    },
    // Suspect.js - createdBy schema update
    createdBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        // required: true,
      },
      userName: {
        type: String,
        // required: true
      },
      userEmail: {
        type: String,  // NEW FIELD ADD KAREIN
        // required: true
      },
      role: {
        type: String,
        enum: ["SUPER_ADMIN", "ADMIN", "USER"],
        // required: true,
      },
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

suspectSchema.plugin(softDeletePlugin);
export default mongoose.model("Suspect", suspectSchema);