"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import api from "../../services/api";
// ── Helpers ──

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(1)} ${units[i]}`;
}

function getFileTypeLabel(resourceType) {
  switch (resourceType) {
    case "image": return "Image";
    case "video": return "Video";
    case "raw": return "Audio";
    default: return "File";
  }
}

function getFileTypeBadgeClass(resourceType) {
  switch (resourceType) {
    case "image": return "bg-emerald/10 text-emerald border-emerald/20";
    case "video": return "bg-gold/10 text-gold border-gold/20";
    case "raw": return "bg-clay-alert/10 text-clay-alert border-clay-alert/20";
    default: return "bg-ink/5 text-ink/40 border-ink/10";
  }
}

// ── DropZone ──

function DropZone({ onUploadComplete }) {
  const { t } = useTranslation();
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const handleFile = useCallback(
    async (file) => {
      if (!file) return;

      setError("");
      setUploading(true);
      setProgress(0);

      try {
        const formData = new FormData();
        formData.append("file", file);

        await api.post("/api/admin/media", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            const pct = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1)
            );
            setProgress(pct);
          },
        });

        setProgress(100);
        setTimeout(() => {
          setUploading(false);
          setProgress(0);
          onUploadComplete?.();
        }, 500);
      } catch (err) {
        const msg = err.response?.data?.error || "Upload failed.";
        setError(msg);
        setUploading(false);
      }
    },
    [onUploadComplete]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(false);
      handleFile(e.dataTransfer?.files?.[0]);
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e) => {
      handleFile(e.target.files?.[0]);
      e.target.value = "";
    },
    [handleFile]
  );

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`relative rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-200 ${
          dragging
            ? "border-emerald bg-emerald/[0.03]"
            : "border-ink/15 hover:border-emerald/40 hover:bg-emerald/[0.01]"
        } ${uploading ? "pointer-events-none" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*,audio/*"
          onChange={handleChange}
          className="hidden"
          aria-label="Upload file"
        />

        {uploading ? (
          <div className="space-y-3">
            <svg className="w-8 h-8 mx-auto text-emerald animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm text-ink/60 font-medium">
              {t("media.uploading", "Uploading…")}
            </p>
            <div className="max-w-xs mx-auto h-2 bg-ink/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald rounded-full transition-all duration-200 ease-out"
                style={{ width: `${Math.round(progress)}%` }}
              />
            </div>
            <p className="text-xs text-ink/30 font-mono">{Math.round(progress)}%</p>
          </div>
        ) : (
          <div className="space-y-2">
            <svg className="w-8 h-8 mx-auto text-ink/30" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10.5v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm text-ink/50">
              {t("media.dropHint", "Drop a file here or click to upload")}
            </p>
            <p className="text-xs text-ink/30 font-mono">
              Images ≤10 MB · Videos ≤200 MB · Audio ≤50 MB
            </p>
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs text-clay-alert font-medium">{error}</p>
      )}
    </div>
  );
}

// ── DeleteConfirmModal ──

function DeleteConfirmModal({ asset, onClose, onDeleted }) {
  const { t } = useTranslation();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setDeleting(true);
    setError("");
    try {
      await api.delete(`/api/admin/media/${asset._id}`);
      onDeleted?.();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to delete.";
      // If 409, the "in use" message from the backend is descriptive enough
      setError(msg);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-ink/30 backdrop-blur-sm">
      <div className="bg-paper rounded-2xl border border-ink/10 shadow-2xl p-6 w-full max-w-md">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-clay-alert/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-clay-alert" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h3 className="font-display text-lg font-semibold text-ink mb-2">
            {t("media.confirmDelete", "Delete Asset?")}
          </h3>
          <p className="text-sm text-ink/50 mb-2">
            {t("media.deleteWarning", "Are you sure you want to delete")}{" "}
            <strong className="text-ink">{asset.originalName}</strong>?
          </p>
          <p className="text-xs text-ink/30 font-mono mb-6">
            ({formatBytes(asset.bytes)} · .{asset.format})
          </p>

          {/* Blocked by usedIn */}
          {asset.usedIn && asset.usedIn.length > 0 && (
            <div className="rounded-lg bg-clay-alert/5 border border-clay-alert/20 px-4 py-3 mb-4">
              <p className="text-xs text-clay-alert/80">
                {t("media.inUseBlock", "This asset is used in")}{" "}
                <strong>{asset.usedIn.length}</strong>{" "}
                {t("media.inUseBlock2", "reference(s). Remove all references before deleting.")}
              </p>
              <ul className="mt-2 space-y-1">
                {asset.usedIn.map((ref, i) => (
                  <li key={i} className="text-[11px] font-mono text-clay-alert/60">
                    {ref.collection} · {ref.docId}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-clay-alert/10 border border-clay-alert/25 px-4 py-3 mb-4">
              <p className="text-xs text-clay-alert">{error}</p>
            </div>
          )}

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-ink/15 text-sm font-medium text-ink/50 hover:text-ink hover:border-ink/30 transition-all"
            >
              {t("media.cancel", "Cancel")}
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting || (asset.usedIn && asset.usedIn.length > 0)}
              className="px-4 py-2 rounded-lg bg-clay-alert text-paper text-sm font-semibold hover:bg-clay-alert/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {deleting && (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {t("media.delete", "Delete")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── AssetDetailModal ──

function AssetDetailModal({ asset, onClose, onDelete }) {
  if (!asset) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-ink/30 backdrop-blur-sm">
      <div className="bg-paper rounded-2xl border border-ink/10 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Preview */}
        <div className="aspect-video bg-sand/50 flex items-center justify-center">
          {asset.resourceType === "image" ? (
            <img
              src={asset.secureUrl || asset.url}
              alt={asset.originalName}
              className="w-full h-full object-contain"
            />
          ) : asset.resourceType === "video" ? (
            <video
              src={asset.secureUrl || asset.url}
              controls
              className="w-full h-full"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-ink/30 p-8">
              <span className="text-5xl mb-4">🎵</span>
              <p className="text-sm text-ink/50">{asset.originalName}</p>
              <audio
                src={asset.secureUrl || asset.url}
                controls
                className="mt-4 w-full max-w-xs"
              />
            </div>
          )}
        </div>

        {/* Details */}
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-lg font-semibold text-ink truncate">
                {asset.originalName}
              </h3>
              <span
                className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getFileTypeBadgeClass(asset.resourceType)}`}
              >
                {getFileTypeLabel(asset.resourceType)}
              </span>
            </div>
            <button
              onClick={() => onDelete(asset)}
              className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-clay-alert/10 text-clay-alert text-xs font-semibold hover:bg-clay-alert/20 transition-colors"
              title="Delete"
            >
              Delete
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-ink/40 font-medium">Public ID</p>
              <p className="text-xs font-mono text-ink/60 truncate">{asset.publicId}</p>
            </div>
            <div>
              <p className="text-xs text-ink/40 font-medium">Format</p>
              <p className="text-xs font-mono text-ink/60">{asset.format}</p>
            </div>
            <div>
              <p className="text-xs text-ink/40 font-medium">Size</p>
              <p className="text-xs font-mono text-ink/60">{formatBytes(asset.bytes)}</p>
            </div>
            <div>
              <p className="text-xs text-ink/40 font-medium">Uploaded</p>
              <p className="text-xs font-mono text-ink/60">
                {new Date(asset.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* URL */}
          <div>
            <p className="text-xs text-ink/40 font-medium mb-1">URL</p>
            <input
              readOnly
              value={asset.secureUrl || asset.url}
              onClick={(e) => e.target.select()}
              className="w-full rounded-lg border border-ink/10 bg-sand/30 px-3 py-2 text-xs font-mono text-ink/60"
            />
          </div>

          {/* Tags */}
          {asset.tags && asset.tags.length > 0 && (
            <div>
              <p className="text-xs text-ink/40 font-medium mb-1">Tags</p>
              <div className="flex flex-wrap gap-1">
                {asset.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-full bg-ink/5 text-ink/50 text-[10px] font-mono"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Used in */}
          <div>
            <p className="text-xs text-ink/40 font-medium mb-1">
              Used In ({asset.usedIn?.length || 0})
            </p>
            {asset.usedIn && asset.usedIn.length > 0 ? (
              <div className="space-y-1">
                {asset.usedIn.map((ref, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs font-mono text-ink/40 bg-ink/5 rounded-lg px-3 py-2">
                    <span className="font-semibold text-ink/60">{ref.collection}</span>
                    <span className="text-ink/20">·</span>
                    <span className="truncate">{ref.docId}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-ink/30 font-mono">Not used anywhere</p>
            )}
          </div>

          {/* Uploaded by */}
          {asset.uploadedBy && (
            <div className="flex items-center gap-2 text-xs text-ink/40">
              <span className="font-medium">Uploaded by:</span>
              <span>{(asset.uploadedBy).fullName || (asset.uploadedBy)?._id || "—"}</span>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full mt-2 py-2.5 rounded-lg border border-ink/15 text-sm font-medium text-ink/50 hover:text-ink hover:border-ink/30 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── AssetCard ──

function AssetCard({ asset, onView, onDelete }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className="group relative rounded-xl border border-ink/10 bg-paper overflow-hidden hover:border-emerald/30 hover:shadow-sm transition-all duration-200 cursor-pointer"
      onClick={() => onView(asset)}
    >
      {/* Preview */}
      <div className="aspect-[4/3] bg-sand/50 flex items-center justify-center overflow-hidden">
        {asset.resourceType === "image" && !imgError ? (
          <img
            src={asset.secureUrl || asset.url}
            alt={asset.originalName}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-ink/30 p-4">
            <span className="text-4xl mb-2">
              {asset.resourceType === "video" ? "🎬" : asset.resourceType === "raw" ? "🎵" : "🖼"}
            </span>
            <span className="text-[10px] font-mono text-ink/20">{asset.format}</span>
          </div>
        )}

        {/* Type badge */}
        <span
          className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getFileTypeBadgeClass(asset.resourceType)}`}
        >
          {getFileTypeLabel(asset.resourceType)}
        </span>

        {/* UsedIn indicator */}
        {asset.usedIn && asset.usedIn.length > 0 && (
          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-gold/10 text-gold text-[10px] font-semibold border border-gold/20">
            {asset.usedIn.length} ref{(asset.usedIn.length > 1 ? "s" : "")}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-1">
        <p className="text-xs font-medium text-ink truncate" title={asset.originalName}>
          {asset.originalName}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-ink/30">
            {formatBytes(asset.bytes)}
          </span>
          <span className="text-[10px] font-mono text-ink/30">
            .{asset.format}
          </span>
        </div>
      </div>

      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(asset);
        }}
        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-paper/90 border border-ink/10 flex items-center justify-center text-ink/30 hover:text-clay-alert hover:border-clay-alert/30 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-sm"
        title="Delete"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// ── Main AdminMediaLibrary ──

export default function AdminMediaLibrary() {
  const { t } = useTranslation();

  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const [viewingAsset, setViewingAsset] = useState(null);
  const [deletingAsset, setDeletingAsset] = useState(null);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (typeFilter) params.type = typeFilter;
      if (search) params.search = search;
      const res = await api.get("/api/admin/media", { params });
      setAssets(res.data.assets);
      setPagination(res.data.pagination);
    } catch { /* empty */ } finally { setLoading(false); }
  }, [page, typeFilter, search]);

  useEffect(() => { fetchAssets(); }, [fetchAssets]);

  // Reset page on filter/search change
  useEffect(() => { setPage(1); }, [typeFilter, search]);

  const handleUploadComplete = useCallback(() => {
    fetchAssets();
  }, [fetchAssets]);

  const handleDelete = useCallback((asset) => {
    setDeletingAsset(asset);
  }, []);

  const handleDeleted = useCallback(() => {
    setDeletingAsset(null);
    setViewingAsset(null);
    fetchAssets();
  }, [fetchAssets]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl lg:text-3xl font-semibold text-ink">
          {t("admin.mediaLibrary", "Media Library")}
        </h1>
        <p className="text-sm text-ink/50 mt-1 font-mono">
          {t("admin.mediaLibraryDesc", "Upload and manage images, videos, and audio files.")}
        </p>
      </div>

      {/* Upload zone */}
      <DropZone onUploadComplete={handleUploadComplete} />

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1">
          {["", "image", "video", "raw"].map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                typeFilter === type
                  ? "bg-emerald text-paper"
                  : "bg-ink/5 text-ink/50 hover:text-ink hover:bg-ink/10"
              }`}
            >
              {type ? getFileTypeLabel(type) : t("media.all", "All")}
            </button>
          ))}
        </div>

        <div className="flex-1 min-w-[200px]">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("media.search", "Search by name or tag…")}
            className="w-full rounded-lg border border-ink/15 bg-paper px-3 py-1.5 text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-emerald/30 focus:border-emerald transition-all"
          />
        </div>

        {/* Count */}
        <span className="text-xs text-ink/30 font-mono">
          {pagination?.total || 0} {t("media.assets", "assets")}
        </span>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <svg className="animate-spin w-8 h-8 text-emerald" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : assets.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-ink/30 text-sm font-mono">
            {t("media.noAssets", "No media found. Upload something!")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {assets.map((asset) => (
            <AssetCard
              key={asset._id}
              asset={asset}
              onView={setViewingAsset}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 rounded-lg border border-ink/15 text-xs font-medium text-ink/50 hover:text-ink hover:border-ink/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            {t("media.prev", "Prev")}
          </button>
          <span className="text-xs text-ink/30 font-mono">
            {page} / {pagination.pages}
          </span>
          <button
            disabled={page >= pagination.pages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 rounded-lg border border-ink/15 text-xs font-medium text-ink/50 hover:text-ink hover:border-ink/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            {t("media.next", "Next")}
          </button>
        </div>
      )}

      {/* Detail modal */}
      {viewingAsset && (
        <AssetDetailModal
          asset={viewingAsset}
          onClose={() => setViewingAsset(null)}
          onDelete={(asset) => {
            setViewingAsset(null);
            handleDelete(asset);
          }}
        />
      )}

      {/* Delete confirmation */}
      {deletingAsset && (
        <DeleteConfirmModal
          asset={deletingAsset}
          onClose={() => setDeletingAsset(null)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}
