const BotKnowledge = require("../models/BotKnowledge");
const { getAnswer } = require("../services/aiChatbotService");
const { logAdminAction } = require("../utils/auditLogger");

// GET /api/admin/bot-knowledge?category=&search=&isActive=
const listKnowledge = async (req, res) => {
  try {
    const { category, search, isActive } = req.query;
    const filter = {};

    if (category && ["ritual", "ihram", "dua", "logistics", "emergency", "other"].includes(category)) {
      filter.category = category;
    }
    if (isActive === "true") filter.isActive = true;
    else if (isActive === "false") filter.isActive = false;

    const entries = search
      ? await BotKnowledge.find(
          { ...filter, $text: { $search: search } },
          { score: { $meta: "textScore" } }
        )
          .sort({ score: { $meta: "textScore" } })
          .lean()
      : await BotKnowledge.find(filter).sort({ createdAt: -1 }).lean();

    res.json({ count: entries.length, entries });
  } catch (err) {
    console.error("listKnowledge error:", err);
    res.status(500).json({ error: "Failed to fetch knowledge entries." });
  }
};

// GET /api/admin/bot-knowledge/:id
const getKnowledge = async (req, res) => {
  try {
    const entry = await BotKnowledge.findById(req.params.id);
    if (!entry) return res.status(404).json({ error: "Knowledge entry not found." });
    res.json(entry);
  } catch (err) {
    console.error("getKnowledge error:", err);
    res.status(500).json({ error: "Failed to fetch entry." });
  }
};

// POST /api/admin/bot-knowledge
const createKnowledge = async (req, res) => {
  const { topic, question, answer, category, tags, isActive } = req.body;

  if (!question || !answer) {
    return res.status(400).json({ error: "question and answer are required." });
  }

  try {
    const entry = await BotKnowledge.create({
      topic: topic || "",
      question,
      answer,
      category: category || "other",
      tags: tags || [],
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user._id,
    });

    await logAdminAction({
      adminId: req.user._id,
      action: "create",
      entity: "bot_knowledge",
      entityId: entry._id,
      changes: { topic: entry.topic, question: entry.question.slice(0, 80) },
    });

    res.status(201).json(entry);
  } catch (err) {
    console.error("createKnowledge error:", err);
    res.status(500).json({ error: "Failed to create entry." });
  }
};

// PUT /api/admin/bot-knowledge/:id
const updateKnowledge = async (req, res) => {
  const { topic, question, answer, category, tags, isActive } = req.body;

  try {
    const entry = await BotKnowledge.findById(req.params.id);
    if (!entry) return res.status(404).json({ error: "Entry not found." });

    const changes = {};
    if (topic !== undefined && entry.topic !== topic) {
      changes.topic = { from: entry.topic, to: topic };
      entry.topic = topic;
    }
    if (question !== undefined && entry.question !== question) {
      changes.question = { from: entry.question.slice(0, 80), to: question.slice(0, 80) };
      entry.question = question;
    }
    if (answer !== undefined && entry.answer !== answer) {
      changes.answerUpdated = true;
      entry.answer = answer;
    }
    if (category !== undefined && entry.category !== category) {
      changes.category = { from: entry.category, to: category };
      entry.category = category;
    }
    if (tags !== undefined) {
      if (JSON.stringify(entry.tags) !== JSON.stringify(tags)) {
        changes.tags = { from: entry.tags, to: tags };
      }
      entry.tags = tags;
    }
    if (isActive !== undefined && entry.isActive !== isActive) {
      changes.isActive = { from: entry.isActive, to: isActive };
      entry.isActive = isActive;
    }

    await entry.save();

    if (Object.keys(changes).length > 0) {
      await logAdminAction({
        adminId: req.user._id,
        action: "update",
        entity: "bot_knowledge",
        entityId: entry._id,
        changes,
      });
    }

    res.json(entry);
  } catch (err) {
    console.error("updateKnowledge error:", err);
    res.status(500).json({ error: "Failed to update entry." });
  }
};

// DELETE /api/admin/bot-knowledge/:id
const deleteKnowledge = async (req, res) => {
  try {
    const entry = await BotKnowledge.findByIdAndDelete(req.params.id);
    if (!entry) return res.status(404).json({ error: "Entry not found." });

    await logAdminAction({
      adminId: req.user._id,
      action: "delete",
      entity: "bot_knowledge",
      entityId: entry._id,
      changes: { deletedQuestion: entry.question.slice(0, 80) },
    });

    res.json({ message: "Entry deleted.", entry });
  } catch (err) {
    console.error("deleteKnowledge error:", err);
    res.status(500).json({ error: "Failed to delete entry." });
  }
};

// POST /api/admin/bot-knowledge/bulk-import
const bulkImport = async (req, res) => {
  const { entries } = req.body;

  if (!Array.isArray(entries) || entries.length === 0) {
    return res.status(400).json({ error: "entries array is required with at least one item." });
  }

  // Validate each entry
  for (let i = 0; i < entries.length; i++) {
    if (!entries[i].question || !entries[i].answer) {
      return res.status(400).json({
        error: `Entry at index ${i} is missing required 'question' or 'answer'.`,
      });
    }
  }

  try {
    const docs = entries.map((e) => ({
      topic: e.topic || "",
      question: e.question,
      answer: e.answer,
      category: e.category || "other",
      tags: e.tags || [],
      isActive: e.isActive !== undefined ? e.isActive : true,
      createdBy: req.user._id,
    }));

    const created = await BotKnowledge.insertMany(docs);

    await logAdminAction({
      adminId: req.user._id,
      action: "create",
      entity: "bot_knowledge",
      changes: { bulkImport: true, count: created.length },
    });

    res.status(201).json({ message: `${created.length} entries imported.`, count: created.length });
  } catch (err) {
    console.error("bulkImport error:", err);
    res.status(500).json({ error: "Failed to import entries." });
  }
};

// POST /api/admin/bot-knowledge/test — returns answer from local knowledge base
const testKnowledge = async (req, res) => {
  const { question } = req.body;

  if (!question) {
    return res.status(400).json({ error: "question is required." });
  }

  try {
    const answer = await getAnswer(question.trim());
    res.json({ question, answer });
  } catch (err) {
    console.error("testKnowledge error:", err);
    res.status(500).json({ error: "Failed to test knowledge." });
  }
};

module.exports = { listKnowledge, getKnowledge, createKnowledge, updateKnowledge, deleteKnowledge, bulkImport, testKnowledge };
