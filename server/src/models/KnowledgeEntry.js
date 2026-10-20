const mongoose = require("mongoose");

const knowledgeEntrySchema = new mongoose.Schema(
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

// MongoDB text index across topic, question, answer, and tags for full-text search.
// Weights: topic and question are most important, tags next, answer least (it's the longest).
knowledgeEntrySchema.index(
  { topic: "text", question: "text", answer: "text", tags: "text" },
  { weights: { topic: 10, question: 8, tags: 5, answer: 3 } }
);

knowledgeEntrySchema.index({ category: 1, isActive: 1 });

module.exports = mongoose.model("KnowledgeEntry", knowledgeEntrySchema);
