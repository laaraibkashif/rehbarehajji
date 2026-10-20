const path = require("path");
const fs = require("fs");
const multer = require("multer");

// ── Allowed MIME types ──
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/ogg"];
const AUDIO_TYPES = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/webm"];

const ALLOWED_TYPES = [...IMAGE_TYPES, ...VIDEO_TYPES, ...AUDIO_TYPES];
const MAX_SIZE = 100 * 1024 * 1024; // 100 MB

// ── Multer storage ──
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = path.join(__dirname, "../../uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || ".bin";
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: images (jpg/png/webp/gif), videos (mp4/webm/ogg), audio (mp3/wav/ogg).`));
    }
  },
});

// ── Upload handler ──
const uploadFile = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const fileUrl = `/uploads/${req.file.filename}`;

  // Determine media type
  let mediaType = "file";
  if (IMAGE_TYPES.includes(req.file.mimetype)) mediaType = "image";
  else if (VIDEO_TYPES.includes(req.file.mimetype)) mediaType = "video";
  else if (AUDIO_TYPES.includes(req.file.mimetype)) mediaType = "audio";

  res.json({
    url: fileUrl,
    fullUrl: `${baseUrl}${fileUrl}`,
    filename: req.file.filename,
    size: req.file.size,
    mimetype: req.file.mimetype,
    mediaType,
  });
};

// ── Delete uploaded file ──
const deleteFile = (req, res) => {
  const filename = req.query.filename;

  if (!filename) {
    return res.status(400).json({ error: "Filename query param is required." });
  }

  // Prevent path traversal
  const safeName = path.basename(filename);
  const filePath = path.join(__dirname, "../../uploads", safeName);

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ message: "File deleted." });
    } else {
      res.status(404).json({ error: "File not found." });
    }
  } catch (err) {
    console.error("deleteFile error:", err);
    res.status(500).json({ error: "Failed to delete file." });
  }
};

module.exports = { upload, uploadFile, deleteFile };
