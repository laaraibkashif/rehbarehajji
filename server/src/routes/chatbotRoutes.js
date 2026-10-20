const { Router } = require("express");
const rateLimit = require("express-rate-limit");
const authMiddleware = require("../middleware/authMiddleware");
const chatbotController = require("../controllers/chatbotController");

const router = Router();

// All chatbot routes require authentication
router.use(authMiddleware);

// Rate limit: max 20 requests per hour per authenticated user
const chatbotLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user.userId,
  message: { error: "Too many requests. Please try again later." },
});

router.post("/ask", chatbotLimiter, chatbotController.askQuestion);

module.exports = router;
