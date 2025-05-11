const express = require("express");
const router = express.Router();
const {
  uploadProfilePicture,
  getAllUsers,
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const multer = require("multer");

// Use memory storage for direct buffer upload to Cloudinary
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Get all users
router.get("/", protect, getAllUsers);

router.put(
  "/profile-picture",
  protect,
  upload.single("profilePicture"),
  uploadProfilePicture
);

router.get("/profile-picture", (req, res) => {
  res.json({ message: "Profile picture endpoint is reachable." });
});

module.exports = router;
