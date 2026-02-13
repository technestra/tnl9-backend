import mongoose from "mongoose";
import softDeletePlugin from "../middlewares/softDeletePlugin.js";

const vendorCompanySchema = new mongoose.Schema(
  {
    // Basic identification
    vendorId: { type: String, unique: true, immutable: true }, // auto-generated or manual
    ownerName: String,

    // Emails (multiple types)
    emails: [
      {
        type: { type: String, enum: ["personal", "professional", "other"] },
        email: String
      }
    ],

    // Contacts (multiple types)
    contacts: [
      {
        type: { type: String, enum: ["personal", "professional", "other"] },
        number: String
      }
    ],

    // Company details
    skillSet: [String],
    website: String,
    typesOfServices: [String],
    address: String,
    country: String,

    // Legal documents status
    msaDone: { type: Boolean, default: false },
    ndaDone: { type: Boolean, default: false },
    msaDocument: { url: String, publicId: String }, // uploaded file
    ndaDocument: { url: String, publicId: String }, // uploaded file

    // Financial / capacity
    paymentTerms: String, // e.g. "NET30"
    maxCapacity: Number,  // maximum number of concurrent resources

    // Audit & ownership
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

vendorCompanySchema.plugin(softDeletePlugin);
export default mongoose.model("VendorCompany", vendorCompanySchema);