const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  searchMessages,
  searchUsers,
  searchRooms,
} = require("../controllers/searchController");
const User = require("../models/User");

// Search messages
router.get("/messages", protect, searchMessages);

// Search users
router.get("/users", protect, async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
      _id: { $ne: req.user._id }, // Exclude current user
    })
      .select("username email profilePicture status lastSeen")
      .limit(10);

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Search rooms
router.get("/rooms", protect, searchRooms);

module.exports = router;
