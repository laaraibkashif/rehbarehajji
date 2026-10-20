const Dua = require("../models/Dua");

// Public: GET /api/duas?type=hajj   or   ?type=umrah
const listPublicDuas = async (req, res) => {
  try {
    const { type } = req.query;
    const filter = {};

    if (type === "hajj" || type === "umrah") {
      filter.$or = [
        { ritualType: { $in: [type, "both"] } },
        { ritualType: { $exists: false } }, // old duas
      ];
    }

    const duas = await Dua.find(filter).sort({ createdAt: 1 });
    res.json({ count: duas.length, duas });
  } catch (err) {
    console.error("listPublicDuas error:", err);
    res.status(500).json({ error: "Failed to fetch duas." });
  }
};

module.exports = { listPublicDuas };