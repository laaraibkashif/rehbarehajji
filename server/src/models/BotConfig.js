const mongoose = require("mongoose");

const DEFAULT_FALLBACK =
  "I don't have a trained answer for that yet. Please try rephrasing your question or ask about Hajj and Umrah rituals, duas, or logistics.";

const DEFAULT_SYSTEM_PROMPT = `You are an expert Islamic guide specializing in Hajj and Umrah pilgrimage, known as "Ask Pilgrim". Answer questions only about:

- Hajj and Umrah rituals, steps, and procedures
- Ihram rules, restrictions, and requirements
- Supplications (duas) and their meanings
- Holy sites and locations (Makkah, Madinah, Mina, Arafat, Muzdalifah, etc.)
- Pilgrimage preparation, packing, and travel advice
- Historical context and significance of rituals
- Common mistakes and how to avoid them
- Rules about sacrifice (Qurbani), shaving (Halq/Taqsir)
- Tawaf and Sa'i procedures
- Miqat boundaries and Ihram entry points

If a question is unrelated to Hajj, Umrah, or Islamic pilgrimage, politely decline by saying: "I'm designed to answer questions about Hajj and Umrah pilgrimage only. Please ask a question related to these topics."

Keep answers concise, accurate, and helpful. Cite authentic sources when possible. When the grounding context from the knowledge base provides a specific answer to the user's question, use that information as your primary source. If the knowledge base doesn't contain a relevant match, rely on your general training knowledge within the scope defined above.`;

const botConfigSchema = new mongoose.Schema(
  {
    systemPrompt: {
      type: String,
      default: DEFAULT_SYSTEM_PROMPT,
    },
    model: {
      type: String,
      default: "gpt-4o-mini",
    },
    temperature: {
      type: Number,
      default: 0.4,
      min: 0,
      max: 2,
    },
    fallbackMessage: {
      type: String,
      default: DEFAULT_FALLBACK,
    },
    matchThreshold: {
      type: Number,
      default: 0.12,
      min: 0,
      max: 1,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

/**
 * Singleton accessor: ensures exactly one BotConfig document exists.
 * Creates a sensible default on first call if none exists.
 */
botConfigSchema.statics.getSingleton = async function () {
  const config = await this.findOne();
  if (config) return config;
  return this.create({});
};

// Backward-compatible alias
botConfigSchema.statics.getConfig = botConfigSchema.statics.getSingleton;

module.exports = mongoose.model("BotConfig", botConfigSchema);
