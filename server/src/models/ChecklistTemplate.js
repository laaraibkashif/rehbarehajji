const mongoose = require("mongoose");

const templateItemSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    group: { type: String, default: "" },
  },
  { _id: true }
);

const checklistTemplateSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["preparation", "ritual"],
      unique: true,
    },
    items: [templateItemSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("ChecklistTemplate", checklistTemplateSchema);
