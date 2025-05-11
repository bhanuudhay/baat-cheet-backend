const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require("../controllers/notificationController");

// Get user notifications
router.get("/", protect, getNotifications);

// Mark notification as read
router.put("/:notificationId/read", protect, markAsRead);

// Mark all notifications as read
router.put("/read-all", protect, markAllAsRead);

// Delete notification
router.delete("/:notificationId", protect, deleteNotification);

module.exports = router;
