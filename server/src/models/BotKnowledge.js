const mongoose = require("mongoose");

const botKnowledgeSchema = new mongoose.Schema(
  {
    topic: {
      type: String,
      trim: true,
      default: "",
    },
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answer: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["ritual", "ihram", "dua", "logistics", "emergency", "other"],
      default: "other",
    },
    tags: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

// Text index for MongoDB $text search — used by the RAG retrieval step.
// At query time we search on topic, question, answer, and tags fields.
// NOTE: This can be upgraded to embedding-based retrieval (e.g. Atlas Vector Search)
//       when the knowledge base grows beyond a few thousand entries. For the current
//       scale a full-text search is fast, reliable, and needs no additional infrastructure.
botKnowledgeSchema.index(
  { topic: "text", question: "text", answer: "text", tags: "text" },
  { weights: { topic: 10, question: 8, tags: 5, answer: 3 } }
);

botKnowledgeSchema.index({ category: 1, isActive: 1 });

module.exports = mongoose.model("BotKnowledge", botKnowledgeSchema);
