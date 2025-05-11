const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
    },
    content: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["room", "dm"],
      default: "room",
    },
    fileUrl: String,
    fileName: String,
    fileSize: Number,
    fileType: String,
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: Date,
    read: {
      type: Boolean,
      default: false,
    },
    readBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    reactions: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        emoji: String,
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
  },
  {
    timestamps: true,
  }
);

// Validate that either recipient or room is present
messageSchema.pre("save", function (next) {
  if (!this.recipient && !this.room) {
    next(new Error("Message must have either a recipient or a room"));
  }
  if (this.recipient && this.room) {
    next(new Error("Message cannot have both recipient and room"));
  }
  next();
});

// Index for faster queries
messageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });
messageSchema.index({ room: 1, createdAt: -1 });

module.exports = mongoose.model("Message", messageSchema);
