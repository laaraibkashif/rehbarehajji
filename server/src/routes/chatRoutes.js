const { Router } = require("express");
const jwt = require("jsonwebtoken");
const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
const chatController = require("../controllers/chatController");

const router = Router();

// ── Optional auth middleware ──
// Attempts to parse a Bearer token; if valid, attaches userId.
// Never rejects — unauthenticated requests still proceed.
router.use((req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = {
        userId: decoded.userId,
        role: decoded.role,
      };
    } catch {
      // Token invalid or expired — continue without auth
    }
  }

  next();
});

// ── Rate limiting ──
// 20 requests per minute, keyed by userId if authenticated,
// otherwise by IPv4/IPv6-safe IP key.
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,

  keyGenerator: (req) =>
    req.user?.userId || ipKeyGenerator(req.ip),

  validate: {
    xForwardedForHeader: false,
  },

  message: {
    error: "Too many requests. Please slow down and try again in a minute.",
  },
});

router.post("/", chatLimiter, chatController.askQuestion);

module.exports = router;