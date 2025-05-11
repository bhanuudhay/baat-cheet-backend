const Room = require("../models/Room");
const User = require("../models/User");

// Create a new room
const createRoom = async (req, res) => {
  try {
    const { name, description, type, members = [] } = req.body;
    const room = await Room.create({
      name,
      description,
      type,
      creator: req.user._id,
      admins: [req.user._id],
      members: [
        { user: req.user._id, role: "admin" },
        ...members.map((member) => ({ user: member, role: "member" })),
      ],
    });

    await room.populate("members.user", "username profilePicture");
    res.status(201).json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all rooms for a user
const getUserRooms = async (req, res) => {
  try {
    const rooms = await Room.find({
      "members.user": req.user._id,
      isActive: true,
    })
      .populate("members.user", "username profilePicture status")
      .populate("creator", "username profilePicture");
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get room details
const getRoomDetails = async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId)
      .populate("members.user", "username profilePicture status")
      .populate("creator", "username profilePicture");

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Check if user is a member
    const isMember = room.members.some(
      (member) => member.user._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this room" });
    }

    res.json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update room details
const updateRoom = async (req, res) => {
  try {
    const { name, description, avatar } = req.body;
    const room = await Room.findById(req.params.roomId);

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Check if user is admin
    const isAdmin = room.admins.includes(req.user._id);
    if (!isAdmin) {
      return res
        .status(403)
        .json({ message: "Only admins can update room details" });
    }

    room.name = name || room.name;
    room.description = description || room.description;
    room.avatar = avatar || room.avatar;

    await room.save();
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Add members to room
const addMembers = async (req, res) => {
  try {
    const { members } = req.body;
    const room = await Room.findById(req.params.roomId);

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Check if user is admin
    const isAdmin = room.admins.includes(req.user._id);
    if (!isAdmin) {
      return res.status(403).json({ message: "Only admins can add members" });
    }

    // Add new members
    const newMembers = members.map((member) => ({
      user: member,
      role: "member",
    }));

    room.members.push(...newMembers);
    await room.save();

    await room.populate("members.user", "username profilePicture");
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Remove member from room
const removeMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    const room = await Room.findById(req.params.roomId);

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Check if user is admin
    const isAdmin = room.admins.includes(req.user._id);
    if (!isAdmin) {
      return res
        .status(403)
        .json({ message: "Only admins can remove members" });
    }

    // Remove member
    room.members = room.members.filter(
      (member) => member.user.toString() !== memberId
    );

    // Remove from admins if they were an admin
    room.admins = room.admins.filter((admin) => admin.toString() !== memberId);

    await room.save();
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Leave room
const leaveRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId);

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Remove user from members
    room.members = room.members.filter(
      (member) => member.user.toString() !== req.user._id.toString()
    );

    // Remove from admins if they were an admin
    room.admins = room.admins.filter(
      (admin) => admin.toString() !== req.user._id.toString()
    );

    // If no members left, delete the room
    if (room.members.length === 0) {
      await room.remove();
      return res.json({ message: "Room deleted as no members left" });
    }

    // If no admins left, make the first member an admin
    if (room.admins.length === 0 && room.members.length > 0) {
      room.admins.push(room.members[0].user);
      room.members[0].role = "admin";
    }

    await room.save();
    res.json({ message: "Successfully left the room" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createRoom,
  getUserRooms,
  getRoomDetails,
  updateRoom,
  addMembers,
  removeMember,
  leaveRoom,
};
