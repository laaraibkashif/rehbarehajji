const ChecklistTemplate = require("../models/ChecklistTemplate");
const { logAdminAction } = require("../utils/auditLogger");
const { defaultPreparationItems, defaultRitualItems } = require("../seed/seedChecklists");

// GET /api/admin/checklists/templates/:type
const getTemplate = async (req, res) => {
  const { type } = req.params;

  if (!["preparation", "ritual"].includes(type)) {
    return res.status(400).json({ error: "Invalid type. Must be 'preparation' or 'ritual'." });
  }

  try {
    let template = await ChecklistTemplate.findOne({ type });

    // Seed from defaults on first access
    if (!template) {
      const defaultItems = type === "preparation" ? defaultPreparationItems : defaultRitualItems;
      template = await ChecklistTemplate.create({
        type,
        items: defaultItems.map((item) => ({
          label: item.label,
          group: item.group || "",
        })),
      });
    }

    res.json(template);
  } catch (err) {
    console.error("getTemplate error:", err);
    res.status(500).json({ error: "Failed to fetch template." });
  }
};

// PUT /api/admin/checklists/templates/:type — replace items entirely
const updateTemplate = async (req, res) => {
  const { type } = req.params;
  const { items } = req.body;

  if (!["preparation", "ritual"].includes(type)) {
    return res.status(400).json({ error: "Invalid type. Must be 'preparation' or 'ritual'." });
  }
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: "items array is required." });
  }
  for (const item of items) {
    if (!item.label || typeof item.label !== "string") {
      return res.status(400).json({ error: "Each item must have a 'label' string." });
    }
  }

  try {
    let template = await ChecklistTemplate.findOne({ type });
    if (!template) {
      template = new ChecklistTemplate({ type, items: [] });
    }

    template.items = items.map((item, i) => ({
      _id: item._id || undefined,
      label: item.label.trim(),
      group: item.group || "",
    }));

    await template.save();

    await logAdminAction({
      adminId: req.user._id,
      action: "update",
      entity: "checklist_template",
      entityId: template._id,
      changes: { type, itemCount: items.length },
    });

    res.json(template);
  } catch (err) {
    console.error("updateTemplate error:", err);
    res.status(500).json({ error: "Failed to update template." });
  }
};

// PATCH /api/admin/checklists/templates/:type/reorder
const reorderItems = async (req, res) => {
  const { type } = req.params;
  const { itemIds } = req.body;

  if (!["preparation", "ritual"].includes(type)) {
    return res.status(400).json({ error: "Invalid type." });
  }
  if (!Array.isArray(itemIds)) {
    return res.status(400).json({ error: "itemIds array is required." });
  }

  try {
    const template = await ChecklistTemplate.findOne({ type });
    if (!template) {
      return res.status(404).json({ error: "Template not found." });
    }

    // Build lookup
    const itemMap = {};
    template.items.forEach((item) => { itemMap[item._id.toString()] = item; });

    // Reorder according to itemIds
    const reordered = itemIds
      .map((id) => itemMap[id])
      .filter(Boolean);

    if (reordered.length !== template.items.length) {
      return res.status(400).json({ error: "itemIds must contain all item IDs." });
    }

    template.items = reordered;
    await template.save();

    await logAdminAction({
      adminId: req.user._id,
      action: "update",
      entity: "checklist_template",
      entityId: template._id,
      changes: { reordered: true, type },
    });

    res.json(template);
  } catch (err) {
    console.error("reorderItems error:", err);
    res.status(500).json({ error: "Failed to reorder items." });
  }
};

module.exports = { getTemplate, updateTemplate, reorderItems };
