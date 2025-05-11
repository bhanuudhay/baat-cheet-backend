const Message = require("../models/Message");
const User = require("../models/User");
const Room = require("../models/Room");

// Search messages
const searchMessages = async (req, res) => {
  try {
    const { query, roomId, userId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    let searchQuery = {
      content: { $regex: query, $options: "i" },
      isDeleted: false,
    };

    // If searching in a specific room
    if (roomId) {
      searchQuery.room = roomId;
    }
    // If searching in private chat
    else if (userId) {
      searchQuery.$or = [
        { sender: req.user._id, receiver: userId },
        { sender: userId, receiver: req.user._id },
      ];
    }

    const messages = await Message.find(searchQuery)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("sender", "username profilePicture")
      .populate("receiver", "username profilePicture")
      .populate("room", "name");

    const total = await Message.countDocuments(searchQuery);

    res.json({
      messages,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Search users
const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
      _id: { $ne: req.user._id }, // Exclude current user
    })
      .select(
        "-password -verificationToken -resetPasswordToken -resetPasswordExpires"
      )
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await User.countDocuments({
      $or: [
        { username: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
      _id: { $ne: req.user._id },
    });

    res.json({
      users,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Search rooms
const searchRooms = async (req, res) => {
  try {
    const { query } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const rooms = await Room.find({
      name: { $regex: query, $options: "i" },
      "members.user": req.user._id,
      isActive: true,
    })
      .populate("members.user", "username profilePicture")
      .populate("creator", "username profilePicture")
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Room.countDocuments({
      name: { $regex: query, $options: "i" },
      "members.user": req.user._id,
      isActive: true,
    });

    res.json({
      rooms,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  searchMessages,
  searchUsers,
  searchRooms,
};
