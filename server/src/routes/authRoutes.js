const { Router } = require("express");
const { body } = require("express-validator");
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

const router = Router();

// ── Validation rules ──

const validateEmail = body("email")
  .isEmail()
  .withMessage("Please provide a valid email address.")
  .normalizeEmail();

const validatePassword = body("password")
  .isLength({ min: 6 })
  .withMessage("Password must be at least 6 characters long.");

const registerValidation = [
  body("fullName")
    .trim()
    .notEmpty()
    .withMessage("Full name is required."),
  validateEmail,
  validatePassword,
];

const loginValidation = [validateEmail, validatePassword];

const verifyValidation = [
  validateEmail,
  body("code")
    .trim()
    .notEmpty()
    .withMessage("Verification code is required."),
];

// ── Routes ──

router.post("/register", registerValidation, authController.register);
router.post("/verify", verifyValidation, authController.verify);
router.post("/login", loginValidation, authController.login);
router.post("/logout", authMiddleware, authController.logout);

module.exports = router;
