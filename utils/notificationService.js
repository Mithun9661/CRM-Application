const Notification = require("../Models/notification.model");

const notifyUsers = async ({ recipients, companyId = null, ticketId = null, type, title, message, createdBy = "SYSTEM" }) => {
  try {
    const uniqueRecipients = [...new Set((recipients || []).filter(Boolean))];
    if (!uniqueRecipients.length) return;

    await Notification.insertMany(
      uniqueRecipients.map((recipientUserId) => ({
        recipientUserId,
        companyId,
        ticketId,
        type,
        title,
        message,
        createdBy
      })),
      { ordered: false }
    );
  } catch (err) {
    // Notifications must never break the main CRM workflow.
    console.error("Notification creation failed:", err.message);
  }
};

module.exports = { notifyUsers };
