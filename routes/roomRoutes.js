const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  createRoom,
  getUserRooms,
  getRoomDetails,
  updateRoom,
  addMembers,
  removeMember,
  leaveRoom,
} = require("../controllers/roomController");

// Create a new room
router.post("/", protect, createRoom);

// Get all rooms for the current user
router.get("/", protect, getUserRooms);

// Get room details
router.get("/:roomId", protect, getRoomDetails);

// Update room details
router.put("/:roomId", protect, updateRoom);

// Add members to room
router.post("/:roomId/members", protect, addMembers);

// Remove member from room
router.delete("/:roomId/members/:memberId", protect, removeMember);

// Leave room
router.post("/:roomId/leave", protect, leaveRoom);

module.exports = router;
