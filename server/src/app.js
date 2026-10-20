const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// CORS — allow specific origins in production, all origins in development
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((s) => s.trim())
  : ["http://localhost:5173", "http://localhost:3000"];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      // Wildcard — reflect the requesting origin so credentials work correctly
      if (allowedOrigins.includes("*")) {
        return callback(null, origin);
      }
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        return callback(null, false);
      }
    },
    credentials: true,
  })
);
app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/rituals", require("./routes/ritualRoutes"));
app.use("/api/duas", require("./routes/duaRoutes"));
app.use("/api/plans", require("./routes/planRoutes"));
app.use("/api/chatbot", require("./routes/chatbotRoutes"));
app.use("/api/tawaf", require("./routes/tawafRoutes"));
app.use("/api/checklist", require("./routes/checklistRoutes"));
app.use("/api/emergency-contacts", require("./routes/emergencyRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));

// Public chat (optional auth)
app.use("/api/chat", require("./routes/chatRoutes"));

// Public settings (no auth)
app.get("/api/settings", require("./controllers/siteSettingsController").getSettings);

// Admin routes
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/admin/bot", require("./routes/botAdminRoutes"));

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

module.exports = app;