
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },

    email: {
      type: String,
      required: true,
      unique: true
    },

    phone: {
      type: String,
      required: true
    },

    password: {
      type: String,
      required: true
    },

    role: {
      type: String,
      enum: ["ADMIN", "USER"],
      required: true
    },

    companies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company"
      }
    ],

    createdBy: {
      type: String,
      enum: ["SUPER_ADMIN", "ADMIN"],
      required: true
    },

    isActive: {
      type: Boolean,
      default: true
    },
    moduleRoles: [
      {
        module: {
          type: String,
          enum: ["finance", "sales", "vendor", "companyDeck", "resource"],
          required: true
        },
        moduleRole: {
          type: String,
          enum: ["viewer", "editor", "admin"],
          default: "viewer"
        },
        assignedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SuperAdmin"
        },
        assignedAt: {
          type: Date,
          default: Date.now
        },
        canCreate: { type: Boolean, default: false },
        canRead: { type: Boolean, default: true },
        canUpdate: { type: Boolean, default: false },
        canDelete: { type: Boolean, default: false }
      }
    ],

    accessibleModules: [String],

  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);