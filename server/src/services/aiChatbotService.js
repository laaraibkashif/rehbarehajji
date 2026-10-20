const botService = require("./botService");

/**
 * Answer a question using the local knowledge base only.
 *
 * Delegates to `botService.answerQuestion()` which runs the full
 * retrieval-grounded pipeline entirely locally:
 *   1. TF-IDF search against the KnowledgeEntry collection
 *   2. Threshold check against BotConfig.matchThreshold
 *   3. Extractive mode — returns the best-matching answer verbatim
 *   4. ChatLog logging
 *
 * No external AI API required.
 *
 * @param {string} question - The user's question
 * @returns {Promise<string>} The answer
 */
const getAnswer = async (question) => {
  try {
    const result = await botService.answerQuestion({
      question,
      userId: null,
    });
    return result.answer;
  } catch (err) {
    console.error("[aiChatbotService] error:", err.message);
    return "Unable to process your request. Please try again.";
  }
};

module.exports = { getAnswer };
