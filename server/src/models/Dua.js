const mongoose = require("mongoose");

const duaSchema = new mongoose.Schema(
  {
    ritualType: {
      type: String,
      enum: ["both", "hajj", "umrah"],
      default: "both",
    },
    relatedLocation: {
      type: String,
      default: "",
      trim: true,
    },
    relatedRitualStep: {
      type: String,
      default: "",
      trim: true,
    },
    textAr: {
      type: String,
      required: true,
    },
    textEn: {
      type: String,
      required: true,
    },
    textUr: {
      type: String,
      default: "",
    },
    audioUrl: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

duaSchema.index({ relatedLocation: 1 });
duaSchema.index({ relatedRitualStep: 1 });

module.exports = mongoose.model("Dua", duaSchema);