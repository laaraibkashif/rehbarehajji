const mongoose = require("mongoose");

const chatLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    question: {
      type: String,
      required: true,
    },
    answer: {
      type: String,
      required: true,
    },
    matchedIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "KnowledgeEntry",
      default: [],
    },
    usedFallback: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ChatLog", chatLogSchema);
