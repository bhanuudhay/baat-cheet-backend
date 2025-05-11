const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  sendPrivateMessage,
  sendRoomMessage,
  getPrivateMessages,
  getRoomMessages,
  editMessage,
  deleteMessage,
  addReaction,
  markAsRead,
  getDMMessages,
  sendDMMessage,
  getUnreadCount,
} = require("../controllers/messageController");

// Private message routes
router.post("/private", protect, sendPrivateMessage);
router.get("/private/:userId", protect, getPrivateMessages);

// Room message routes
router.post("/room", protect, sendRoomMessage);
router.get("/room/:roomId", protect, getRoomMessages);

// Message actions
router.put("/:messageId", protect, editMessage);
router.delete("/:messageId", protect, deleteMessage);
router.post("/:messageId/reaction", protect, addReaction);
router.post("/:messageId/read", protect, markAsRead);

// DM Routes - Order matters! More specific routes first
router.get("/dm/unread", protect, getUnreadCount); // This must come before /dm/:userId
router.get("/dm/:userId", protect, getDMMessages);
router.post("/dm", protect, sendDMMessage);

module.exports = router;
