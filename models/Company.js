import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    /* BASIC INFO */
    companyName: {
      type: String,
      required: true,
      trim: true
    },

    ownerName: {
      type: String,
      required: true
    },

    companyEmail: {
      type: String,
      required: true,
      lowercase: true
    },

    companyWebsite: {
      type: String
    },

    companyLinkedin: {
      type: String
    },

    companyCapability: {
      type: [String],
      required: true
    },
    companySize: {
      type: String,
      required: true
    },

    companySource: {
      type: String,
      enum: ["LinkedIn", "UpWork", "Event", "Referral", "Cold Email", "Tender", "Other"],
      required: true
    },

    companyAddress: {
      type: String,
      required: true
    },

    hasBench: {
      type: Boolean,
      required: true
    },

    resourceFromMarket: {
      type: Boolean,
      required: true
    },
    companyCountry: {
      type: String
    },

    comment: {
      type: String
    },
    isActive: {
      type: Boolean,
      default: true
    },

    /* CREATED BY */
    createdBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        // required: true,
      },
      userName: {
        type: String,
        // required: true
      },
      role: {
        type: String,
        enum: ["SUPER_ADMIN", "ADMIN", "USER"],
        // required: true,
      },
    },

    /* ASSIGNMENTS */
    assignedAdmins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],

    assignedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ]
  },
  { timestamps: true } // date/time automatically handled
);

export default mongoose.model("Company", companySchema);
