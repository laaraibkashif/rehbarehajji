/**
 * requireAdmin — auth gate for admin-only API routes.
 * Must be used after authMiddleware so req.user is populated.
 * Returns 403 Forbidden if the authenticated user is not an admin.
 */

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required." });
  }
  next();
};

module.exports = requireAdmin;
