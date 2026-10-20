const mongoose = require("mongoose");

const emergencyContactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["medical", "helpline", "embassy"],
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    region: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

emergencyContactSchema.index({ category: 1 });

module.exports = mongoose.model("EmergencyContact", emergencyContactSchema);
