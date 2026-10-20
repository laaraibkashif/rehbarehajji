const botService = require("../services/botService");
const KnowledgeEntry = require("../models/KnowledgeEntry");
const ChatLog = require("../models/ChatLog");
const { logAdminAction } = require("../utils/auditLogger");

// ── Knowledge Entry CRUD ──

/** GET /api/admin/bot/knowledge */
const listEntries = async (req, res) => {
  try {
    const { category, search, isActive, page, limit } = req.query;
    const result = await botService.listEntries({
      category,
      search,
      isActive: isActive === "true" ? true : isActive === "false" ? false : undefined,
      page: parseInt(page) || 1,
      limit: Math.min(parseInt(limit) || 50, 100),
    });
    res.json(result);
  } catch (err) {
    console.error("[botAdminController] listEntries error:", err);
    res.status(500).json({ error: "Failed to list entries." });
  }
};

/** POST /api/admin/bot/knowledge */
const createEntry = async (req, res) => {
  const { topic, question, answer, category, tags } = req.body;

  if (!question || !answer) {
    return res.status(400).json({ error: "question and answer are required." });
  }

  try {
    const entry = await botService.trainEntry({
      topic,
      question,
      answer,
      category,
      tags,
      createdBy: req.user.userId,
    });

    await logAdminAction({
      adminId: req.user._id,
      action: "create",
      entity: "knowledge_entry",
      entityId: entry._id,
      changes: { question: question.slice(0, 80), category: category || "other" },
    });

    res.status(201).json(entry);
  } catch (err) {
    console.error("[botAdminController] createEntry error:", err);
    res.status(500).json({ error: err.message || "Failed to create entry." });
  }
};

/** POST /api/admin/bot/knowledge/bulk */
const bulkImport = async (req, res) => {
  const { entries } = req.body;

  if (!Array.isArray(entries) || entries.length === 0) {
    return res.status(400).json({ error: "entries array is required." });
  }

  try {
    // Attach creator before passing to service
    const withCreator = entries.map((e) => ({ ...e, createdBy: req.user.userId }));
    const result = await botService.bulkTrain(withCreator);

    await logAdminAction({
      adminId: req.user._id,
      action: "create",
      entity: "knowledge_entry",
      changes: { bulkImport: true, inserted: result.inserted, errors: result.errors.length },
    });

    res.status(201).json(result);
  } catch (err) {
    console.error("[botAdminController] bulkImport error:", err);
    res.status(500).json({ error: err.message || "Failed to import entries." });
  }
};

/** PATCH /api/admin/bot/knowledge/:id */
const updateEntry = async (req, res) => {
  try {
    const before = await KnowledgeEntry.findById(req.params.id).lean();
    if (!before) return res.status(404).json({ error: "Entry not found." });

    const entry = await botService.updateEntry(req.params.id, req.body);

    await logAdminAction({
      adminId: req.user._id,
      action: "update",
      entity: "knowledge_entry",
      entityId: entry._id,
      changes: { question: { from: before.question.slice(0, 80), to: entry.question.slice(0, 80) } },
    });

    res.json(entry);
  } catch (err) {
    if (err.message === "Knowledge entry not found.") {
      return res.status(404).json({ error: err.message });
    }
    console.error("[botAdminController] updateEntry error:", err);
    res.status(500).json({ error: "Failed to update entry." });
  }
};

/** DELETE /api/admin/bot/knowledge/:id */
const deleteEntry = async (req, res) => {
  try {
    const entry = await botService.deleteEntry(req.params.id);

    await logAdminAction({
      adminId: req.user._id,
      action: "delete",
      entity: "knowledge_entry",
      entityId: entry._id,
      changes: { deletedQuestion: entry.question.slice(0, 80) },
    });

    res.json({ message: "Entry deleted.", entry });
  } catch (err) {
    if (err.message === "Knowledge entry not found.") {
      return res.status(404).json({ error: err.message });
    }
    console.error("[botAdminController] deleteEntry error:", err);
    res.status(500).json({ error: "Failed to delete entry." });
  }
};

// ── Config ──

/** GET /api/admin/bot/config */
const getConfig = async (req, res) => {
  try {
    const config = await botService.getConfig();
    res.json(config);
  } catch (err) {
    console.error("[botAdminController] getConfig error:", err);
    res.status(500).json({ error: "Failed to fetch config." });
  }
};

/** PATCH /api/admin/bot/config */
const updateConfig = async (req, res) => {
  const { systemPrompt, model, temperature, fallbackMessage, matchThreshold } = req.body;

  try {
    // Capture before-state for audit diff
    const before = await botService.getConfig();

    const config = await botService.updateConfig({
      systemPrompt,
      model,
      temperature,
      fallbackMessage,
      matchThreshold,
    });

    const changes = {};
    if (systemPrompt !== undefined && before.systemPrompt !== systemPrompt) {
      changes.systemPromptUpdated = true;
    }
    if (model !== undefined && before.model !== model) {
      changes.model = { from: before.model, to: model };
    }
    if (temperature !== undefined && before.temperature !== temperature) {
      changes.temperature = { from: before.temperature, to: temperature };
    }
    if (fallbackMessage !== undefined && before.fallbackMessage !== fallbackMessage) {
      changes.fallbackMessageUpdated = true;
    }
    if (matchThreshold !== undefined && before.matchThreshold !== matchThreshold) {
      changes.matchThreshold = { from: before.matchThreshold, to: matchThreshold };
    }

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
    console.error("[botAdminController] updateConfig error:", err);
    res.status(500).json({ error: "Failed to update config." });
  }
};

// ── Test ──

/** POST /api/admin/bot/test */
const testAnswer = async (req, res) => {
  const { question } = req.body;

  if (!question || typeof question !== "string" || question.trim().length === 0) {
    return res.status(400).json({ error: "question is required." });
  }

  try {
    const result = await botService.answerQuestion({
      question: question.trim(),
      userId: "admin-test",
    });

    // Return the FULL result including matched entries and scores
    res.json(result);
  } catch (err) {
    console.error("[botAdminController] testAnswer error:", err);
    res.status(500).json({ error: "Failed to test answer." });
  }
};

// ── Chat Logs ──

/** GET /api/admin/bot/logs?page=1&limit=20 */
const getLogs = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));

    const [logs, total] = await Promise.all([
      ChatLog.find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("matchedIds")
        .lean(),
      ChatLog.countDocuments(),
    ]);

    res.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("[botAdminController] getLogs error:", err);
    res.status(500).json({ error: "Failed to fetch logs." });
  }
};

module.exports = {
  listEntries,
  createEntry,
  bulkImport,
  updateEntry,
  deleteEntry,
  getConfig,
  updateConfig,
  testAnswer,
  getLogs,
};
