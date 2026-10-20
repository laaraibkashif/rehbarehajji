/**
 * botService — Core business logic for the custom-trainable chatbot.
 *
 * This is the single service that both the admin training API and the
 * public chat API call.  It depends on:
 *   - KnowledgeEntry model  (the training data)
 *   - BotConfig model       (system prompt, thresholds, etc.)
 *   - ChatLog model         (conversation logging)
 *   - textSearch library    (dependency-free TF-IDF retrieval)
 *   - aiClient              (optional LLM wrapper; returns null on failure)
 *
 * The key function is `answerQuestion()` which implements the retrieval-
 * grounded pipeline: retrieve → threshold → (LLM naturalize or extractive
 * fallback) → log → return.
 */

const KnowledgeEntry = require("../models/KnowledgeEntry");
const BotConfig = require("../models/BotConfig");
const ChatLog = require("../models/ChatLog");
const { search } = require("../lib/textSearch");
const { naturalizeAnswer } = require("./aiClient");

// ── CRUD for Knowledge Entries ──

/**
 * Create a single knowledge entry.
 * Validates that question and answer are present.
 *
 * @param {{ topic, question, answer, category, tags, createdBy }} data
 * @returns {Promise<Object>} The saved document
 */
async function trainEntry({ topic, question, answer, category, tags, createdBy }) {
  if (!question || !answer) {
    throw new Error("question and answer are required.");
  }

  return KnowledgeEntry.create({
    topic: topic || "",
    question: question.trim(),
    answer,
    category: category || "other",
    tags: tags || [],
    isActive: true,
    createdBy: createdBy || null,
  });
}

/**
 * Bulk-create knowledge entries.
 * Each entry must have at least question and answer.
 *
 * @param {Array<{ topic, question, answer, category, tags }>} entries
 * @returns {Promise<{ inserted: number, errors: Array<{ index, message }> }>}
 */
async function bulkTrain(entries) {
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new Error("entries array is required with at least one item.");
  }

  const docs = [];
  const errors = [];

  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    if (!e.question || !e.answer) {
      errors.push({ index: i, message: "Missing required 'question' or 'answer'." });
      continue;
    }
    docs.push({
      topic: e.topic || "",
      question: e.question.trim(),
      answer: e.answer,
      category: e.category || "other",
      tags: e.tags || [],
      isActive: e.isActive !== undefined ? e.isActive : true,
      createdBy: e.createdBy || null,
    });
  }

  let inserted = 0;
  if (docs.length > 0) {
    const created = await KnowledgeEntry.insertMany(docs);
    inserted = created.length;
  }

  return { inserted, errors };
}

/**
 * Update a knowledge entry by ID.
 *
 * @param {string} id
 * @param {Object} updates - Fields to update (question, answer, topic, category, tags, isActive)
 * @returns {Promise<Object>} The updated document
 */
async function updateEntry(id, updates) {
  const entry = await KnowledgeEntry.findById(id);
  if (!entry) {
    throw new Error("Knowledge entry not found.");
  }

  const allowed = ["topic", "question", "answer", "category", "tags", "isActive"];
  for (const field of allowed) {
    if (updates[field] !== undefined) {
      entry[field] = field === "question" ? updates[field].trim() : updates[field];
    }
  }

  return entry.save();
}

/**
 * Delete a knowledge entry by ID.
 *
 * @param {string} id
 * @returns {Promise<Object>} The deleted document
 */
async function deleteEntry(id) {
  const entry = await KnowledgeEntry.findByIdAndDelete(id);
  if (!entry) {
    throw new Error("Knowledge entry not found.");
  }
  return entry;
}

/**
 * List knowledge entries with optional filters.
 *
 * @param {{ category?: string, search?: string, isActive?: boolean, page?: number, limit?: number }} opts
 * @returns {Promise<{ entries: Object[], total: number }>}
 */
async function listEntries(opts = {}) {
  const { category, search: searchText, isActive, page = 1, limit = 50 } = opts;
  const filter = {};

  if (category && ["ritual", "ihram", "dua", "logistics", "emergency", "other"].includes(category)) {
    filter.category = category;
  }
  if (isActive !== undefined) {
    filter.isActive = isActive;
  }

  let query = KnowledgeEntry.find(filter).sort({ createdAt: -1 });

  let countFilter = filter;

  if (searchText) {
    const textFilter = { $text: { $search: searchText } };
    query = KnowledgeEntry.find(
      { ...filter, ...textFilter },
      { score: { $meta: "textScore" } }
    ).sort({ score: { $meta: "textScore" } });
    countFilter = { ...filter, ...textFilter };
  }

  const skip = (page - 1) * limit;
  const [entries, total] = await Promise.all([
    query.skip(skip).limit(limit).lean(),
    KnowledgeEntry.countDocuments(countFilter),
  ]);

  return { entries, total };
}

