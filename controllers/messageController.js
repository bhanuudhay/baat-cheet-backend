const Message = require("../models/Message");
const Room = require("../models/Room");
const User = require("../models/User");

// Send private message
const sendPrivateMessage = async (req, res) => {
  try {
    const {
      receiverId,
      content,
      type = "text",
      fileUrl,
      fileName,
      fileSize,
      fileType,
    } = req.body;

    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found" });
    }

    // Check if receiver has blocked the sender
    if (receiver.blockedUsers.includes(req.user._id)) {
      return res
        .status(403)
        .json({ message: "Cannot send message to this user" });
    }

    const message = await Message.create({
      sender: req.user._id,
      receiver: receiverId,
      content,
      type,
      fileUrl,
      fileName,
      fileSize,
      fileType,
    });

    await message.populate("sender", "username profilePicture");
    await message.populate("receiver", "username profilePicture");

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Send room message
const sendRoomMessage = async (req, res) => {
  try {
    const {
      roomId,
      content,
      type = "text",
      fileUrl,
      fileName,
      fileSize,
      fileType,
    } = req.body;

    // Check if room exists and user is a member
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const isMember = room.members.some(
      (member) => member.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res
        .status(403)
        .json({ message: "Not authorized to send messages in this room" });
    }

    const message = await Message.create({
      sender: req.user._id,
      room: roomId,
      content,
      type,
      fileUrl,
      fileName,
      fileSize,
      fileType,
    });

    await message.populate("sender", "username profilePicture");
    await message.populate("room", "name");

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get private messages
const getPrivateMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    // Check if user exists
    const otherUser = await User.findById(userId);
    if (!otherUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if either user has blocked the other
    if (
      otherUser.blockedUsers.includes(req.user._id) ||
      req.user.blockedUsers.includes(userId)
    ) {
      return res.status(403).json({ message: "Cannot access messages" });
    }

    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: userId },
        { sender: userId, receiver: req.user._id },
      ],
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("sender", "username profilePicture")
      .populate("receiver", "username profilePicture");

    res.json(messages.reverse());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get room messages
const getRoomMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    // Check if user is a member of the room
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const isMember = room.members.some(
      (member) => member.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res
        .status(403)
        .json({ message: "Not authorized to view messages in this room" });
    }

    const messages = await Message.find({ room: roomId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("sender", "username profilePicture")
      .populate("room", "name");

    res.json(messages.reverse());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Edit message
const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Check if user is the sender
    if (message.sender.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to edit this message" });
    }

    message.content = content;
    message.isEdited = true;
    message.editedAt = Date.now();

    await message.save();
    res.json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete message
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Check if user is the sender or an admin in the room
    if (message.sender.toString() !== req.user._id.toString()) {
      if (message.room) {
        const room = await Room.findById(message.room);
        if (!room.admins.includes(req.user._id)) {
          return res
            .status(403)
            .json({ message: "Not authorized to delete this message" });
        }
      } else {
        return res
          .status(403)
          .json({ message: "Not authorized to delete this message" });
      }
    }

    message.isDeleted = true;
    message.deletedAt = Date.now();
    message.content = "This message was deleted";

    await message.save();
    res.json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Add reaction to message
const addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Check if user already reacted with this emoji
    const existingReaction = message.reactions.find(
      (reaction) =>
        reaction.user.toString() === req.user._id.toString() &&
        reaction.emoji === emoji
    );

    if (existingReaction) {
      // Remove reaction if it exists
      message.reactions = message.reactions.filter(
        (reaction) =>
          !(
            reaction.user.toString() === req.user._id.toString() &&
            reaction.emoji === emoji
          )
      );
    } else {
      // Add new reaction
      message.reactions.push({
        user: req.user._id,
        emoji,
      });
    }

    await message.save();
    await message.populate("reactions.user", "username");
    res.json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Mark message as read
const markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Check if message is already read by user
    const alreadyRead = message.readBy.some(
      (read) => read.user.toString() === req.user._id.toString()
    );

    if (!alreadyRead) {
      message.readBy.push({
        user: req.user._id,
        readAt: Date.now(),
      });
      await message.save();
    }

    res.json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get DM messages between current user and another user
const getDMMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    // Get messages where either user is sender or recipient
    const messages = await Message.find({
      $or: [
        { sender: currentUserId, recipient: userId },
        { sender: userId, recipient: currentUserId },
      ],
    })
      .sort({ createdAt: 1 })
      .populate("sender", "name profilePicture")
      .populate("recipient", "name profilePicture");

    // Mark messages as read
    await Message.updateMany(
      {
        sender: userId,
        recipient: currentUserId,
        read: false,
      },
      { read: true }
    );

    res.json(messages);
  } catch (error) {
    console.error("Error fetching DM messages:", error);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
};

// Send a DM message
const sendDMMessage = async (req, res) => {
  try {
    const { recipientId, content } = req.body;
    const senderId = req.user._id;

    // Validate recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: "Recipient not found" });
    }

    // Create new message
    const message = new Message({
      sender: senderId,
      recipient: recipientId,
      content,
      type: "dm",
    });

    await message.save();

    // Populate sender and recipient details
    await message.populate("sender", "name profilePicture");
    await message.populate("recipient", "name profilePicture");

    res.status(201).json(message);
  } catch (error) {
    console.error("Error sending DM message:", error);
    res.status(500).json({ message: "Failed to send message" });
  }
};

// Get unread message counts for all conversations
const getUnreadCount = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    // Get all unique users who have sent messages to current user
    const conversations = await Message.distinct("sender", {
      recipient: currentUserId,
      read: false,
    });

    // If no conversations found, return empty object
    if (!conversations || conversations.length === 0) {
      return res.json({});
    }

    // Get unread count for each conversation
    const unreadCounts = {};
    for (const userId of conversations) {
      const count = await Message.countDocuments({
        sender: userId,
        recipient: currentUserId,
        read: false,
      });
      if (count > 0) {
        unreadCounts[userId] = count;
      }
    }

    res.json(unreadCounts);
  } catch (error) {
    console.error("Error getting unread counts:", error);
    res.status(500).json({ message: "Failed to get unread counts" });
  }
};

module.exports = {
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
};
