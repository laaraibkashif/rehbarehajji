const RitualPlan = require("../models/RitualPlan");
const TawafCount = require("../models/TawafCount");
const Checklist = require("../models/Checklist");
const ChatLog = require("../models/ChatLog");

const getDashboard = async (req, res) => {
  const { userId } = req.params;

  if (userId !== req.user.userId) {
    return res.status(403).json({ error: "You can only view your own dashboard." });
  }

  try {
    // ── Latest ritual plan ──
    const latestPlan = await RitualPlan.findOne({ userId }).sort({ createdAt: -1 });
    let planSummary = null;
    if (latestPlan) {
      const totalSteps = latestPlan.generatedSteps.length;
      const withNotes = latestPlan.generatedSteps.filter((s) => s.notes && s.notes.length > 0).length;
      planSummary = {
        ritualType: latestPlan.ritualType,
        ageGroup: latestPlan.ageGroup,
        travelMode: latestPlan.travelMode,
        totalSteps,
        stepsWithNotes: withNotes,
        completionPct: totalSteps > 0 ? Math.round((withNotes / totalSteps) * 100) : 0,
      };
    }

    // ── Tawaf counts ──
    const tawafRecord = await TawafCount.findOne({ userId, type: "tawaf" });
    const saiRecord = await TawafCount.findOne({ userId, type: "sai" });
    const tawafCounts = {
      tawaf: { count: tawafRecord?.count || 0, lastUpdated: tawafRecord?.lastUpdated || null },
      sai: { count: saiRecord?.count || 0, lastUpdated: saiRecord?.lastUpdated || null },
    };

    // ── Checklist completion ──
    const prepChecklist = await Checklist.findOne({ userId, type: "preparation" });
    const ritualChecklist = await Checklist.findOne({ userId, type: "ritual" });
    const calcPct = (items) => {
      if (!items || items.length === 0) return { total: 0, checked: 0, pct: 0 };
      const checked = items.filter((i) => i.isChecked).length;
      return { total: items.length, checked, pct: Math.round((checked / items.length) * 100) };
    };
    const checklistSummary = {
      preparation: calcPct(prepChecklist?.items),
      ritual: calcPct(ritualChecklist?.items),
    };

    // ── Recent chat logs ──
    const recentChats = await ChatLog.find({ userId })
      .sort({ createdAt: -1 })
      .limit(3)
      .select("question answer createdAt");

    res.json({
      planSummary,
      tawafCounts,
      checklistSummary,
      recentChats,
    });
  } catch (err) {
    console.error("getDashboard error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
};

module.exports = { getDashboard };
