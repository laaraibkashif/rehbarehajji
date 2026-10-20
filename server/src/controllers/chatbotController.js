const { getAnswer } = require("../services/aiChatbotService");

/**
 * POST /api/chatbot/ask — legacy chatbot endpoint.
 *
 * Rewired to use botService.answerQuestion() internally, which handles
 * TF-IDF retrieval, threshold check, extractive mode, and ChatLog logging.
 * No external AI API required.
 */
const askQuestion = async (req, res) => {
  const { question } = req.body;

  if (!question || typeof question !== "string" || question.trim().length === 0) {
    return res.status(400).json({ error: "Question is required." });
  }

  try {
    const answer = await getAnswer(question.trim());
    res.json({ answer });
  } catch (err) {
    console.error("askQuestion error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
};

module.exports = { askQuestion };

