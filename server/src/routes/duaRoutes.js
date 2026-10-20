const { Router } = require("express");
const { listPublicDuas } = require("../controllers/duaController");

const router = Router();
router.get("/", listPublicDuas);

module.exports = router;