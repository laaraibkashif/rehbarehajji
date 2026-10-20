const { Router } = require("express");
const emergencyController = require("../controllers/emergencyController");

const router = Router();

// Public route — no authentication required
router.get("/", emergencyController.getContacts);

module.exports = router;
