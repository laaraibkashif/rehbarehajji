const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        "create",
        "update",
        "delete",
        "promote",
        "demote",
        "upload",
        "delete_file",
        "login_as",
        "bulk_action",
      ],
    },
    entity: {
      type: String,
      required: true,
      enum: [
        "user",
        "ritual_step",
        "ritual_plan",
        "checklist",
        "emergency_contact",
        "chat_log",
        "dua",
        "media_file",
        "branding",
        "settings",
        "admin",
        "knowledge_entry",
        "bot_knowledge",
        "bot_config",
      ],
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    changes: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying of recent actions
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ adminId: 1, createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
