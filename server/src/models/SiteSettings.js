const mongoose = require("mongoose");

const siteSettingsSchema = new mongoose.Schema(
  {
    logoUrl: { type: String, default: "" },
    faviconUrl: { type: String, default: "" },
    siteName: { type: String, default: "Rehbar-e-Hajji" },
    tagline: { type: String, default: "Your Personal Pilgrimage Companion" },
    primaryColor: { type: String, default: "#2F5233" },
    accentColor: { type: String, default: "#B8863E" },
    supportEmail: { type: String, default: "" },
    supportPhone: { type: String, default: "" },
    socialLinks: {
      facebook: { type: String, default: "" },
      instagram: { type: String, default: "" },
      twitter: { type: String, default: "" },
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

// Singleton enforcement: always upsert on save
siteSettingsSchema.statics.getSettings = async function () {
  const settings = await this.findOne();
  if (settings) return settings;
  return this.create({});
};

module.exports = mongoose.model("SiteSettings", siteSettingsSchema);
