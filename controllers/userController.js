const User = require("../models/User");
const AWS = require("aws-sdk");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

// AWS S3 config
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});
const BUCKET = process.env.AWS_S3_BUCKET;

// Test S3 connection
const testS3Connection = async () => {
  try {
    console.log("Testing S3 connection...");
    console.log("S3 Configuration:", {
      region: process.env.AWS_REGION,
      bucket: BUCKET,
      hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
    });

    const result = await s3.listBuckets().promise();
    console.log("S3 Connection Test - Success!");
    console.log(
      "Available buckets:",
      result.Buckets.map((b) => b.Name)
    );
    return true;
  } catch (error) {
    console.error("S3 Connection Test - Failed!");
    console.error("Error details:", error);
    return false;
  }
};

// Run S3 connection test when the controller is loaded
testS3Connection();

// Upload profile picture to S3
const uploadProfilePicture = async (req, res) => {
  try {
    // First verify S3 connection
    const isS3Connected = await testS3Connection();
    if (!isS3Connected) {
      console.error(
        "S3 connection failed - AWS credentials may be missing or invalid"
      );
      return res.status(500).json({
        message:
          "File upload service is currently unavailable. Please try again later.",
        details: "AWS S3 connection failed",
      });
    }

    console.log("Upload request received:", {
      file: req.file
        ? {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
          }
        : null,
      user: req.user ? { id: req.user._id } : null,
    });

    if (!req.file) {
      console.error("No file uploaded");
      return res.status(400).json({ message: "No file uploaded" });
    }

    if (!req.user) {
      console.error("No user found in request");
      return res.status(401).json({ message: "User not authenticated" });
    }

    const ext = path.extname(req.file.originalname);
    const key = `profile_pictures/${uuidv4()}${ext}`;
    console.log("Uploading to S3 with key:", key);

    const params = {
      Bucket: BUCKET,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    };

    console.log("S3 upload params:", {
      Bucket: params.Bucket,
      Key: params.Key,
      ContentType: params.ContentType,
    });

    const s3Result = await s3.upload(params).promise();
    console.log("S3 upload success:", s3Result.Location);

    // Update user
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePicture: s3Result.Location },
      { new: true }
    );
    console.log("User profile updated with new image:", user.profilePicture);
    res.json({ profilePicture: user.profilePicture });
  } catch (err) {
    console.error("S3 Upload error:", err);
    if (err.code === "CredentialsError") {
      return res.status(500).json({
        message:
          "File upload service is currently unavailable. Please try again later.",
        details: "AWS credentials are invalid or missing",
      });
    }
    if (err.code === "NoSuchBucket") {
      return res.status(500).json({
        message:
          "File upload service is currently unavailable. Please try again later.",
        details: "AWS S3 bucket not found",
      });
    }
    res.status(500).json({
      message: "Failed to upload profile picture",
      details: err.message,
    });
  }
};

// Get all users except current user
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select("name email profilePicture isOnline lastSeen")
      .sort({ name: 1 });

    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

module.exports = {
  uploadProfilePicture,
  getAllUsers,
};
