const Checklist = require("../models/Checklist");
const { defaultPreparationItems, defaultRitualItems } = require("../seed/seedChecklists");

// ── Get checklist (seeds defaults on first access) ──

const getChecklist = async (req, res) => {
  const { userId } = req.params;
  const { type } = req.query;

  if (userId !== req.user.userId) {
    return res.status(403).json({ error: "You can only view your own checklist." });
  }
  if (!type || !["preparation", "ritual"].includes(type)) {
    return res.status(400).json({ error: "Invalid or missing 'type' query param. Must be 'preparation' or 'ritual'." });
  }

  try {
    let checklist = await Checklist.findOne({ userId, type });

    // Seed defaults on first access
    if (!checklist) {
      const defaultItems =
        type === "preparation" ? defaultPreparationItems : defaultRitualItems;
      checklist = await Checklist.create({
        userId,
        type,
        items: defaultItems.map((item) => ({ label: item.label, isChecked: false, group: item.group || "" })),
      });
    }

    res.json({ type: checklist.type, items: checklist.items });
  } catch (err) {
    console.error("getChecklist error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
};

// ── Update checklist (toggle item or add custom item) ──

const updateChecklist = async (req, res) => {
  const { userId } = req.params;
  const { type, itemId, isChecked, newItemLabel } = req.body;

  if (userId !== req.user.userId) {
    return res.status(403).json({ error: "You can only update your own checklist." });
  }
  if (!type || !["preparation", "ritual"].includes(type)) {
    return res.status(400).json({ error: "Invalid or missing 'type'. Must be 'preparation' or 'ritual'." });
  }

  try {
    let checklist = await Checklist.findOne({ userId, type });

    if (!checklist) {
      return res.status(404).json({ error: "Checklist not found. Load it first." });
    }

    // Add a new custom item
    if (newItemLabel) {
      const trimmed = newItemLabel.trim();
      if (trimmed.length === 0) {
        return res.status(400).json({ error: "Item label cannot be empty." });
      }
      checklist.items.push({ label: trimmed, isChecked: false });
      await checklist.save();
      return res.json({ type: checklist.type, items: checklist.items });
    }

    // Toggle an existing item
    if (!itemId) {
      return res.status(400).json({ error: "Either 'itemId' or 'newItemLabel' is required." });
    }

    const item = checklist.items.id(itemId);
    if (!item) {
      return res.status(404).json({ error: "Item not found." });
    }

    item.isChecked = isChecked !== undefined ? isChecked : !item.isChecked;
    await checklist.save();

    res.json({ type: checklist.type, items: checklist.items });
  } catch (err) {
    console.error("updateChecklist error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
};

module.exports = { getChecklist, updateChecklist };
