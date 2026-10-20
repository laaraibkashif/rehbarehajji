const RitualStep = require("../models/RitualStep");

const getRitualsByType = async (req, res) => {
  const { type } = req.params;

  if (!["hajj", "umrah"].includes(type)) {
    return res
      .status(400)
      .json({ error: "Invalid ritual type. Must be 'hajj' or 'umrah'." });
  }

  try {
    const steps = await RitualStep.find({ ritualType: type }).sort({ order: 1 });
    res.json({ ritualType: type, count: steps.length, steps });
  } catch (err) {
    console.error("getRitualsByType error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
};

module.exports = { getRitualsByType };
