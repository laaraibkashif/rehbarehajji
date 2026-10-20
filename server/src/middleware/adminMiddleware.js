/**
 * requireAdmin — middleware that runs after authMiddleware.
 * Returns 403 if req.user.role !== 'admin'.
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required." });
  }
  next();
};

module.exports = requireAdmin;

// Backward-compatible alias
module.exports.adminMiddleware = requireAdmin;

