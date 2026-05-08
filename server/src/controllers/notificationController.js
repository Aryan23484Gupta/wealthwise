const asyncHandler = require("../utils/asyncHandler");
const { mapNotification } = require("../utils/userState");
const { syncDailyFinancialHighlights } = require("../services/financialHighlightsService");

const getNotifications = asyncHandler(async (req, res) => {
  await syncDailyFinancialHighlights(req.user);

  const notifications = [...(req.user.notifications || [])]
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, 5)
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
    notifications: req.user.notifications.slice(0, 5).map(mapNotification)
  });
});

const clearNotifications = asyncHandler(async (req, res) => {
  req.user.notifications = [];
  await req.user.save();

  res.json({
    message: "Notifications cleared.",
    notifications: []
  });
});

module.exports = {
  clearNotifications,
  getNotifications,
  markAllNotificationsRead
};
