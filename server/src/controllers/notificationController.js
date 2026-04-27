const asyncHandler = require("../utils/asyncHandler");
const { mapNotification } = require("../utils/userState");

const getNotifications = asyncHandler(async (req, res) => {
  const notifications = [...(req.user.notifications || [])]
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .map(mapNotification);

  res.json({
    notifications
  });
});

const markAllNotificationsRead = asyncHandler(async (req, res) => {
  req.user.notifications = (req.user.notifications || []).map((notification) => ({
    ...notification.toObject?.(),
    read: true
  }));

  await req.user.save();

  res.json({
    message: "Notifications marked as read.",
    notifications: req.user.notifications.map(mapNotification)
  });
});

module.exports = {
  getNotifications,
  markAllNotificationsRead
};
