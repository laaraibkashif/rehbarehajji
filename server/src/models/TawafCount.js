const mongoose = require("mongoose");

const tawafCountSchema = new mongoose.Schema(
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
      enum: ["tawaf", "sai"],
    },
    count: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Compound index so each user has one doc per type
tawafCountSchema.index({ userId: 1, type: 1 }, { unique: true });

module.exports = mongoose.model("TawafCount", tawafCountSchema);
