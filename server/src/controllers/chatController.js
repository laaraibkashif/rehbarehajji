const botService = require("../services/botService");

/**
 * POST /api/chat — public pilgrim-facing chat endpoint.
 *
 * Calls botService.answerQuestion() but returns ONLY the fields
 * that are safe for end users:
 *   { answer, usedFallback }
 *
 * Matched entry IDs and similarity scores are admin-only diagnostic
 * detail and are never leaked to pilgrims.
 */
const askQuestion = async (req, res) => {
  const { question } = req.body;

  if (!question || typeof question !== "string" || question.trim().length === 0) {
    return res.status(400).json({ error: "Question is required." });
  }

  try {
    const result = await botService.answerQuestion({
      question: question.trim(),
      userId: req.user?.userId || null,
    });

    // Return only public-safe fields
    res.json({
      answer: result.answer,
      usedFallback: result.usedFallback,
    });
  } catch (err) {
    console.error("[chatController] askQuestion error:", err);
    res.status(500).json({ error: "Unable to process your request. Please try again." });
  }
};

module.exports = { askQuestion };
