const { Router } = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const userController = require("../controllers/userController");

const router = Router();

// All user routes require authentication
router.use(authMiddleware);

router.patch("/:userId/language", userController.updateLanguage);

module.exports = router;
