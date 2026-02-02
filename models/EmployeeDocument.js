
import mongoose from "mongoose";

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

    // only for tracking/admin UI (not logic)
    unlockedBySuperAdmin: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

export default mongoose.model("EmployeeDocument", employeeDocumentSchema);
