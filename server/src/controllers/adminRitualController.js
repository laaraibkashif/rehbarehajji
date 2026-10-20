const RitualStep = require("../models/RitualStep");
const RitualPlan = require("../models/RitualPlan");
const { logAdminAction } = require("../utils/auditLogger");

// GET /api/admin/rituals?type=hajj|umrah
const getAllSteps = async (req, res) => {
  const { type } = req.query;
  const filter = {};
  if (type && ["hajj", "umrah"].includes(type)) {
    filter.ritualType = type;
  }

  try {
    const steps = await RitualStep.find(filter).sort({ ritualType: 1, order: 1 });
    res.json({ count: steps.length, steps });
  } catch (err) {
    console.error("getAllSteps error:", err);
    res.status(500).json({ error: "Failed to fetch ritual steps." });
  }
};

// GET /api/admin/rituals/:id
const getStep = async (req, res) => {
  try {
    const step = await RitualStep.findById(req.params.id);
    if (!step) return res.status(404).json({ error: "Step not found." });
    res.json(step);
  } catch (err) {
    console.error("getStep error:", err);
    res.status(500).json({ error: "Failed to fetch ritual step." });
  }
};

// POST /api/admin/rituals
const createStep = async (req, res) => {
  const { ritualType, order, name, description, location, mediaUrls, commonErrors } = req.body;

  if (!ritualType || !["hajj", "umrah"].includes(ritualType)) {
    return res.status(400).json({ error: "Valid ritualType ('hajj' or 'umrah') is required." });
  }
  if (!name || !description || !location) {
    return res.status(400).json({ error: "name, description, and location are required." });
  }
  if (order === undefined || order === null) {
    return res.status(400).json({ error: "order is required." });
  }

  try {
    const step = await RitualStep.create({
      ritualType,
      order: Number(order),
      name,
      description,
      location,
      mediaUrls: {
        image: mediaUrls?.image || "",
        video: mediaUrls?.video || "",
        audioDua: mediaUrls?.audioDua || "",
      },
      commonErrors: commonErrors || [],
    });

    await logAdminAction({
      adminId: req.user._id,
      action: "create",
      entity: "ritual_step",
      entityId: step._id,
      changes: { name: step.name, ritualType: step.ritualType, order: step.order },
    });

    res.status(201).json(step);
  } catch (err) {
    console.error("createStep error:", err);
    res.status(500).json({ error: "Failed to create ritual step." });
  }
};

// PUT /api/admin/rituals/:id
const updateStep = async (req, res) => {
  const { ritualType, order, name, description, location, mediaUrls, commonErrors } = req.body;

  try {
    const step = await RitualStep.findById(req.params.id);
    if (!step) return res.status(404).json({ error: "Step not found." });

    const changes = {};

    if (ritualType) {
      if (!["hajj", "umrah"].includes(ritualType)) {
        return res.status(400).json({ error: "Invalid ritualType." });
      }
      if (step.ritualType !== ritualType) changes.ritualType = { from: step.ritualType, to: ritualType };
      step.ritualType = ritualType;
    }
    if (order !== undefined && order !== null) {
      if (step.order !== Number(order)) changes.order = { from: step.order, to: Number(order) };
      step.order = Number(order);
    }
    if (name !== undefined) {
      if (step.name !== name) changes.name = { from: step.name, to: name };
      step.name = name;
    }
    if (description !== undefined) {
      if (step.description !== description) changes.description = { from: step.description, to: description };
      step.description = description;
    }
    if (location !== undefined) {
      if (step.location !== location) changes.location = { from: step.location, to: location };
      step.location = location;
    }
    if (mediaUrls !== undefined) {
      const prev = { ...step.mediaUrls };
      step.mediaUrls = {
        image: mediaUrls.image ?? step.mediaUrls.image,
        video: mediaUrls.video ?? step.mediaUrls.video,
        audioDua: mediaUrls.audioDua ?? step.mediaUrls.audioDua,
      };
      if (JSON.stringify(prev) !== JSON.stringify(step.mediaUrls)) {
        changes.mediaUrls = { from: prev, to: { ...step.mediaUrls } };
      }
    }
    if (commonErrors !== undefined) {
      if (JSON.stringify(step.commonErrors) !== JSON.stringify(commonErrors)) {
        changes.commonErrors = { from: step.commonErrors, to: commonErrors };
      }
      step.commonErrors = commonErrors;
    }

    await step.save();

    if (Object.keys(changes).length > 0) {
      await logAdminAction({
        adminId: req.user._id,
        action: "update",
        entity: "ritual_step",
        entityId: step._id,
        changes,
      });
    }

    res.json(step);
  } catch (err) {
    console.error("updateStep error:", err);
    res.status(500).json({ error: "Failed to update ritual step." });
  }
};

// DELETE /api/admin/rituals/:id
const deleteStep = async (req, res) => {
  try {
    const step = await RitualStep.findById(req.params.id);
    if (!step) return res.status(404).json({ error: "Step not found." });

    // Check if any active plan references this step's name
    const inUse = await RitualPlan.countDocuments({
      "generatedSteps.stepName": step.name,
    });

    if (inUse > 0) {
      return res.status(409).json({
        error: `Cannot delete "${step.name}" — it is referenced by ${inUse} active ritual plan(s). Remove the step from those plans first.`,
      });
    }

    await RitualStep.findByIdAndDelete(req.params.id);

    await logAdminAction({
      adminId: req.user._id,
      action: "delete",
      entity: "ritual_step",
      entityId: step._id,
      changes: { deletedName: step.name, ritualType: step.ritualType },
    });

    res.json({ message: "Step deleted.", step });
  } catch (err) {
    console.error("deleteStep error:", err);
    res.status(500).json({ error: "Failed to delete ritual step." });
  }
};

// PATCH /api/admin/rituals/reorder
const reorderSteps = async (req, res) => {
  const { type, stepIds } = req.body;

  if (!type || !["hajj", "umrah"].includes(type)) {
    return res.status(400).json({ error: "Valid ritualType is required." });
  }
  if (!Array.isArray(stepIds)) {
    return res.status(400).json({ error: "stepIds array is required." });
  }

  try {
    const updates = stepIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id, ritualType: type },
        update: { $set: { order: index + 1 } },
      },
    }));
    await RitualStep.bulkWrite(updates);

    await logAdminAction({
      adminId: req.user._id,
      action: "update",
      entity: "ritual_step",
      changes: { reordered: true, ritualType: type, newOrder: stepIds },
    });

    const steps = await RitualStep.find({ ritualType: type }).sort({ order: 1 });
    res.json({ message: "Reorder successful.", steps });
  } catch (err) {
    console.error("reorderSteps error:", err);
    res.status(500).json({ error: "Failed to reorder steps." });
  }
};

module.exports = { getAllSteps, getStep, createStep, updateStep, deleteStep, reorderSteps };
