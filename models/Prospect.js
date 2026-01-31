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
      required: true
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
      suspectName: { type: String},
      suspectEmail: String,
      suspectContact: String
    },


    prospectStatus: {
      type: String,
      enum: ["Interested", "To Be Contacted", "Lost", "Junk"],
      default: "Interested"
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
      ],
      default: "Direct"
    },

    decisionMaker: {
      type: Boolean,
      default: false
    },

    requirement: {
      type: String,
      // required: true
    },

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

    lastFollowUp: Date,
    nextFollowUp: Date,

    followUpOwner: String,

    status: {
      type: String,
      enum: ["OPEN", "WON"],
      default: "OPEN"
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("Prospect", prospectSchema);
