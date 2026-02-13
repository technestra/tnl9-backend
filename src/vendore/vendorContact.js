import mongoose from "mongoose";
import softDeletePlugin from "../../middlewares/softDeletePlugin.js";

const vendorContactSchema = new mongoose.Schema(
  {
    // Personal details
    name: { type: String, required: true },

    // Multiple contact numbers
    contactNumbers: [
      {
        type: { type: String, enum: ["personal", "professional", "other"] },
        number: String
      }
    ],

    // Multiple emails
    emails: [
      {
        type: { type: String, enum: ["personal", "professional", "other"] },
        email: String
      }
    ],

    address: String,
    country: String,

    // Associated company
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VendorCompany",
      required: true
    },

    // Professional details
    skillSet: [String],
    yearsOfExperience: Number,
    resume: { url: String, publicId: String },

    // NDA status & document
    ndaSigned: { type: Boolean, default: false },
    ndaDocument: { url: String, publicId: String },

    // Availability
    status: {
      type: String,
      enum: ["available", "not_available", "blocked"],
      default: "available"
    },

    // Audit
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

vendorContactSchema.plugin(softDeletePlugin);
export default mongoose.model("VendorContact", vendorContactSchema);