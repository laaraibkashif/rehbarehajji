const { Router } = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const checklistController = require("../controllers/checklistController");

const router = Router();

// All checklist routes require authentication
router.use(authMiddleware);

router.get("/:userId", checklistController.getChecklist);
router.patch("/:userId", checklistController.updateChecklist);

module.exports = router;
