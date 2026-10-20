const { Router } = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const planController = require("../controllers/planController");

const router = Router();

// All plan routes require authentication
router.use(authMiddleware);

router.post("/generate", planController.generatePlan);
router.get("/:userId", planController.getPlan);

module.exports = router;
