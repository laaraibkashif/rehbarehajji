const { Router } = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const tawafController = require("../controllers/tawafController");

const router = Router();

// All tawaf routes require authentication
router.use(authMiddleware);

router.get("/:userId", tawafController.getCount);
router.post("/:userId/increment", tawafController.incrementCount);
router.patch("/:userId/reset", tawafController.resetCount);

module.exports = router;
