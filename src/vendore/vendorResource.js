import mongoose from "mongoose";
import softDeletePlugin from "../../middlewares/softDeletePlugin.js";

const vendorResourceSchema = new mongoose.Schema(
  {
    // Link to the vendor company (required)
    vendorCompany: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VendorCompany",
      required: true
    },

    // Optional: link specific contacts involved
    contacts: [
      { type: mongoose.Schema.Types.ObjectId, ref: "VendorContact" }
    ],

    // Core resource fields
    date: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    comment: String,
    process: String, // e.g. "onboarding", "project execution", "invoice"

    // You can expand this schema later with any additional fields
    additionalInfo: mongoose.Schema.Types.Mixed
  },
  { timestamps: true }
);

vendorResourceSchema.plugin(softDeletePlugin);
export default mongoose.model("VendorResource", vendorResourceSchema);