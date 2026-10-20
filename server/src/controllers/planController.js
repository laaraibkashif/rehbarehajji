const RitualPlan = require("../models/RitualPlan");
const RitualStep = require("../models/RitualStep");

// ── Generate personalised notes based on profile ──

function buildNotes(stepName, { ageGroup, healthCondition, travelMode }) {
  const notes = [];

  // Age-based notes
  if (ageGroup === "senior") {
    notes.push(
      "Allow extra time for rest breaks between stages. Stay hydrated and avoid peak sun hours."
    );
  }
  if (ageGroup === "child") {
    notes.push(
      "Keep the child close at all times. Ensure they have a visible ID bracelet and know meeting points."
    );
  }

  // Health-based notes
  if (healthCondition && healthCondition.length > 0) {
    const lower = healthCondition.toLowerCase();
    if (
      lower.includes("mobility") ||
      lower.includes("wheelchair") ||
      lower.includes("walking difficulty")
    ) {
      notes.push(
        "Wheelchair-accessible routes are available. Contact your group organiser for priority access and assistance."
      );
    }
    if (
      lower.includes("heart") ||
      lower.includes("cardiac") ||
      lower.includes("blood pressure") ||
      lower.includes("asthma") ||
      lower.includes("respiratory")
    ) {
      notes.push(
        "Avoid strenuous activity in the heat. Keep medication accessible and inform your group leader of your condition."
      );
    }
    if (
      lower.includes("diabetes") ||
      lower.includes("diabetic")
    ) {
      notes.push(
        "Carry glucose tablets or snacks. Monitor your energy levels and check feet for blisters after each day's rites."
      );
    }
  }

  // Travel-mode notes for specific steps
  if (travelMode === "solo" && stepName.toLowerCase().includes("tawaf")) {
    notes.push(
      "Performing Tawaf solo? Join a circulating group to stay in rhythm and avoid getting pushed aside."
    );
  }
  if (travelMode === "group" && stepName.toLowerCase().includes("jamarat")) {
    notes.push(
      "Follow your group leader's designated stoning time slot to avoid extreme crowding at the Jamarat Bridge."
    );
  }

  return notes.length > 0 ? notes.join(" ") : "";
}

// ── Generate plan ──

const generatePlan = async (req, res) => {
  const { ritualType, ageGroup, healthCondition, travelMode } = req.body;
  const userId = req.user.userId;

  // Validate required fields
  if (!ritualType || !["hajj", "umrah"].includes(ritualType)) {
    return res
      .status(400)
      .json({ error: "Invalid or missing ritualType. Must be 'hajj' or 'umrah'." });
  }
  if (!ageGroup || !["child", "adult", "senior"].includes(ageGroup)) {
    return res
      .status(400)
      .json({ error: "Invalid or missing ageGroup. Must be 'child', 'adult', or 'senior'." });
  }
  if (!travelMode || !["solo", "group"].includes(travelMode)) {
    return res
      .status(400)
      .json({ error: "Invalid or missing travelMode. Must be 'solo' or 'group'." });
  }

  try {
    // Fetch matching ritual steps
    const steps = await RitualStep.find({ ritualType }).sort({ order: 1 });

    if (steps.length === 0) {
      return res.status(404).json({
        error: `No ritual steps found for ${ritualType}. Please run the seed script first.`,
      });
    }

    // Build personalised generatedSteps
    const profile = { ageGroup, healthCondition: healthCondition || "", travelMode };
    const generatedSteps = steps.map((step) => ({
      stepName: step.name,
      date: "",
      notes: buildNotes(step.name, profile),
    }));

    // Save the plan
    const plan = await RitualPlan.create({
      userId,
      ritualType,
      ageGroup,
      healthCondition: healthCondition || "",
      travelMode,
      generatedSteps,
    });

    res.status(201).json({ message: "Plan generated successfully.", plan });
  } catch (err) {
    console.error("generatePlan error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
};

// ── Get latest saved plan for a user ──

const getPlan = async (req, res) => {
  const { userId } = req.params;

  // Only allow users to fetch their own plan
  if (userId !== req.user.userId) {
    return res.status(403).json({ error: "You can only view your own plan." });
  }

  try {
    const plan = await RitualPlan.findOne({ userId }).sort({ createdAt: -1 });

    if (!plan) {
      return res.status(404).json({ error: "No plan found. Generate one first." });
    }

    res.json({ plan });
  } catch (err) {
    console.error("getPlan error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
};

module.exports = { generatePlan, getPlan };
