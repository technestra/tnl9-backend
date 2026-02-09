
import mongoose from "mongoose";
import softDeletePlugin from "../middlewares/softDeletePlugin.js";

const documentItemSchema = new mongoose.Schema({
  url: String,
  publicId: String,
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  locked: {
    type: Boolean,
    default: false
  }
});

const employeeDocumentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      required: true
    },

    employeeProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EmployeeProfile",
      required: true
    },

    documents: {
      RESUME: documentItemSchema,
      OFFER_LETTER: documentItemSchema,
      APPOINTMENT_LETTER: documentItemSchema,
      ID_PROOF: documentItemSchema,
      ADDRESS_PROOF: documentItemSchema,
      BANK_PROOF: documentItemSchema,
      EDUCATION_CERTIFICATE: documentItemSchema,
      EXPERIENCE_LETTER: documentItemSchema,
      COMPLIANCE_DECLARATION: documentItemSchema
    },

    unlockedBySuperAdmin: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

employeeDocumentSchema.plugin(softDeletePlugin);
export default mongoose.model("EmployeeDocument", employeeDocumentSchema);
