const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const User = require("../models/User");

// Fixed verification code (mock)
const MOCK_VERIFICATION_CODE = "123456";

// ──────────────────────────────── Register ────────────────────────────────

const register = async (req, res) => {
  // Validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  const { fullName, email, password, phone, country, preferredLanguage } =
    req.body;

  try {
    // Check for existing user
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res
        .status(409)
        .json({ error: "Account already exists. Please Login." });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      fullName,
      email,
      passwordHash,
      phone: phone || "",
      country: country || "",
      preferredLanguage: preferredLanguage || "en",
    });

    res.status(201).json({
      message: "Account created successfully. Please verify your email.",
      user: { id: user._id, fullName: user.fullName, email: user.email },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
};

// ──────────────────────────────── Verify ────────────────────────────────

const verify = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  const { email, code } = req.body;

  try {
    if (code !== MOCK_VERIFICATION_CODE) {
      return res.status(400).json({ error: "Incorrect code." });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    if (user.isVerified) {
      return res.json({ message: "Account already verified." });
    }

    user.isVerified = true;
    await user.save();

    res.json({ message: "Account verified successfully." });
  } catch (err) {
    console.error("Verify error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
};

// ──────────────────────────────── Login ────────────────────────────────

const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    // Block deactivated accounts
    if (!user.isActive) {
      return res.status(403).json({ error: "Your account has been deactivated. Please contact support." });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    // Sign JWT
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        preferredLanguage: user.preferredLanguage,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
};

// ──────────────────────────────── Logout ────────────────────────────────

const logout = async (_req, res) => {
  // Stateless — client discards the token
  res.json({ message: "Logged out successfully." });
};

module.exports = { register, verify, login, logout };
