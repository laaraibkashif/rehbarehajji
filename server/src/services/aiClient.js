/**
 * aiClient — No external AI dependency.
 *
 * This module exists solely to provide a drop-in placeholder for an optional LLM
 * naturalization step.  It always returns `null`, which signals the caller
 * (`botService.answerQuestion`) to fall back to **extractive mode** — returning
 * the best-matching knowledge-base answer verbatim.
 *
 * No API keys, no HTTP calls, no external dependencies needed.
 * The bot works entirely off its own knowledge base.
 */

/**
 * Always returns null — no external AI is used.
 * The caller falls back to the best-matching knowledge-base entry.
 *
 * @returns {Promise<null>}
 */
async function naturalizeAnswer() {
  return null;
}

module.exports = { naturalizeAnswer };
