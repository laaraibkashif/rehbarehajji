const mongoose = require("mongoose");

const planStepSchema = new mongoose.Schema(
  {
    stepName: { type: String, required: true },
    date: { type: String, default: "" },
    notes: { type: String, default: "" },
  },
  { _id: false }
);

const ritualPlanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    ritualType: {
      type: String,
      required: true,
      enum: ["hajj", "umrah"],
    },
    ageGroup: {
      type: String,
      required: true,
      enum: ["child", "adult", "senior"],
    },
    healthCondition: {
      type: String,
      default: "",
    },
    travelMode: {
      type: String,
      required: true,
      enum: ["solo", "group"],
    },
    generatedSteps: [planStepSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("RitualPlan", ritualPlanSchema);
