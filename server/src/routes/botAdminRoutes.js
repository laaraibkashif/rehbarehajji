const { Router } = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/requireAdmin");
const ctrl = require("../controllers/botAdminController");

const router = Router();

// All routes require authentication + admin role
router.use(authMiddleware, requireAdmin);

// ── Knowledge Entries ──
router.get("/knowledge", ctrl.listEntries);
router.post("/knowledge", ctrl.createEntry);
router.post("/knowledge/bulk", ctrl.bulkImport);
router.patch("/knowledge/:id", ctrl.updateEntry);
router.delete("/knowledge/:id", ctrl.deleteEntry);

// ── Config ──
router.get("/config", ctrl.getConfig);
router.patch("/config", ctrl.updateConfig);

// ── Test ──
router.post("/test", ctrl.testAnswer);

// ── Chat Logs ──
router.get("/logs", ctrl.getLogs);

module.exports = router;