// ── Config ──

/**
 * Get the singleton BotConfig document (creates default if none exists).
 *
 * @returns {Promise<Object>}
 */
async function getConfig() {
  return BotConfig.getSingleton();
}

/**
 * Update BotConfig fields.
 * Only updates the fields that are provided.
 *
 * @param {{ systemPrompt?, model?, temperature?, fallbackMessage?, matchThreshold? }} updates
 * @returns {Promise<Object>} The updated config
 */
async function updateConfig(updates) {
  const config = await BotConfig.getSingleton();
  const allowed = ["systemPrompt", "model", "temperature", "fallbackMessage", "matchThreshold"];

  for (const field of allowed) {
    if (updates[field] !== undefined) {
      config[field] = updates[field];
    }
  }

  await config.save();
  return config;
}

// ── Core Pipeline ──

/**
 * Answer a question using the retrieval-grounded pipeline.
 *
 * Pipeline steps:
 *   1. Load all active KnowledgeEntry documents + BotConfig.
 *   2. Run textSearch.search(question, entries, 5) — TF-IDF retrieval.
 *   3. If no matches or best score < config.matchThreshold:
 *        → Log ChatLog with usedFallback=true.
 *        → Return { answer: config.fallbackMessage, matched: [], usedFallback: true }.
 *   4. Take all matches >= matchThreshold, call aiClient.naturalizeAnswer().
 *   5. If LLM returns text → mode='llm-grounded'.
 *      If LLM returns null  → use best match's answer verbatim → mode='extractive'.
 *   6. Log ChatLog with matched entry IDs and usedFallback=false.
 *   7. Return { answer, matched: [...], usedFallback: false, mode }.
 *
 * This function never calls an LLM without grounding in retrieved content,
 * and never returns a confident-sounding answer when nothing matched — it
 * uses the configured fallbackMessage instead.
 *
 * @param {{ question: string, userId?: string }} params
 * @returns {Promise<{ answer: string, matched: Array<{ id: string, question: string, score: number }>, usedFallback: boolean, mode?: string }>}
 */
async function answerQuestion({ question, userId }) {
  // ── 1. Load active entries + config ──
  const [entries, config] = await Promise.all([
    KnowledgeEntry.find({ isActive: true }).select("topic question answer category tags").lean(),
    getConfig(),
  ]);

  // ── 2. TF-IDF retrieval ──
  const results = search(question, entries, 5);

  // ── 3. Threshold check ──
  const threshold = config.matchThreshold ?? 0.12;
  const aboveThreshold = results.filter((r) => r.score >= threshold);

  if (aboveThreshold.length === 0) {
    // No strong match — log fallback and return configured message
    const fallbackAnswer = config.fallbackMessage ||
      "I don't have a trained answer for that yet. Please try rephrasing your question.";

    // Log (non-blocking)
    ChatLog.create({
      userId: userId || null,
      question,
      answer: fallbackAnswer,
      matchedIds: [],
      usedFallback: true,
    }).catch(() => {});

    return {
      answer: fallbackAnswer,
      matched: [],
      usedFallback: true,
    };
  }

  // ── 4. LLM naturalization (optional) ──
  const matchedContext = aboveThreshold.map((r) => ({
    question: r.entry.question,
    answer: r.entry.answer,
  }));

  const llmResult = await naturalizeAnswer({
    systemPrompt: config.systemPrompt,
    model: config.model,
    temperature: config.temperature,
    question,
    matchedContext,
  });

  let finalAnswer;
  let mode;

  if (llmResult !== null) {
    // LLM returned a grounded answer
    finalAnswer = llmResult;
    mode = "llm-grounded";
  } else {
    // LLM unavailable — use the best match verbatim
    finalAnswer = aboveThreshold[0].entry.answer;
    mode = "extractive";
  }

  // ── 5. Build matched metadata ──
  const matched = aboveThreshold.map((r) => ({
    id: r.entry._id,
    question: r.entry.question,
    score: r.score,
  }));

  // ── 6. Log the interaction (non-blocking) ──
  ChatLog.create({
    userId: userId || null,
    question,
    answer: finalAnswer,
    matchedIds: matched.map((m) => m.id),
    usedFallback: false,
  }).catch(() => {});

  // ── 7. Return ──
  return {
    answer: finalAnswer,
    matched,
    usedFallback: false,
    mode,
  };
}

module.exports = {
  trainEntry,
  bulkTrain,
  updateEntry,
  deleteEntry,
  listEntries,
  getConfig,
  updateConfig,
  answerQuestion,
};
