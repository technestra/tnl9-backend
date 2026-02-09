import mongoose from "mongoose";
import softDeletePlugin from "../middlewares/softDeletePlugin.js";
import { v4 as uuidv4 } from 'uuid';

const companySchema = new mongoose.Schema(
  {
    companyId: {
      type: String,
      unique: true,
      sparse: true,
    },
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
      lowercase: true,
      unique: true
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

    createdBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      userName: {
        type: String,
      },
      role: {
        type: String,
        enum: ["SUPER_ADMIN", "ADMIN", "USER"],
      },
    },

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
  { timestamps: true }
);

companySchema.pre("save", async function () {
  if (!this.companyId) {
    this.companyId = uuidv4(); // e.g., "550e8400-e29b-41d4-a716-446655440000"
  }
});

companySchema.plugin(softDeletePlugin);
export default mongoose.model("Company", companySchema);