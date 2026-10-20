const BotConfig = require("../models/BotConfig");
const { logAdminAction } = require("../utils/auditLogger");

// GET /api/admin/bot-config
const getConfig = async (req, res) => {
  try {
    const config = await BotConfig.getConfig();
    res.json(config);
  } catch (err) {
    console.error("getConfig error:", err);
    res.status(500).json({ error: "Failed to fetch config." });
  }
};

// PUT /api/admin/bot-config
const updateConfig = async (req, res) => {
  const { systemPrompt, model, temperature } = req.body;

  try {
    const config = await BotConfig.getConfig();
    const changes = {};

    if (systemPrompt !== undefined && config.systemPrompt !== systemPrompt) {
      changes.systemPrompt = { from: config.systemPrompt.substring(0, 120), to: systemPrompt.substring(0, 120) };
      config.systemPrompt = systemPrompt;
    }
    if (model !== undefined && config.model !== model) {
      changes.model = { from: config.model, to: model };
      config.model = model;
    }
    if (temperature !== undefined && config.temperature !== temperature) {
      changes.temperature = { from: config.temperature, to: temperature };
      config.temperature = temperature;
    }

    config.updatedBy = req.user._id;
    await config.save();

    if (Object.keys(changes).length > 0) {
      await logAdminAction({
        adminId: req.user._id,
        action: "update",
        entity: "bot_config",
        entityId: config._id,
        changes,
      });
    }

    res.json(config);
  } catch (err) {
    console.error("updateConfig error:", err);
    res.status(500).json({ error: "Failed to update config." });
  }
};

module.exports = { getConfig, updateConfig };
