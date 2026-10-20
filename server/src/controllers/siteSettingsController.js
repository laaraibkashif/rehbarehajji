const SiteSettings = require("../models/SiteSettings");
const { logAdminAction } = require("../utils/auditLogger");

// ── Helpers ──
const HEX_COLOR_RE = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
const URL_RE = /^(https?:\/\/|\/\/)/;

function validateHexColor(value, fieldName) {
  if (value && !HEX_COLOR_RE.test(value)) {
    return `${fieldName} must be a valid hex color (e.g. #2F5233).`;
  }
  return null;
}

function validateUrl(value, fieldName) {
  if (value && !URL_RE.test(value)) {
    return `${fieldName} must be a valid URL (starting with http:// or https://).`;
  }
  return null;
}

// GET /api/settings — public, no auth
const getSettings = async (_req, res) => {
  try {
    const settings = await SiteSettings.getSettings();
    res.json(settings);
  } catch (err) {
    console.error("getSettings error:", err);
    res.status(500).json({ error: "Failed to fetch settings." });
  }
};

// PATCH /api/admin/settings — requireAdmin
const updateSettings = async (req, res) => {
  const {
    logoUrl, faviconUrl, siteName, tagline,
    primaryColor, accentColor,
    supportEmail, supportPhone,
    socialLinks,
  } = req.body;

  // Validate hex colors
  const colorErr1 = validateHexColor(primaryColor, "primaryColor");
  if (colorErr1) return res.status(400).json({ error: colorErr1 });
  const colorErr2 = validateHexColor(accentColor, "accentColor");
  if (colorErr2) return res.status(400).json({ error: colorErr2 });

  // Validate URLs
  const urlErr1 = validateUrl(logoUrl, "logoUrl");
  if (urlErr1) return res.status(400).json({ error: urlErr1 });
  const urlErr2 = validateUrl(faviconUrl, "faviconUrl");
  if (urlErr2) return res.status(400).json({ error: urlErr2 });

  if (socialLinks) {
    for (const [key, val] of Object.entries(socialLinks)) {
      if (val) {
        const err = validateUrl(val, `socialLinks.${key}`);
        if (err) return res.status(400).json({ error: err });
      }
    }
  }

  try {
    // Upsert: findOneAndUpdate with upsert to enforce singleton
    const settings = await SiteSettings.findOneAndUpdate(
      {},
      {
        $set: {
          ...(logoUrl !== undefined && { logoUrl }),
          ...(faviconUrl !== undefined && { faviconUrl }),
          ...(siteName !== undefined && { siteName }),
          ...(tagline !== undefined && { tagline }),
          ...(primaryColor !== undefined && { primaryColor }),
          ...(accentColor !== undefined && { accentColor }),
          ...(supportEmail !== undefined && { supportEmail }),
          ...(supportPhone !== undefined && { supportPhone }),
          ...(socialLinks !== undefined && { socialLinks }),
          updatedBy: req.user._id,
        },
      },
      { upsert: true, new: true }
    );

    await logAdminAction({
      adminId: req.user._id,
      action: "update",
      entity: "site_settings",
      entityId: settings._id,
      changes: { updated: true, fields: Object.keys(req.body) },
    });

    res.json(settings);
  } catch (err) {
    console.error("updateSettings error:", err);
    res.status(500).json({ error: "Failed to update settings." });
  }
};

module.exports = { getSettings, updateSettings };
