const AuditLog = require("../models/AuditLog");

/**
 * Log an admin action to the AuditLog collection.
 *
 * @param {Object} options
 * @param {string}   options.adminId  - The admin user's ObjectId
 * @param {string}   options.action   - One of the AuditLog action enum values
 * @param {string}   options.entity   - One of the AuditLog entity enum values
 * @param {string}   [options.entityId] - The affected document's ObjectId (optional)
 * @param {Object}   [options.changes]  - A summary of what changed (optional)
 * @returns {Promise<Object>} The saved AuditLog document
 */
async function logAdminAction({ adminId, action, entity, entityId, changes }) {
  try {
    const log = await AuditLog.create({
      adminId,
      action,
      entity,
      entityId: entityId || null,
      changes: changes || null,
    });
    return log;
  } catch (err) {
    // Never throw — audit logging must never break the calling operation
    console.error("[auditLogger] Failed to log admin action:", err.message);
    return null;
  }
}

module.exports = { logAdminAction };
