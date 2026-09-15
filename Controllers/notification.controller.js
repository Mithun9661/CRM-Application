const Notification = require("../Models/notification.model");

exports.getMyNotifications = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);
    const query = { recipientUserId: req.userId };

    if (req.query.unread === "true") query.read = false;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Notification.countDocuments(query),
      Notification.countDocuments({ recipientUserId: req.userId, read: false })
    ]);

    return res.status(200).send({
      page,
      totalPages: Math.max(Math.ceil(total / limit), 1),
      total,
      unreadCount,
      notifications
    });
  } catch (err) {
    return res.status(500).send({ message: err.message || "Unable to fetch notifications" });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientUserId: req.userId },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).send({ message: "Notification not found" });
    }

    return res.status(200).send(notification);
  } catch (err) {
    return res.status(500).send({ message: err.message || "Unable to update notification" });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { recipientUserId: req.userId, read: false },
      { read: true }
    );

    return res.status(200).send({
      message: "Notifications marked as read",
      updatedCount: result.modifiedCount || 0
    });
  } catch (err) {
    return res.status(500).send({ message: err.message || "Unable to update notifications" });
  }
};
