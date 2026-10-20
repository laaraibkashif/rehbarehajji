const EmergencyContact = require("../models/EmergencyContact");

const getContacts = async (req, res) => {
  const { category } = req.query;

  if (category && !["medical", "helpline", "embassy"].includes(category)) {
    return res
      .status(400)
      .json({ error: "Invalid category. Must be 'medical', 'helpline', or 'embassy'." });
  }

  try {
    const filter = category ? { category } : {};
    const contacts = await EmergencyContact.find(filter).sort({ region: 1, name: 1 });
    res.json({ count: contacts.length, contacts });
  } catch (err) {
    console.error("getContacts error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
};

module.exports = { getContacts };
