import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "LEAD_WON",
        "ONBOARDING_PENDING",
        "ONBOARDING_COMPLETED",
        "ONBOARDING_UPDATED",
        "LEAD_CLONED",
        "SYSTEM",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    data: {
      // Flexible field for IDs, URLs, etc.
      leadId: mongoose.Schema.Types.ObjectId,
      onboardingId: mongoose.Schema.Types.ObjectId,
      link: String,
    },
    readAt: {
      type: Date,
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Index for faster queries
notificationSchema.index({ recipient: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);