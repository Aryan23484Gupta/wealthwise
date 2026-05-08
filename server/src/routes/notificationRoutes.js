const express = require("express");

const { requireUser } = require("../controllers/authController");
const {
  clearNotifications,
  getNotifications,
  markAllNotificationsRead
} = require("../controllers/notificationController");

const router = express.Router();

router.use(requireUser);
router.get("/", getNotifications);
router.put("/read", markAllNotificationsRead);
router.delete("/", clearNotifications);

module.exports = router;
