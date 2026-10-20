const { Router } = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const dashboardController = require("../controllers/dashboardController");

const router = Router();

// All dashboard routes require authentication
router.use(authMiddleware);

router.get("/:userId", dashboardController.getDashboard);

module.exports = router;
