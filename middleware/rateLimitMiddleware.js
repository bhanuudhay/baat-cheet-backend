const rateLimit = require("express-rate-limit");

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again after 15 minutes",
});

// Auth routes rate limiter (more strict)
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 requests per windowMs
  message: "Too many login attempts, please try again after an hour",
});

// Message sending rate limiter
const messageLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // Limit each IP to 20 messages per minute
  message: "Too many messages sent, please try again after a minute",
});

module.exports = {
  apiLimiter,
  authLimiter,
  messageLimiter,
};
