import mongoose from "mongoose";
import softDeletePlugin from "../middlewares/softDeletePlugin.js";

const employeeProfileSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      unique: true,
      immutable: true
    },

    employeeCode: {
      type: String,
      unique: true,
      immutable: true
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      required: true
    },

    dob: Date,
    gender: String,
    maritalStatus: String,
    bloodGroup: String,
    nationality: String,

    personalEmail: String,
    personalMobile: String,

    currentAddress: String,
    permanentAddress: String,

    emergencyContact: {
      name: String,
      relationship: String,
      phone: String
    },

    photo: {
      url: String,
      publicId: String
    },
    dateOfJoining: Date,
    employmentStatus: {
      type: String,
      enum: ["ACTIVE", "ON_NOTICE", "INACTIVE"],
      default: "ACTIVE"
    },

    employmentType: {
      type: String,
      enum: ["FULL_TIME", "CONTRACT", "CONSULTANT"]
    },

    designation: String,
    department: String,

    reportingManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    secondaryManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    workLocation: {
      type: String,
      enum: ["OFFICE", "CLIENT_SITE", "REMOTE"]
    },

    skills: [String],
    internalRole: String,

    panNumber: String,
    panLocked: { type: Boolean, default: false },

    aadhaarNumber: String,
    aadhaarLocked: { type: Boolean, default: false },

    uanNumber: String,
    uanLocked: { type: Boolean, default: false },

    pfAccountNumber: String,
    pfLocked: { type: Boolean, default: false },

    esicNumber: String,
    esicLocked: { type: Boolean, default: false },

    professionalTaxApplicable: Boolean,
    lwfApplicable: Boolean,

    bankDetails: {
      bankName: String,
      bankNameLocked: { type: Boolean, default: false },
      ifsc: String,
      accountHolderName: String
    },

    taxRegime: {
      type: String,
      enum: ["OLD", "NEW"]
    }
  },
  { timestamps: true }
);

employeeProfileSchema.plugin(softDeletePlugin);
export default mongoose.model("EmployeeProfile", employeeProfileSchema);