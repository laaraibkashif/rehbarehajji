const { Router } = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const adminRitualController = require("../controllers/adminRitualController");
const adminDashboardController = require("../controllers/adminDashboardController");
const adminUserController = require("../controllers/adminUserController");
const adminUploadController = require("../controllers/adminUploadController");
const mediaController = require("../controllers/mediaController");
const adminAnalyticsController = require("../controllers/adminAnalyticsController");
const adminDuasController = require("../controllers/adminDuasController");
const adminChecklistsController = require("../controllers/adminChecklistsController");
const adminEmergencyController = require("../controllers/adminEmergencyController");
const siteSettingsController = require("../controllers/siteSettingsController");
const adminBotKnowledgeController = require("../controllers/adminBotKnowledgeController");
const adminBotConfigController = require("../controllers/adminBotConfigController");

const router = Router();

// All routes require auth + admin
router.use(authMiddleware, adminMiddleware);

// ── Dashboard ──
router.get("/dashboard", adminDashboardController.getDashboard);

// ── Analytics ──
router.get("/analytics/summary", adminAnalyticsController.getSummary);
router.get("/analytics/users-growth", adminAnalyticsController.getUsersGrowth);
router.get("/analytics/plans-by-type", adminAnalyticsController.getPlansByType);
router.get("/analytics/ritual-engagement", adminAnalyticsController.getRitualEngagement);
router.get("/analytics/chatbot-usage", adminAnalyticsController.getChatbotUsage);

// ── Users ──
router.get("/users", adminUserController.getUsers);
router.get("/users/:id", adminUserController.getUser);
router.patch("/users/:id", adminUserController.updateUser);
router.delete("/users/:id", adminUserController.deleteUser);

// ── File upload (legacy local) ──
router.post("/upload", adminUploadController.upload.single("file"), adminUploadController.uploadFile);
router.delete("/upload", adminUploadController.deleteFile);

// ── Media Library (Cloudinary) ──
router.get("/media", mediaController.listAssets);
router.post("/media", mediaController.upload.single("file"), mediaController.uploadAsset);
router.delete("/media/:id", mediaController.deleteAsset);

// ── Ritual Steps (explicit paths before parameterized) ──
router.patch("/rituals/reorder", adminRitualController.reorderSteps);

router.get("/rituals", adminRitualController.getAllSteps);
router.get("/rituals/:id", adminRitualController.getStep);
router.post("/rituals", adminRitualController.createStep);
router.put("/rituals/:id", adminRitualController.updateStep);
router.delete("/rituals/:id", adminRitualController.deleteStep);

// ── Duas ──
router.get("/duas", adminDuasController.listDuas);
router.get("/duas/:id", adminDuasController.getDua);
router.post("/duas", adminDuasController.createDua);
router.put("/duas/:id", adminDuasController.updateDua);
router.delete("/duas/:id", adminDuasController.deleteDua);

// ── Checklist Templates ──
router.get("/checklists/templates/:type", adminChecklistsController.getTemplate);
router.put("/checklists/templates/:type", adminChecklistsController.updateTemplate);
router.patch("/checklists/templates/:type/reorder", adminChecklistsController.reorderItems);

// ── Emergency Contacts ──
router.get("/emergency", adminEmergencyController.listContacts);
router.get("/emergency/:id", adminEmergencyController.getContact);
router.post("/emergency", adminEmergencyController.createContact);
router.put("/emergency/:id", adminEmergencyController.updateContact);
router.delete("/emergency/:id", adminEmergencyController.deleteContact);

// ── Site Settings (branding) ──
router.patch("/settings", siteSettingsController.updateSettings);

// ── Bot Knowledge Base (RAG training data) ──
router.get("/bot-knowledge", adminBotKnowledgeController.listKnowledge);
router.get("/bot-knowledge/:id", adminBotKnowledgeController.getKnowledge);
router.post("/bot-knowledge", adminBotKnowledgeController.createKnowledge);
router.put("/bot-knowledge/:id", adminBotKnowledgeController.updateKnowledge);
router.delete("/bot-knowledge/:id", adminBotKnowledgeController.deleteKnowledge);
router.post("/bot-knowledge/bulk-import", adminBotKnowledgeController.bulkImport);
router.post("/bot-knowledge/test", adminBotKnowledgeController.testKnowledge);

// ── Bot Config (system prompt, model params) ──
router.get("/bot-config", adminBotConfigController.getConfig);
router.put("/bot-config", adminBotConfigController.updateConfig);

module.exports = router;
