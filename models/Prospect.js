import mongoose from "mongoose";

const prospectSchema = new mongoose.Schema(
  {
    prospectId: {
      type: String,
      required: true,
      unique: true
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
      companyName: { type: String, required: true },
      companyLinkedIn: String,
      companyWebsite: String,
      companyLocation: String,
      companyEmail: String,
      companyContact: String
    },

    suspectSnapshot: {
      suspectName: String,
      suspectEmail: String,
      suspectContact: String
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
      enum: ["Interested", "To Be Contacted", "Lost", "Junk"],
      default: "Interested"
    },

    prospectSource: {
      type: String,
      enum: ["LinkedIn", "UpWork", "Event", "Old Client", "Direct", "Tender", "Other"],
      default: "Direct"
    },

    decisionMaker: {
      type: Boolean,
      default: false
    },

    requirement: String,
    budget: String,
    timeline: String,

    comments:
    {
      text: String,
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    contactedDate: Date,

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

    status: {
      type: String,
      enum: ["OPEN", "WON"],
      default: "OPEN"
    },

    // Prospect.js - createdBy schema update
    createdBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        // required: true,
      },
      userName: {
        type: String,
        // required: true
      },
      userEmail: {  // NEW FIELD ADD KAREIN
        type: String,
        // required: true
      },
      role: {
        type: String,
        enum: ["SUPER_ADMIN", "ADMIN", "USER"],
        // required: true,
      },
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("Prospect", prospectSchema);