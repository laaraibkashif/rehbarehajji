const path = require("path");
const { Readable } = require("stream");
const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const MediaAsset = require("../models/MediaAsset");
const { logAdminAction } = require("../utils/auditLogger");

// ── Allowed MIME types ──
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/ogg", "video/quicktime"];
const AUDIO_TYPES = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/webm", "audio/aac", "audio/flac"];

const ALLOWED_MIME_MAP = new Map();
IMAGE_TYPES.forEach((m) => ALLOWED_MIME_MAP.set(m, "image"));
VIDEO_TYPES.forEach((m) => ALLOWED_MIME_MAP.set(m, "video"));
AUDIO_TYPES.forEach((m) => ALLOWED_MIME_MAP.set(m, "raw"));

// ── Size limits per resource type ──
const SIZE_LIMITS = {
  image: 10 * 1024 * 1024, // 10 MB
  video: 200 * 1024 * 1024, // 200 MB
  raw: 50 * 1024 * 1024, // 50 MB
};

// ── Multer: memory storage (buffer) for streaming to Cloudinary ──
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: Math.max(...Object.values(SIZE_LIMITS)) }, // overall max = 200 MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_MAP.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Unsupported file type: ${file.mimetype}. Allowed: ${[
            ...IMAGE_TYPES,
            ...VIDEO_TYPES,
            ...AUDIO_TYPES,
          ].join(", ")}`
        )
      );
    }
  },
});

// ── Helper: upload buffer to Cloudinary ──
function uploadToCloudinary(buffer, mimetype, originalName) {
  return new Promise((resolve, reject) => {
    const resourceType = ALLOWED_MIME_MAP.get(mimetype) || "raw";

    // Check size limit per resource type
    if (buffer.length > (SIZE_LIMITS[resourceType] || Infinity)) {
      const limitMB = (SIZE_LIMITS[resourceType] || Infinity) / (1024 * 1024);
      return reject(
        new Error(
          `File too large. ${resourceType === "image" ? "Images" : resourceType === "video" ? "Videos" : "Audio files"} are limited to ${limitMB} MB.`
        )
      );
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "rehbar-e-hajji",
        resource_type: resourceType,
        public_id: `${Date.now()}-${path.parse(originalName).name.replace(/[^a-zA-Z0-9_-]/g, "_")}`,
        use_filename: true,
        unique_filename: true,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    // Pipe the buffer into the upload stream
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
}

// ── POST /api/admin/media — upload a file ──
const uploadAsset = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  const adminId = req.user.userId;

  try {
    const result = await uploadToCloudinary(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname
    );

    const mimeResourceType = ALLOWED_MIME_MAP.get(req.file.mimetype) || "raw";

    const asset = await MediaAsset.create({
      publicId: result.public_id,
      url: result.url,
      secureUrl: result.secure_url,
      resourceType: mimeResourceType,
      format: result.format,
      bytes: result.bytes,
      originalName: req.file.originalname,
      uploadedBy: adminId,
      tags: req.body.tags
        ? req.body.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [],
    });

    await logAdminAction({
      adminId,
      action: "upload",
      entity: "media_file",
      entityId: asset._id,
      changes: {
        originalName: req.file.originalname,
        publicId: result.public_id,
        resourceType: mimeResourceType,
        bytes: result.bytes,
      },
    });

    res.status(201).json({ asset });
  } catch (err) {
    console.error("uploadAsset error:", err);
    res.status(500).json({ error: err.message || "Failed to upload file." });
  }
};

// ── GET /api/admin/media — list assets (paginated, filterable) ──
const listAssets = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const resourceType = req.query.type || ""; // "image" | "video" | "raw"
    const search = req.query.search || "";

    const filter = {};

    if (resourceType && ["image", "video", "raw"].includes(resourceType)) {
      filter.resourceType = resourceType;
    }

    if (search) {
      filter.$or = [
        { originalName: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
    }

    const [assets, total] = await Promise.all([
      MediaAsset.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("uploadedBy", "fullName email")
        .lean(),
      MediaAsset.countDocuments(filter),
    ]);

    res.json({
      assets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("listAssets error:", err);
    res.status(500).json({ error: "Failed to list assets." });
  }
};

// ── DELETE /api/admin/media/:id — delete an asset ──
const deleteAsset = async (req, res) => {
  try {
    const asset = await MediaAsset.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({ error: "Asset not found." });
    }

    // Block deletion if asset is in use
    if (asset.usedIn && asset.usedIn.length > 0) {
      const refs = asset.usedIn
        .map((u) => `${u.collection} (${u.docId})`)
        .join(", ");
      return res.status(409).json({
        error: `Cannot delete "${asset.originalName}" — it is used in: ${refs}. Remove all references before deleting.`,
        usedIn: asset.usedIn,
      });
    }

    const adminId = req.user.userId;

    // Determine Cloudinary resource_type for destroy
    const cloudResourceType =
      asset.resourceType === "raw" ? "raw" : asset.resourceType;

    // Delete from Cloudinary
    try {
      await cloudinary.uploader.destroy(asset.publicId, {
        resource_type: cloudResourceType,
      });
    } catch (cloudErr) {
      console.error("Cloudinary destroy warning:", cloudErr.message);
      // Continue with DB deletion even if Cloudinary fails
      // (orphaned asset will be handled by cleanup later)
    }

    // Delete the record
    await MediaAsset.findByIdAndDelete(asset._id);

    await logAdminAction({
      adminId,
      action: "delete_file",
      entity: "media_file",
      entityId: asset._id,
      changes: {
        originalName: asset.originalName,
        publicId: asset.publicId,
        resourceType: asset.resourceType,
      },
    });

    res.json({ message: "Asset deleted.", asset });
  } catch (err) {
    console.error("deleteAsset error:", err);
    res.status(500).json({ error: "Failed to delete asset." });
  }
};

module.exports = { upload, uploadAsset, listAssets, deleteAsset };
