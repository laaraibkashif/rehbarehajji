const EmergencyContact = require("../models/EmergencyContact");
const { logAdminAction } = require("../utils/auditLogger");

// GET /api/admin/emergency?category=
const listContacts = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = {};
    if (category && ["medical", "helpline", "embassy"].includes(category)) {
      filter.category = category;
    }

    const contacts = await EmergencyContact.find(filter).sort({ category: 1, region: 1 });
    res.json({ count: contacts.length, contacts });
  } catch (err) {
    console.error("listContacts error:", err);
    res.status(500).json({ error: "Failed to fetch contacts." });
  }
};

// GET /api/admin/emergency/:id
const getContact = async (req, res) => {
  try {
    const contact = await EmergencyContact.findById(req.params.id);
    if (!contact) return res.status(404).json({ error: "Contact not found." });
    res.json(contact);
  } catch (err) {
    console.error("getContact error:", err);
    res.status(500).json({ error: "Failed to fetch contact." });
  }
};

// POST /api/admin/emergency
const createContact = async (req, res) => {
  const { name, category, phoneNumber, region } = req.body;

  if (!name || !category || !phoneNumber) {
    return res.status(400).json({ error: "name, category, and phoneNumber are required." });
  }
  if (!["medical", "helpline", "embassy"].includes(category)) {
    return res.status(400).json({ error: "category must be 'medical', 'helpline', or 'embassy'." });
  }

  try {
    const contact = await EmergencyContact.create({
      name: name.trim(),
      category,
      phoneNumber: phoneNumber.trim(),
      region: region?.trim() || "",
    });

    await logAdminAction({
      adminId: req.user._id,
      action: "create",
      entity: "emergency_contact",
      entityId: contact._id,
      changes: { name: contact.name, category: contact.category },
    });

    res.status(201).json(contact);
  } catch (err) {
    console.error("createContact error:", err);
    res.status(500).json({ error: "Failed to create contact." });
  }
};

// PUT /api/admin/emergency/:id
const updateContact = async (req, res) => {
  const { name, category, phoneNumber, region } = req.body;

  try {
    const contact = await EmergencyContact.findById(req.params.id);
    if (!contact) return res.status(404).json({ error: "Contact not found." });

    const changes = {};
    if (name !== undefined && contact.name !== name) {
      changes.name = { from: contact.name, to: name };
      contact.name = name.trim();
    }
    if (category !== undefined) {
      if (!["medical", "helpline", "embassy"].includes(category)) {
        return res.status(400).json({ error: "Invalid category." });
      }
      if (contact.category !== category) changes.category = { from: contact.category, to: category };
      contact.category = category;
    }
    if (phoneNumber !== undefined && contact.phoneNumber !== phoneNumber) {
      changes.phoneNumber = { from: contact.phoneNumber, to: phoneNumber };
      contact.phoneNumber = phoneNumber.trim();
    }
    if (region !== undefined && contact.region !== region) {
      changes.region = { from: contact.region, to: region };
      contact.region = region.trim();
    }

    await contact.save();

    if (Object.keys(changes).length > 0) {
      await logAdminAction({
        adminId: req.user._id,
        action: "update",
        entity: "emergency_contact",
        entityId: contact._id,
        changes,
      });
    }

    res.json(contact);
  } catch (err) {
    console.error("updateContact error:", err);
    res.status(500).json({ error: "Failed to update contact." });
  }
};

// DELETE /api/admin/emergency/:id
const deleteContact = async (req, res) => {
  try {
    const contact = await EmergencyContact.findByIdAndDelete(req.params.id);
    if (!contact) return res.status(404).json({ error: "Contact not found." });

    await logAdminAction({
      adminId: req.user._id,
      action: "delete",
      entity: "emergency_contact",
      entityId: contact._id,
      changes: { deletedName: contact.name },
    });

    res.json({ message: "Contact deleted.", contact });
  } catch (err) {
    console.error("deleteContact error:", err);
    res.status(500).json({ error: "Failed to delete contact." });
  }
};

module.exports = { listContacts, getContact, createContact, updateContact, deleteContact };
