const { Router } = require("express");
const ritualController = require("../controllers/ritualController");

const router = Router();

// Public — no auth required
router.get("/:type", ritualController.getRitualsByType);

module.exports = router;
