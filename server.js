const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const connectDB = require("./config/db");
const { apiLimiter } = require("./middleware/rateLimitMiddleware");
const AWS = require("aws-sdk");
const http = require("http");
const { Server } = require("socket.io");
const socketHandler = require("./sockets/socket");

dotenv.config();
connectDB();

// AWS S3 Configuration Check
console.log("\n=== AWS S3 Connection Check ===");
console.log("Checking AWS S3 configuration...");
console.log("AWS Region:", process.env.AWS_REGION);
console.log("AWS Bucket:", process.env.AWS_S3_BUCKET);
console.log("AWS Access Key ID exists:", !!process.env.AWS_ACCESS_KEY_ID);
console.log(
  "AWS Secret Access Key exists:",
  !!process.env.AWS_SECRET_ACCESS_KEY
);

if (
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY &&
  process.env.AWS_S3_BUCKET &&
  process.env.AWS_REGION
) {
  console.log("\nInitializing AWS S3 client...");
  const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
  });

  console.log("Attempting to list S3 buckets...");
  s3.listBuckets((err, data) => {
    if (err) {
      console.error("\n❌ [S3] Connection failed!");
      console.error("Error message:", err.message);
      console.error("Error details:", err);
    } else {
      console.log("\n✅ [S3] Connection successful!");
      console.log(
        "Available buckets:",
        data.Buckets.map((b) => b.Name)
      );
      console.log("Owner:", data.Owner.DisplayName);
    }
  });
} else {
  console.warn("\n⚠️ [S3] AWS credentials or config missing in .env");
  console.warn("Required environment variables:");
  console.warn("- AWS_ACCESS_KEY_ID:", !!process.env.AWS_ACCESS_KEY_ID);
  console.warn("- AWS_SECRET_ACCESS_KEY:", !!process.env.AWS_SECRET_ACCESS_KEY);
  console.warn("- AWS_S3_BUCKET:", !!process.env.AWS_S3_BUCKET);
  console.warn("- AWS_REGION:", !!process.env.AWS_REGION);
}
console.log("=== End of S3 Connection Check ===\n");

const app = express();
const server = http.createServer(app);

// Socket.io setup with more specific CORS configuration
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(express.json());
app.use(apiLimiter);

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/rooms", require("./routes/roomRoutes"));
app.use("/api/messages", require("./routes/messageRoutes"));
app.use("/api/search", require("./routes/searchRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));

// Root Route
app.get("/", (req, res) => {
  res.send("Welcome to BaatCheet Backend");
});

// Socket.io handler
socketHandler(io);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: err.message || "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err : {},
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
