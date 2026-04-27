const express = require("express");

const { requireUser } = require("../controllers/authController");
const {
  getNotifications,
  markAllNotificationsRead
} = require("../controllers/notificationController");

const router = express.Router();

router.use(requireUser);
router.get("/", getNotifications);
router.put("/read", markAllNotificationsRead);

module.exports = router;
