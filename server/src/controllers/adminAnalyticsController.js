const User = require("../models/User");
const RitualPlan = require("../models/RitualPlan");
const RitualStep = require("../models/RitualStep");
const ChatLog = require("../models/ChatLog");
const TawafCount = require("../models/TawafCount");

// ── Helper: parse ?from=&to= query params ──
function parseDateRange(query) {
  const now = new Date();
  const from = query.from ? new Date(query.from) : new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const to = query.to ? new Date(query.to) : now;
  // Clamp to valid range
  return { from: isNaN(from.getTime()) ? new Date(0) : from, to: isNaN(to.getTime()) ? now : to };
}

// ── Helper: stop-word list for topic extraction ──
const STOP_WORDS = new Set([
  "the","a","an","is","are","was","were","be","been","being","have","has","had",
  "do","does","did","will","would","shall","should","may","might","must","can",
  "could","i","me","my","you","your","he","him","his","she","her","it","its",
  "we","us","our","they","them","their","what","which","who","whom","this",
  "that","these","those","am","at","by","for","with","about","against","between",
  "into","through","during","before","after","above","below","from","up","down",
  "in","out","on","off","over","under","again","further","then","once","here",
  "there","when","where","why","how","all","each","every","both","few","more",
  "most","other","some","such","no","nor","not","only","own","same","so","than",
  "too","very","just","because","as","until","while","of","to","and","but","or",
  "if","also","please","tell","like","get","know","need","want","would","should",
  "could","does","doing","done","make","made","take","took","use","used","using",
  "say","said","see","saw","go","went","gone","come","came","give","gave","given",
  "find","found","think","thought","ask","asked","calling","called",
]);

// ── GET /api/admin/analytics/users-growth ──
const getUsersGrowth = async (req, res) => {
  try {
    const { from, to } = parseDateRange(req.query);

    const pipeline = [
      { $match: { createdAt: { $gte: from, $lte: to }, role: "pilgrim" } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: "$_id",
          count: 1,
        },
      },
    ];

    const daily = await User.aggregate(pipeline);

    res.json({ daily, from, to });
  } catch (err) {
    console.error("getUsersGrowth error:", err);
    res.status(500).json({ error: "Failed to fetch user growth data." });
  }
};

// ── GET /api/admin/analytics/plans-by-type ──
const getPlansByType = async (req, res) => {
  try {
    const { from, to } = parseDateRange(req.query);

    const pipeline = [
      { $match: { createdAt: { $gte: from, $lte: to } } },
      {
        $group: {
          _id: { ritualType: "$ritualType", ageGroup: "$ageGroup" },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      {
        $project: {
          _id: 0,
          ritualType: "$_id.ritualType",
          ageGroup: "$_id.ageGroup",
          count: 1,
        },
      },
    ];

    const results = await RitualPlan.aggregate(pipeline);

    // Also get totals per ritualType
    const totalsPipeline = [
      { $match: { createdAt: { $gte: from, $lte: to } } },
      { $group: { _id: "$ritualType", total: { $sum: 1 } } },
      { $project: { _id: 0, ritualType: "$_id", total: 1 } },
    ];

    const totals = await RitualPlan.aggregate(totalsPipeline);

    res.json({ breakdown: results, totals, from, to });
  } catch (err) {
    console.error("getPlansByType error:", err);
    res.status(500).json({ error: "Failed to fetch plan data." });
  }
};

// ── GET /api/admin/analytics/ritual-engagement ──
const getRitualEngagement = async (req, res) => {
  try {
    const { from, to } = parseDateRange(req.query);
    const type = req.query.ritualType || null;

    // Build match stage for the date range
    const planMatch = { createdAt: { $gte: from, $lte: to } };
    if (type && ["hajj", "umrah"].includes(type)) planMatch.ritualType = type;

    // Single aggregation pipeline: unwind generatedSteps, group by stepName,
    // collect unique plan IDs per step via $addToSet, then count —
    // no app-level loop, no risk of double-counting if a step name
    // appears more than once within a single plan.
    const planCounts = await RitualPlan.aggregate([
      { $match: planMatch },
      { $unwind: "$generatedSteps" },
      {
        $group: {
          _id: "$generatedSteps.stepName",
          planIds: { $addToSet: "$_id" },
        },
      },
      {
        $project: {
          _id: 1,
          planCount: { $size: "$planIds" },
        },
      },
    ]);

    // Build a lookup map from the aggregation results
    const countMap = {};
    planCounts.forEach(({ _id, planCount }) => {
      countMap[_id] = planCount;
    });

    // Get all ritual steps for the given type(s)
    const stepFilter = {};
    if (type && ["hajj", "umrah"].includes(type)) stepFilter.ritualType = type;

    const steps = await RitualStep.find(stepFilter)
      .sort({ ritualType: 1, order: 1 })
      .lean();

    // Map step data with plan counts (this is a JS lookup, not a loop per step)
    const engagement = steps.map((step) => ({
      stepId: step._id,
      ritualType: step.ritualType,
      order: step.order,
      name: step.name,
      planCount: countMap[step.name] || 0,
    }));

    res.json({ engagement, from, to });
  } catch (err) {
    console.error("getRitualEngagement error:", err);
    res.status(500).json({ error: "Failed to fetch ritual engagement data." });
  }
};

// ── GET /api/admin/analytics/chatbot-usage ──
const getChatbotUsage = async (req, res) => {
  try {
    const { from, to } = parseDateRange(req.query);

    // Volume per day
    const volumePipeline = [
      { $match: { createdAt: { $gte: from, $lte: to } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: "$_id", count: 1 } },
    ];

    const dailyVolume = await ChatLog.aggregate(volumePipeline);

    // Top question topics: extract keywords, filter stop words, count
    const TOPIC_LIMIT = Math.min(Math.max(parseInt(req.query.topicLimit) || 15, 1), 50);

    const questions = await ChatLog.find(
      { createdAt: { $gte: from, $lte: to } },
      { question: 1 }
    ).lean();

    const wordCounts = {};
    for (const log of questions) {
      // Lowercase, remove punctuation, split into words
      const words = log.question
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

      for (const word of words) {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      }
    }

    const topTopics = Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, TOPIC_LIMIT)
      .map(([topic, count]) => ({ topic, count }));

    res.json({ dailyVolume, topTopics, from, to });
  } catch (err) {
    console.error("getChatbotUsage error:", err);
    res.status(500).json({ error: "Failed to fetch chatbot data." });
  }
};

// ── GET /api/admin/analytics/summary ──
const getSummary = async (req, res) => {
  try {
    const { from, to } = parseDateRange(req.query);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalUsers, activePlansThisMonth, totalTawafTaps, chatbotQueriesThisMonth] =
      await Promise.all([
        User.countDocuments({ role: "pilgrim" }),
        RitualPlan.countDocuments({ createdAt: { $gte: monthStart } }),
        TawafCount.aggregate([
          { $group: { _id: null, total: { $sum: "$count" } } },
        ]),
        ChatLog.countDocuments({ createdAt: { $gte: monthStart } }),
      ]);

    res.json({
      summary: {
        totalUsers,
        activePlansThisMonth,
        totalTawafTaps: totalTawafTaps[0]?.total || 0,
        chatbotQueriesThisMonth,
      },
      from,
      to,
    });
  } catch (err) {
    console.error("getSummary error:", err);
    res.status(500).json({ error: "Failed to fetch summary." });
  }
};

module.exports = {
  getUsersGrowth,
  getPlansByType,
  getRitualEngagement,
  getChatbotUsage,
  getSummary,
};
