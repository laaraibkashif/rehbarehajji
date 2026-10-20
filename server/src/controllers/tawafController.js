const TawafCount = require("../models/TawafCount");

// ── Get current count ──

const getCount = async (req, res) => {
  const { userId } = req.params;
  const { type } = req.query;

  if (userId !== req.user.userId) {
    return res.status(403).json({ error: "You can only view your own counts." });
  }
  if (!type || !["tawaf", "sai"].includes(type)) {
    return res.status(400).json({ error: "Invalid or missing 'type' query param. Must be 'tawaf' or 'sai'." });
  }

  try {
    const record = await TawafCount.findOne({ userId, type });

    if (!record) {
      // Return a default zero-state rather than 404
      return res.json({ type, count: 0, lastUpdated: null });
    }

    res.json({ type: record.type, count: record.count, lastUpdated: record.lastUpdated });
  } catch (err) {
    console.error("getCount error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
};

// ── Increment count (atomic) ──

const incrementCount = async (req, res) => {
  const { userId } = req.params;
  const { type } = req.query;

  if (userId !== req.user.userId) {
    return res.status(403).json({ error: "You can only update your own counts." });
  }
  if (!type || !["tawaf", "sai"].includes(type)) {
    return res.status(400).json({ error: "Invalid or missing 'type' query param. Must be 'tawaf' or 'sai'." });
  }

  try {
    const record = await TawafCount.findOneAndUpdate(
      { userId, type },
      { $inc: { count: 1 }, $set: { lastUpdated: new Date() } },
      { upsert: true, new: true }
    );

    res.json({ type: record.type, count: record.count, lastUpdated: record.lastUpdated });
  } catch (err) {
    console.error("incrementCount error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
};

// ── Reset count to 0 ──

const resetCount = async (req, res) => {
  const { userId } = req.params;
  const { type } = req.query;

  if (userId !== req.user.userId) {
    return res.status(403).json({ error: "You can only reset your own counts." });
  }
  if (!type || !["tawaf", "sai"].includes(type)) {
    return res.status(400).json({ error: "Invalid or missing 'type' query param. Must be 'tawaf' or 'sai'." });
  }

  try {
    const record = await TawafCount.findOneAndUpdate(
      { userId, type },
      { $set: { count: 0, lastUpdated: new Date() } },
      { upsert: true, new: true }
    );

    res.json({ type: record.type, count: record.count, lastUpdated: record.lastUpdated });
  } catch (err) {
    console.error("resetCount error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
};

module.exports = { getCount, incrementCount, resetCount };
