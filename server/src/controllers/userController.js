const User = require("../models/User");

const updateLanguage = async (req, res) => {
  const { userId } = req.params;
  const { preferredLanguage } = req.body;

  // Auth check
  if (userId !== req.user.userId) {
    return res.status(403).json({ error: "You can only update your own profile." });
  }

  // Validate language
  if (!preferredLanguage || !["en", "ar", "ur"].includes(preferredLanguage)) {
    return res.status(400).json({ error: "Invalid language. Must be 'en', 'ar', or 'ur'." });
  }

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { preferredLanguage },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    res.json({
      message: "Language preference updated.",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        preferredLanguage: user.preferredLanguage,
      },
    });
  } catch (err) {
    console.error("updateLanguage error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
};

module.exports = { updateLanguage };
