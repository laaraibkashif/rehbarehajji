const Dua = require("../models/Dua");
const { logAdminAction } = require("../utils/auditLogger");

// GET /api/admin/duas?search=&location=&ritualStep=
const listDuas = async (req, res) => {
  try {
    const { search, location, ritualStep } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { textAr: { $regex: search, $options: "i" } },
        { textEn: { $regex: search, $options: "i" } },
        { textUr: { $regex: search, $options: "i" } },
      ];
    }
    if (location) filter.relatedLocation = { $regex: location, $options: "i" };
    if (ritualStep) filter.relatedRitualStep = { $regex: ritualStep, $options: "i" };

    const duas = await Dua.find(filter).sort({ relatedRitualStep: 1, relatedLocation: 1 });
    res.json({ count: duas.length, duas });
  } catch (err) {
    console.error("listDuas error:", err);
    res.status(500).json({ error: "Failed to fetch duas." });
  }
};

// GET /api/admin/duas/:id
const getDua = async (req, res) => {
  try {
    const dua = await Dua.findById(req.params.id);
    if (!dua) return res.status(404).json({ error: "Dua not found." });
    res.json(dua);
  } catch (err) {
    console.error("getDua error:", err);
    res.status(500).json({ error: "Failed to fetch dua." });
  }
};

// POST /api/admin/duas
const createDua = async (req, res) => {
  const { ritualType, relatedLocation, relatedRitualStep, textAr, textEn, textUr, audioUrl } = req.body;

  if (!textAr || !textEn) {
    return res.status(400).json({ error: "textAr and textEn are required." });
  }

  try {
    const dua = await Dua.create({
      ritualType: ["hajj", "umrah", "both"].includes(ritualType) ? ritualType : "both",
      relatedLocation: relatedLocation || "",
      relatedRitualStep: relatedRitualStep || "",
      textAr,
      textEn,
      textUr: textUr || "",
      audioUrl: audioUrl || "",
    });

    await logAdminAction({
      adminId: req.user._id,
      action: "create",
      entity: "dua",
      entityId: dua._id,
      changes: { relatedRitualStep: dua.relatedRitualStep, relatedLocation: dua.relatedLocation },
    });

    res.status(201).json(dua);
  } catch (err) {
    console.error("createDua error:", err);
    res.status(500).json({ error: "Failed to create dua." });
  }
};

// PUT /api/admin/duas/:id
const updateDua = async (req, res) => {
  const { ritualType, relatedLocation, relatedRitualStep, textAr, textEn, textUr, audioUrl } = req.body;

  try {
    const dua = await Dua.findById(req.params.id);
    if (!dua) return res.status(404).json({ error: "Dua not found." });

    const changes = {};
    if (["hajj", "umrah", "both"].includes(ritualType)) {
      dua.ritualType = ritualType;
    }
    if (relatedLocation !== undefined && dua.relatedLocation !== relatedLocation) {
      changes.relatedLocation = { from: dua.relatedLocation, to: relatedLocation };
      dua.relatedLocation = relatedLocation;
    }
    if (relatedRitualStep !== undefined && dua.relatedRitualStep !== relatedRitualStep) {
      changes.relatedRitualStep = { from: dua.relatedRitualStep, to: relatedRitualStep };
      dua.relatedRitualStep = relatedRitualStep;
    }
    if (textAr !== undefined && dua.textAr !== textAr) {
      changes.textAr = { from: dua.textAr, to: textAr };
      dua.textAr = textAr;
    }
    if (textEn !== undefined && dua.textEn !== textEn) {
      changes.textEn = { from: dua.textEn, to: textEn };
      dua.textEn = textEn;
    }
    if (textUr !== undefined && dua.textUr !== textUr) {
      changes.textUr = { from: dua.textUr, to: textUr };
      dua.textUr = textUr;
    }
    if (audioUrl !== undefined && dua.audioUrl !== audioUrl) {
      changes.audioUrl = { from: dua.audioUrl, to: audioUrl };
      dua.audioUrl = audioUrl;
    }

    await dua.save();

    if (Object.keys(changes).length > 0) {
      await logAdminAction({
        adminId: req.user._id,
        action: "update",
        entity: "dua",
        entityId: dua._id,
        changes,
      });
    }

    res.json(dua);
  } catch (err) {
    console.error("updateDua error:", err);
    res.status(500).json({ error: "Failed to update dua." });
  }
};

// DELETE /api/admin/duas/:id
const deleteDua = async (req, res) => {
  try {
    const dua = await Dua.findByIdAndDelete(req.params.id);
    if (!dua) return res.status(404).json({ error: "Dua not found." });

    await logAdminAction({
      adminId: req.user._id,
      action: "delete",
      entity: "dua",
      entityId: dua._id,
      changes: { deletedRelatedRitualStep: dua.relatedRitualStep, deletedRelatedLocation: dua.relatedLocation },
    });

    res.json({ message: "Dua deleted.", dua });
  } catch (err) {
    console.error("deleteDua error:", err);
    res.status(500).json({ error: "Failed to delete dua." });
  }
};

module.exports = { listDuas, getDua, createDua, updateDua, deleteDua };