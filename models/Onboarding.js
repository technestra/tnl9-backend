import mongoose from "mongoose";

const onboardingSchema = new mongoose.Schema(
  {
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      required: true,
      unique: true, // one-to-one with a lead
    },
    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },
    engagementType: {
      type: String,
      enum: ["IT_SERVICES", "STAFF_AUGMENTATION"],
      required: true,
    },
    // Common fields (optional – can be used for both types)
    startDate: Date,
    endDate: Date,
    amountFinalised: Number,
    gstIncluded: { type: Boolean, default: false },
    tdsApplied: { type: Boolean, default: false },
    bankDetails: String,

    // STAFF_AUGMENTATION specific
    staffing: String,              // e.g., "Full Time", "Part Time"
    engagementMonth: Date,         // or store as string, e.g. "2025-03"
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",              // assume Vendor model exists
    },
    resourceName: String,         // resource name from vendor

    // IT_SERVICES specific – YOU MUST CONFIRM THESE FIELDS
    projectScope: String,
    deliverables: String,
    // amount, dates, gst, tds, bankDetails are already shared above
    // Additional IT‑specific fields can be added here
  },
  { timestamps: true }
);

export default mongoose.model("Onboarding", onboardingSchema);