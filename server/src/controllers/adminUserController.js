const User = require("../models/User");
const RitualPlan = require("../models/RitualPlan");
const ChatLog = require("../models/ChatLog");
const TawafCount = require("../models/TawafCount");
const Checklist = require("../models/Checklist");
const { logAdminAction } = require("../utils/auditLogger");

// GET /api/admin/users?page=1&limit=20&search=&role=&isVerified=
const getUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const search = req.query.search || "";
    const roleFilter = req.query.role || "";
    const verifiedFilter = req.query.isVerified;

    const filter = {};

    // Search by name or email
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by role
    if (roleFilter && ["pilgrim", "admin"].includes(roleFilter)) {
      filter.role = roleFilter;
    }

    // Filter by verified status
    if (verifiedFilter === "true") filter.isVerified = true;
    else if (verifiedFilter === "false") filter.isVerified = false;

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    // passwordHash is already stripped by the toJSON method on the model

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("getUsers error:", err);
    res.status(500).json({ error: "Failed to fetch users." });
  }
};

// GET /api/admin/users/:id
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found." });

    // Aggregate plan/progress summary for this user
    const [planCount, chatCount, tawafData] = await Promise.all([
      RitualPlan.countDocuments({ userId: user._id }),
      ChatLog.countDocuments({ userId: user._id }),
      TawafCount.aggregate([
        { $match: { userId: user._id } },
        { $group: { _id: null, totalTaps: { $sum: "$count" } } },
      ]),
    ]);

    // Get latest plan details if any
    const latestPlan = await RitualPlan.findOne({ userId: user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      user,
      stats: {
        totalPlans: planCount,
        totalChatQueries: chatCount,
        totalTawafTaps: tawafData[0]?.totalTaps || 0,
      },
      latestPlan: latestPlan
        ? {
            ritualType: latestPlan.ritualType,
            ageGroup: latestPlan.ageGroup,
            travelMode: latestPlan.travelMode,
            stepCount: latestPlan.generatedSteps?.length || 0,
            createdAt: latestPlan.createdAt,
          }
        : null,
    });
  } catch (err) {
    console.error("getUser error:", err);
    res.status(500).json({ error: "Failed to fetch user." });
  }
};

// PATCH /api/admin/users/:id
const updateUser = async (req, res) => {
  const { fullName, email, role, isVerified, isActive, preferredLanguage, country, phone } = req.body;

  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found." });

    const changes = {};

    // Don't let an admin demote themselves
    if (req.user.userId === req.params.id && role && role !== "admin") {
      return res.status(400).json({ error: "You cannot demote yourself." });
    }

    // Don't let an admin deactivate themselves
    if (req.user.userId === req.params.id && isActive === false) {
      return res.status(400).json({ error: "You cannot deactivate your own account." });
    }

    if (fullName !== undefined && user.fullName !== fullName) {
      changes.fullName = { from: user.fullName, to: fullName };
      user.fullName = fullName;
    }
    if (email !== undefined && user.email !== email) {
      changes.email = { from: user.email, to: email };
      user.email = email;
    }
    if (role !== undefined) {
      if (!["pilgrim", "admin"].includes(role)) {
        return res.status(400).json({ error: "Invalid role." });
      }
      if (user.role !== role) changes.role = { from: user.role, to: role };
      user.role = role;
    }
    if (isVerified !== undefined && user.isVerified !== isVerified) {
      changes.isVerified = { from: user.isVerified, to: isVerified };
      user.isVerified = isVerified;
    }
    if (isActive !== undefined && user.isActive !== isActive) {
      changes.isActive = { from: user.isActive, to: isActive };
      user.isActive = isActive;
    }
    if (preferredLanguage !== undefined && user.preferredLanguage !== preferredLanguage) {
      changes.preferredLanguage = { from: user.preferredLanguage, to: preferredLanguage };
      user.preferredLanguage = preferredLanguage;
    }
    if (country !== undefined && user.country !== country) {
      changes.country = { from: user.country, to: country };
      user.country = country;
    }
    if (phone !== undefined && user.phone !== phone) {
      changes.phone = { from: user.phone, to: phone };
      user.phone = phone;
    }

    await user.save();

    if (Object.keys(changes).length > 0) {
      await logAdminAction({
        adminId: req.user._id,
        action: "update",
        entity: "user",
        entityId: user._id,
        changes,
      });
    }

    res.json(user);
  } catch (err) {
    console.error("updateUser error:", err);
    res.status(500).json({ error: "Failed to update user." });
  }
};

// DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
  try {
    // Don't let an admin delete themselves
    if (req.user.userId === req.params.id) {
      return res.status(400).json({ error: "You cannot delete your own account." });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found." });

    // Clean up user's data
    await Promise.all([
      RitualPlan.deleteMany({ userId: user._id }),
      ChatLog.deleteMany({ userId: user._id }),
      TawafCount.deleteMany({ userId: user._id }),
      Checklist.deleteMany({ userId: user._id }),
    ]);

    await logAdminAction({
      adminId: req.user._id,
      action: "delete",
      entity: "user",
      entityId: user._id,
      changes: { deletedEmail: user.email, deletedName: user.fullName },
    });

    res.json({ message: "User deleted.", user });
  } catch (err) {
    console.error("deleteUser error:", err);
    res.status(500).json({ error: "Failed to delete user." });
  }
};

module.exports = { getUsers, getUser, updateUser, deleteUser };
