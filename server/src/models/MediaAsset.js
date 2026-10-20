const mongoose = require("mongoose");

const mediaAssetSchema = new mongoose.Schema(
  {
    publicId: {
      type: String,
      required: true,
      unique: true,
    },
    url: {
      type: String,
      required: true,
    },
    secureUrl: {
      type: String,
      default: "",
    },
    resourceType: {
      type: String,
      required: true,
      enum: ["image", "video", "raw"], // Cloudinary resource types; audio→raw
    },
    format: {
      type: String,
      default: "",
    },
    bytes: {
      type: Number,
      default: 0,
    },
    originalName: {
      type: String,
      default: "",
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    usedIn: [
      {
        collection: { type: String },
        docId: { type: mongoose.Schema.Types.ObjectId },
      },
    ],
  },
  {
    timestamps: true,
  }
);

mediaAssetSchema.index({ resourceType: 1, createdAt: -1 });
mediaAssetSchema.index({ tags: 1 });
mediaAssetSchema.index({ originalName: "text" });

module.exports = mongoose.model("MediaAsset", mediaAssetSchema);
