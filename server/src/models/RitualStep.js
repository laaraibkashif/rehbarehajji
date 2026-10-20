const mongoose = require("mongoose");

const ritualStepSchema = new mongoose.Schema(
  {
    ritualType: {
      type: String,
      required: true,
      enum: ["hajj", "umrah"],
    },
    order: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    mediaUrls: {
      image: { type: String, default: "" },
      video: { type: String, default: "" },
      audioDua: { type: String, default: "" },
    },
    commonErrors: [String],
  },
  { timestamps: true }
);

// Compound index for efficient lookups
ritualStepSchema.index({ ritualType: 1, order: 1 });

module.exports = mongoose.model("RitualStep", ritualStepSchema);
