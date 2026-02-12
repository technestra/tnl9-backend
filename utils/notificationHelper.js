import Notification from "../models/Notification.js";
import User from "../models/User.js";
import Lead from "../models/Lead.js";

/**
 * Send notification to a single user
 */
export const sendNotification = async ({
  recipientId,
  type,
  title,
  message,
  data = {},
}) => {
  try {
    await Notification.create({
      recipient: recipientId,
      type,
      title,
      message,
      data,
    });
  } catch (error) {
    console.error("Failed to send notification:", error);
  }
};

/**
 * Send notification to all assigned users/admins of a lead + creator + super admins
 */
export const notifyLeadStakeholders = async ({
  leadId,
  type,
  title,
  message,
  data = {},
}) => {
  try {
    const lead = await Lead.findById(leadId)
      .populate("createdBy.userId", "_id")
      .lean();
    if (!lead) return;

    const recipientSet = new Set();

    // Add creator
    if (lead.createdBy?.userId) {
      recipientSet.add(lead.createdBy.userId.toString());
    }

    // Add assigned admins & users (if your Lead schema has these fields)
    // If not, you may need to fetch from Company or elsewhere. For now, assume Lead has assignedAdmins/assignedUsers.
    if (lead.assignedAdmins) {
      lead.assignedAdmins.forEach(id => recipientSet.add(id.toString()));
    }
    if (lead.assignedUsers) {
      lead.assignedUsers.forEach(id => recipientSet.add(id.toString()));
    }

    // Also notify all SUPER_ADMINs
    const superAdmins = await User.find({ role: "SUPER_ADMIN" }).select("_id").lean();
    superAdmins.forEach(admin => recipientSet.add(admin._id.toString()));

    // Convert set to array and create notifications
    const notifications = Array.from(recipientSet).map(recipientId => ({
      recipient: recipientId,
      type,
      title,
      message,
      data: { ...data, leadId },
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
  } catch (error) {
    console.error("Failed to notify stakeholders:", error);
  }
};