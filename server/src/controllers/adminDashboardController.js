const User = require("../models/User");
const RitualStep = require("../models/RitualStep");
const RitualPlan = require("../models/RitualPlan");
const ChatLog = require("../models/ChatLog");
const TawafCount = require("../models/TawafCount");
const Checklist = require("../models/Checklist");

// GET /api/admin/dashboard
const getDashboard = async (req, res) => {
  try {
    const [
      totalUsers,
      adminUsers,
      totalRitualSteps,
      hajjSteps,
      umrahSteps,
      totalPlans,
      recentUsers,
      recentChats,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "admin" }),
      RitualStep.countDocuments(),
      RitualStep.countDocuments({ ritualType: "hajj" }),
      RitualStep.countDocuments({ ritualType: "umrah" }),
      RitualPlan.countDocuments(),
      User.find().sort({ createdAt: -1 }).limit(5).select("fullName email role createdAt"),
      ChatLog.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("userId", "fullName email")
        .lean(),
    ]);

    res.json({
      stats: {
        totalUsers,
        adminUsers,
        pilgrimUsers: totalUsers - adminUsers,
        totalRitualSteps,
        hajjSteps,
        umrahSteps,
        totalPlans,
      },
      recentUsers,
      recentChats,
    });
  } catch (err) {
    console.error("Admin dashboard error:", err);
    res.status(500).json({ error: "Failed to fetch admin dashboard." });
  }
};

module.exports = { getDashboard };
