"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import api from "../services/api";

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

function getFileIcon(resourceType) {
  if (resourceType === "image") {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
      </svg>
    );
  }
  if (resourceType === "video") {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9.75a2.25 2.25 0 002.25-2.25V7.5a2.25 2.25 0 00-2.25-2.25H4.5A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
      </svg>
    );
  }
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
    </svg>
  );
}

// ── DropZone ──

function DropZone({ onFileSelected, acceptTypes, uploading, progress }) {
  const { t } = useTranslation();
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const acceptAttr = acceptTypes
    ? acceptTypes.map((t) => {
        switch (t) {
          case "image": return "image/*";
          case "video": return "video/*";
          case "audio":
          case "raw": return "audio/*";
          default: return "";
        }
      }).join(",")
    : "image/*,video/*,audio/*";

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer?.files?.[0];
      if (file) onFileSelected(file);
    },
    [onFileSelected]
  );

  const handleChange = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (file) onFileSelected(file);
      e.target.value = "";
    },
    [onFileSelected]
  );

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`relative rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-200 ${
        dragging
          ? "border-emerald bg-emerald/[0.03]"
          : "border-ink/15 hover:border-emerald/40 hover:bg-emerald/[0.01]"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={acceptAttr}
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
          {/* Real progress bar */}
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
  );
}

// ── AssetCard ──

function AssetCard({ asset, onSelect, showSelect }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="group relative rounded-xl border border-ink/10 bg-paper overflow-hidden hover:border-emerald/30 hover:shadow-sm transition-all duration-200">
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

        {/* Select overlay */}
        {showSelect && (
          <button
            onClick={() => onSelect(asset)}
            className="absolute inset-0 flex items-center justify-center bg-ink/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            <span className="px-4 py-2 rounded-lg bg-paper text-ink text-sm font-semibold shadow-lg">
              Select
            </span>
          </button>
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
    </div>
  );
}

// ── Main MediaPicker ──

export default function MediaPicker({ open, onClose, onSelect, acceptTypes }) {
  const { t } = useTranslation();

  // acceptTypes = ["image", "video", "raw"] — which types the caller accepts
  const effectiveAccept = acceptTypes || ["image", "video", "raw"];

  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");

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

  // Refetch when page/filter/search change
  useEffect(() => {
    if (open) fetchAssets();
  }, [open, fetchAssets]);

  // Reset page on filter/search change
  useEffect(() => {
    setPage(1);
  }, [typeFilter, search]);

  const handleFileSelected = useCallback(
    async (file) => {
      setError(""); // Clear previous error on each new attempt

      // Validate file type against acceptTypes
      const mimeCategory = file.type.startsWith("image/")
        ? "image"
        : file.type.startsWith("video/")
          ? "video"
          : "raw";

      if (!effectiveAccept.includes(mimeCategory)) {
        setError(`This file type is not accepted. Accepted types: ${effectiveAccept.join(", ")}`);
        return;
      }

      setUploading(true);
      setUploadProgress(0);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await api.post("/api/admin/media", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            const pct = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1)
            );
            setUploadProgress(pct);
          },
        });

        // Add the new asset to the list
        setAssets((prev) => [res.data.asset, ...prev]);
      } catch (err) {
        const msg = err.response?.data?.error || "Upload failed.";
        setError(msg);
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }
    },
    [effectiveAccept]
  );

  const handleSelect = useCallback(
    (asset) => {
      onSelect?.(asset);
      onClose();
    },
    [onSelect, onClose]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8 px-4 overflow-y-auto bg-ink/30 backdrop-blur-sm">
      <div className="bg-paper rounded-2xl border border-ink/10 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink/10 flex-shrink-0">
          <h2 className="font-display text-xl font-semibold text-ink">
            {t("media.pickerTitle", "Media Library")}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-ink/5 text-ink/40 hover:text-ink transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Upload zone */}
          <DropZone
            onFileSelected={handleFileSelected}
            acceptTypes={effectiveAccept}
            uploading={uploading}
            progress={uploadProgress}
          />

          {/* Error banner */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-clay-alert/15 bg-clay-alert/[0.03] px-4 py-3">
              <svg className="w-4 h-4 text-clay-alert flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <p className="text-xs text-clay-alert flex-1">{error}</p>
              <button onClick={() => setError("")} className="text-clay-alert/50 hover:text-clay-alert transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Type filter */}
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
                  {type
                    ? getFileTypeLabel(type)
                    : t("media.all", "All")}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("media.search", "Search by name or tag…")}
                className="w-full rounded-lg border border-ink/15 bg-paper px-3 py-1.5 text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-emerald/30 focus:border-emerald transition-all"
              />
            </div>
          </div>

          {/* Asset grid */}
          {loading ? (
            <div className="flex justify-center py-12">
              <svg className="animate-spin w-8 h-8 text-emerald" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : assets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-ink/30 text-sm font-mono">
                {t("media.noAssets", "No media found. Upload something!")}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {assets.map((asset) => (
                <AssetCard
                  key={asset._id}
                  asset={asset}
                  onSelect={handleSelect}
                  showSelect={true}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2">
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
        </div>
      </div>
    </div>
  );
}
