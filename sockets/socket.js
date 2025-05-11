const Message = require("../models/Message");
const User = require("../models/User");
const Room = require("../models/Room");
const { createNotification } = require("../controllers/notificationController");

module.exports = (io) => {
  // Store online users
  const onlineUsers = new Map();

  io.on("connection", (socket) => {
    console.log("🟢 New user connected:", socket.id);

    // Handle user connection
    socket.on("user-connect", async (userId) => {
      try {
        socket.userId = userId;
        // Update user status
        await User.findByIdAndUpdate(userId, {
          status: "online",
          lastSeen: Date.now(),
        });

        // Store socket mapping
        onlineUsers.set(userId, socket.id);

        // Join personal room
        socket.join(userId);

        // Notify all users about new online user
        io.emit("user-status-change", {
          userId,
          status: "online",
        });

        console.log(`User ${userId} connected`);
      } catch (err) {
        console.error("Error in user-connect:", err);
      }
    });

    // Handle private message
    socket.on(
      "private-message",
      async ({
        receiverId,
        content,
        type = "text",
        fileUrl,
        fileName,
        fileSize,
        fileType,
      }) => {
        try {
          if (!socket.userId) {
            console.error("No socket.userId set for private-message!");
            return socket.emit("error", {
              message: "Not authenticated for sending messages.",
            });
          }

          const message = await Message.create({
            sender: socket.userId,
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

          // Create notification
          const notification = await createNotification({
            recipientId: receiverId,
            senderId: socket.userId,
            type: "message",
            messageId: message._id,
            content: `${message.sender.username} sent you a message`,
          });

          // Send to receiver if online
          const receiverSocketId = onlineUsers.get(receiverId);
          if (receiverSocketId) {
            io.to(receiverSocketId).emit("receive-message", message);
            if (notification) {
              io.to(receiverSocketId).emit("new-notification", notification);
            }
          }

          // Send back to sender
          socket.emit("message-sent", message);
        } catch (err) {
          console.error("Error in private-message:", err);
          socket.emit("error", { message: "Error sending message" });
        }
      }
    );

    // Handle room message
    socket.on(
      "room-message",
      async ({
        roomId,
        content,
        type = "text",
        fileUrl,
        fileName,
        fileSize,
        fileType,
      }) => {
        try {
          if (!socket.userId) {
            console.error("No socket.userId set for room-message!");
            return socket.emit("error", {
              message: "Not authenticated for sending messages.",
            });
          }

          const message = await Message.create({
            sender: socket.userId,
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

          // Get room members
          const room = await Room.findById(roomId).populate("members.user");

          // Create notifications for all room members except sender
          for (const member of room.members) {
            if (member.user._id.toString() !== socket.userId) {
              const notification = await createNotification({
                recipientId: member.user._id,
                senderId: socket.userId,
                type: "message",
                messageId: message._id,
                roomId: roomId,
                content: `${message.sender.username} sent a message in ${room.name}`,
              });

              // Send notification if user is online
              const memberSocketId = onlineUsers.get(
                member.user._id.toString()
              );
              if (memberSocketId && notification) {
                io.to(memberSocketId).emit("new-notification", notification);
              }
            }
          }

          // Broadcast to room
          io.to(roomId).emit("receive-room-message", message);
        } catch (err) {
          console.error("Error in room-message:", err);
          socket.emit("error", { message: "Error sending message" });
        }
      }
    );

    // Handle message read
    socket.on("message-read", async ({ messageId }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return;

        // Add user to readBy if not already
        const alreadyRead = message.readBy.some(
          (read) => read.user.toString() === socket.userId
        );

        if (!alreadyRead) {
          message.readBy.push({
            user: socket.userId,
            readAt: Date.now(),
          });
          await message.save();

          // Create notification for sender
          if (message.sender.toString() !== socket.userId) {
            const notification = await createNotification({
              recipientId: message.sender,
              senderId: socket.userId,
              type: "read",
              messageId: message._id,
              content: "Your message was read",
            });

            // Send notification if sender is online
            const senderSocketId = onlineUsers.get(message.sender.toString());
            if (senderSocketId && notification) {
              io.to(senderSocketId).emit("new-notification", notification);
            }
          }
        }
      } catch (err) {
        console.error("Error in message-read:", err);
      }
    });

    // Handle typing indicator
    socket.on("typing", ({ receiverId, isTyping }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("user-typing", {
          userId: socket.userId,
          isTyping,
        });
      }
    });

    // Handle disconnection
    socket.on("disconnect", async () => {
      try {
        if (socket.userId) {
          // Update user status
          await User.findByIdAndUpdate(socket.userId, {
            status: "offline",
            lastSeen: Date.now(),
          });

          // Remove from online users
          onlineUsers.delete(socket.userId);

          // Notify all users
          io.emit("user-status-change", {
            userId: socket.userId,
            status: "offline",
          });

          console.log(`User ${socket.userId} disconnected`);
        }
      } catch (err) {
        console.error("Error in disconnect:", err);
      }
    });
  });
};
