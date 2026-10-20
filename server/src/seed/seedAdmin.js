/**
 * Seed script — creates an initial admin user from environment variables.
 *
 * Reads ADMIN_EMAIL and ADMIN_PASSWORD from .env.
 * If a user with that email already exists and is an admin, skips.
 * If a user with that email exists but is not an admin, promotes them.
 * If no user exists, creates a new admin user.
 *
 * Usage (called automatically on server start, or manually):
 *   node src/seed/seedAdmin.js
 *
 * Required env vars:
 *   ADMIN_EMAIL     — email for the admin account
 *   ADMIN_PASSWORD  — password for the admin account (must be 8+ chars)
 *
 * Optional env vars:
 *   ADMIN_NAME      — display name (default: "Admin")
 */

require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../models/User");

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn(
      "⚠️  ADMIN_EMAIL and/or ADMIN_PASSWORD not set in .env — skipping admin seed.\n" +
        "   Set these environment variables to auto-create an admin account on startup."
    );
    return;
  }

  const adminName = process.env.ADMIN_NAME || "Admin";

  if (password.length < 8) {
    console.error("❌ ADMIN_PASSWORD must be at least 8 characters long.");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const existing = await User.findOne({ email: email.toLowerCase() });

    if (existing) {
      if (existing.role === "admin") {
        console.log(`ℹ️  Admin user "${email}" already exists — skipping.`);
      } else {
        existing.role = "admin";
        await existing.save();
        console.log(`✅ User "${email}" promoted to admin.`);
      }
    } else {
      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(password, salt);

      await User.create({
        fullName: adminName,
        email: email.toLowerCase(),
        passwordHash,
        role: "admin",
        isVerified: true,
        preferredLanguage: "en",
      });

      console.log(`✅ Admin user "${email}" created successfully.`);
    }
  } catch (err) {
    console.error("❌ seedAdmin error:", err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

// Run directly
seedAdmin();
