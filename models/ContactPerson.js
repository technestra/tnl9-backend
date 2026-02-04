import mongoose from "mongoose";

const contactPersonSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true
    },

    companySnapshot: {
      companyName: String,
      ownerName: String,
      companyLinkedin: String,
      companyContact: String
    },

    name: {
      type: String,
      required: true
    },
    email: String,
    professionalEmail: String,
    phone: {
      type: String,
      required: true
    },
    designation: String,
    linkedin: String,
    contactLocation: String,
    addComment: String,

    /* STATUS */
    isActive: {
      type: Boolean,
      default: true
    },

    createdBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User",
        required: true
      },
      role: {
        type: String,
        enum: ["SUPER_ADMIN", "ADMIN", "USER"],
        required: true
      }
    }
  },
  { timestamps: true }
);

export default mongoose.model("ContactPerson", contactPersonSchema);