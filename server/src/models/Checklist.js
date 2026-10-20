const mongoose = require("mongoose");

const checklistItemSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    isChecked: { type: Boolean, default: false },
    group: { type: String, default: "" },
  },
  { _id: true }
);

const checklistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["preparation", "ritual"],
    },
    items: [checklistItemSchema],
  },
  { timestamps: true }
);

// Compound index so each user has one doc per type
checklistSchema.index({ userId: 1, type: 1 }, { unique: true });

module.exports = mongoose.model("Checklist", checklistSchema);
