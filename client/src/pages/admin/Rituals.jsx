"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import api from "../../services/api";
import { useAlert } from "../../components/Alert";
import MediaPicker from "../../components/MediaPicker";
import { Spinner, ConfirmDialog } from "../../components/AdminResourceTable";

// ══════════════════════════════════════════════════════════════
//  TagInput — add/remove tags for commonErrors
// ══════════════════════════════════════════════════════════════

function TagInput({ tags = [], onChange, placeholder = "Add an error…" }) {
  const [value, setValue] = useState("");

  const addTag = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (tags.includes(trimmed)) return;
    onChange([...tags, trimmed]);
    setValue("");
  };

  const removeTag = (index) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
          placeholder={placeholder}
          className="flex-1 rounded-lg border border-ink/15 bg-paper px-3 py-1.5 text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-emerald/30 focus:border-emerald transition-all"
        />
        <button
          onClick={addTag}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald/10 text-emerald hover:bg-emerald/20 transition-all"
        >
          Add
        </button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-clay-alert/5 border border-clay-alert/15 text-xs text-clay-alert">
              {tag}
              <button onClick={() => removeTag(i)} className="hover:text-clay-alert/70 transition-colors" aria-label={`Remove "${tag}"`}>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  MediaField — button that opens MediaPicker for a specific type
// ══════════════════════════════════════════════════════════════

function MediaField({ label, acceptType, currentUrl, onSelect, icon }) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-ink/50">{label}</label>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setPickerOpen(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-ink/15 bg-paper hover:border-emerald/30 hover:bg-emerald/[0.02] text-sm text-ink/60 hover:text-ink transition-all"
        >
          {icon}
          <span className="truncate max-w-[160px]">
            {currentUrl ? currentUrl.split("/").pop()?.slice(0, 30) || "Selected" : "Choose from Library"}
          </span>
        </button>
        {currentUrl && (
          <button
            onClick={() => onSelect({ url: "", secureUrl: "", publicId: "" })}
            className="p-2 rounded hover:bg-clay-alert/5 text-ink/30 hover:text-clay-alert transition-colors"
            aria-label="Clear"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      {currentUrl && (
        <p className="text-[10px] font-mono text-ink/20 truncate" title={currentUrl}>{currentUrl}</p>
      )}
      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(asset) => {
          onSelect({ url: asset.url, secureUrl: asset.secureUrl, publicId: asset.publicId });
          setPickerOpen(false);
        }}
        acceptTypes={[acceptType]}
      />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  LivePreview — renders a step as it appears on pilgrim-facing Ritual Guide
// ══════════════════════════════════════════════════════════════

function LivePreview({ step, onClose }) {
  if (!step) return null;

  const hasErrors = step.commonErrors?.length > 0;
  const hasImage = step.mediaUrls?.image;
  const hasVideo = step.mediaUrls?.video;
  const hasAudio = step.mediaUrls?.audioDua;

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-lg bg-paper border-l border-ink/10 shadow-2xl flex flex-col animate-slideInRight">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-ink/5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald/10 text-emerald text-xs font-mono font-bold">
            {step.order}
          </span>
          <span className="text-xs font-medium text-ink/50 uppercase tracking-wider font-mono">Preview</span>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-ink/5 hover:bg-ink/10 flex items-center justify-center text-ink/50 hover:text-ink transition-colors"
          aria-label="Close preview"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Scrollable preview content — mirrors RitualGuide StepBlock */ }
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Step number + badge */}
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald text-paper text-xs font-mono font-bold">
              {step.order}
            </span>
            <span className="text-[10px] font-mono text-ink/30 uppercase tracking-wider">Step {step.order}</span>
          </div>

          {/* Name */}
          <h2 className="font-display text-2xl lg:text-3xl font-semibold text-ink leading-tight">
            {step.name || "Untitled Step"}
          </h2>

          {/* Location */}
          {step.location && (
            <div className="flex items-center gap-1.5 text-sm text-ink/50 font-mono">
              <svg className="w-4 h-4 text-emerald/60 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              {step.location}
            </div>
          )}

          {/* Description */}
          {step.description && (
            <p className="text-sm text-ink/70 leading-relaxed">{step.description}</p>
          )}

          {/* Media previews */}
          {(hasImage || hasVideo || hasAudio) && (
            <div className="grid grid-cols-1 gap-4">
              {hasImage && (
                <div className="rounded-xl border border-ink/5 bg-sand/30 overflow-hidden">
                  <div className="aspect-[4/3] flex items-center justify-center bg-gradient-to-br from-emerald/5 to-ink/5">
                    <img src={step.mediaUrls.image} alt={step.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="px-4 py-2">
                    <span className="text-[10px] font-mono text-ink/30 uppercase">Image</span>
                  </div>
                </div>
              )}
              {hasVideo && (
                <div className="rounded-xl border border-ink/5 bg-sand/30 overflow-hidden">
                  <div className="aspect-[16/9] flex items-center justify-center bg-gradient-to-br from-gold/5 to-ink/5">
                    <video src={step.mediaUrls.video} controls className="w-full h-full object-cover" />
                  </div>
                  <div className="px-4 py-2">
                    <span className="text-[10px] font-mono text-ink/30 uppercase">Video</span>
                  </div>
                </div>
              )}
              {hasAudio && (
                <div className="rounded-xl border border-ink/5 bg-sand/30 p-4 flex items-center gap-3">
                  <svg className="w-6 h-6 text-emerald/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
                  </svg>
                  <span className="text-xs text-ink/50">Du'a audio attached</span>
                  <audio src={step.mediaUrls.audioDua} controls className="flex-1 h-8" />
                </div>
              )}
            </div>
          )}

          {/* Common errors */}
          {hasErrors && (
            <div className="rounded-xl border border-clay-alert/20 bg-clay-alert/5 p-5">
              <h4 className="text-sm font-semibold text-clay-alert mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                Common Mistakes
              </h4>
              <ul className="space-y-1.5">
                {step.commonErrors.map((err, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-clay-alert/80">
                    <span className="mt-1.5 block w-1.5 h-1.5 rounded-full bg-clay-alert/30 flex-shrink-0" />
                    {err}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Empty state hint */}
          {!step.name && !step.description && !step.location && (
            <p className="text-sm text-ink/30 text-center py-12 font-mono">
              Fill in the edit form fields to see a live preview.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  EditForm — expandable edit form for a step
// ══════════════════════════════════════════════════════════════

function EditForm({ step, onSave, onCancel, saving }) {
  const [name, setName] = useState(step.name || "");
  const [description, setDescription] = useState(step.description || "");
  const [location, setLocation] = useState(step.location || "");
  const [commonErrors, setCommonErrors] = useState(step.commonErrors || []);
  const [mediaUrls, setMediaUrls] = useState({
    image: step.mediaUrls?.image || "",
    video: step.mediaUrls?.video || "",
    audioDua: step.mediaUrls?.audioDua || "",
  });

  const handleSave = () => {
    onSave({
      name: name.trim(),
      description: description.trim(),
      location: location.trim(),
      commonErrors,
      mediaUrls,
    });
  };

  const hasChanges =
    name !== (step.name || "") ||
    description !== (step.description || "") ||
    location !== (step.location || "") ||
    JSON.stringify(commonErrors) !== JSON.stringify(step.commonErrors || []) ||
    mediaUrls.image !== (step.mediaUrls?.image || "") ||
    mediaUrls.video !== (step.mediaUrls?.video || "") ||
    mediaUrls.audioDua !== (step.mediaUrls?.audioDua || "");

  return (
    <div className="border-t border-ink/5 pt-4 mt-4 space-y-4">
      {/* Name */}
      <div>
        <label className="block text-xs font-medium text-ink/50 mb-1">Name *</label>
        <input value={name} onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-ink/15 bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-emerald/30 focus:border-emerald transition-all"
          placeholder="Step name"
        />
      </div>

      {/* Location */}
      <div>
        <label className="block text-xs font-medium text-ink/50 mb-1">Location *</label>
        <input value={location} onChange={(e) => setLocation(e.target.value)}
          className="w-full rounded-lg border border-ink/15 bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-emerald/30 focus:border-emerald transition-all"
          placeholder="e.g. Masjid al-Haram, Makkah"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-medium text-ink/50 mb-1">Description *</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
          className="w-full rounded-lg border border-ink/15 bg-paper px-3 py-2 text-sm text-ink resize-y min-h-[80px] focus:outline-none focus:ring-2 focus:ring-emerald/30 focus:border-emerald transition-all"
          placeholder="Describe this ritual step in detail…"
        />
      </div>

      {/* Media pickers */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MediaField
          label="Image"
          acceptType="image"
          currentUrl={mediaUrls.image}
          onSelect={(asset) => setMediaUrls((prev) => ({ ...prev, image: asset.secureUrl || asset.url }))}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
          }
        />
        <MediaField
          label="Video"
          acceptType="video"
          currentUrl={mediaUrls.video}
          onSelect={(asset) => setMediaUrls((prev) => ({ ...prev, video: asset.secureUrl || asset.url }))}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9.75a2.25 2.25 0 002.25-2.25V7.5a2.25 2.25 0 00-2.25-2.25H4.5A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
            </svg>
          }
        />
        <MediaField
          label="Du'a Audio"
          acceptType="raw"
          currentUrl={mediaUrls.audioDua}
          onSelect={(asset) => setMediaUrls((prev) => ({ ...prev, audioDua: asset.secureUrl || asset.url }))}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
            </svg>
          }
        />
      </div>

      {/* Common errors (tag input) */}
      <div>
        <label className="block text-xs font-medium text-ink/50 mb-1">Common Mistakes</label>
        <TagInput tags={commonErrors} onChange={setCommonErrors} placeholder="Add a common mistake…" />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-medium text-ink/50 hover:text-ink hover:bg-ink/5 transition-all">
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!hasChanges || saving || !name.trim() || !description.trim() || !location.trim()}
          className="px-4 py-2 rounded-lg text-sm font-semibold bg-emerald text-paper hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all inline-flex items-center gap-2"
        >
          {saving && <Spinner className="w-4 h-4" />}
          Save
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  StepCard — collapsed view with drag handle + expandable edit form
// ══════════════════════════════════════════════════════════════

function StepCard({ step, index, totalSteps, onSave, onDelete, onMoveUp, onMoveDown, onPreview, onDragStart, onDragOver, onDragEnd, editing, setEditing, saving }) {
  const isExpanded = editing === step._id;

  const handleSave = (data) => {
    onSave(step._id, data);
  };

  return (
    <div
      draggable
      onDragStart={(e) => { onDragStart(step, index); e.dataTransfer.effectAllowed = "move"; }}
      onDragOver={(e) => { e.preventDefault(); onDragOver(step, index); }}
      onDragEnd={onDragEnd}
      className={`rounded-xl border transition-all duration-200 ${
        isExpanded
          ? "border-emerald/30 bg-emerald/[0.02] shadow-sm"
          : "border-ink/10 bg-paper hover:border-ink/20"
      }`}
    >
      {/* Collapsed row */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Drag handle */}
        <div className="flex-shrink-0 cursor-grab active:cursor-grabbing text-ink/20 hover:text-ink/40 transition-colors" aria-label="Drag to reorder">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm8 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4zM8 14a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm8 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4zM8 22a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm8 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" />
          </svg>
        </div>

        {/* Up/down (drag alternative) */}
        <div className="flex flex-col gap-0.5 flex-shrink-0">
          <button onClick={() => onMoveUp(step)} disabled={index === 0}
            className="p-0.5 rounded hover:bg-ink/5 disabled:opacity-20 disabled:cursor-not-allowed transition-colors text-ink/30 hover:text-ink"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
          </button>
          <button onClick={() => onMoveDown(step)} disabled={index === totalSteps - 1}
            className="p-0.5 rounded hover:bg-ink/5 disabled:opacity-20 disabled:cursor-not-allowed transition-colors text-ink/30 hover:text-ink"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
        </div>

        {/* Step number */}
        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald/10 border border-emerald/20 flex items-center justify-center text-emerald text-sm font-bold font-mono">
          {step.order}
        </span>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-ink truncate">{step.name}</h3>
          <p className="text-xs text-ink/40 truncate">{step.location}</p>
          {/* Media indicators */}
          <div className="flex items-center gap-2 mt-0.5">
            {step.mediaUrls?.image && <span className="text-[10px] text-emerald font-medium">🖼</span>}
            {step.mediaUrls?.video && <span className="text-[10px] text-gold font-medium">🎬</span>}
            {step.mediaUrls?.audioDua && <span className="text-[10px] text-clay-alert font-medium">🎵</span>}
            {step.commonErrors?.length > 0 && (
              <span className="text-[10px] font-mono text-ink/30">⚠ {step.commonErrors.length}</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onPreview(step)}
            className="p-2 rounded hover:bg-ink/5 transition-colors text-ink/30 hover:text-ink"
            title="Preview"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button
            onClick={() => setEditing(isExpanded ? null : step._id)}
            className={`p-2 rounded transition-colors ${
              isExpanded ? "bg-emerald/10 text-emerald" : "hover:bg-ink/5 text-ink/30 hover:text-ink"
            }`}
            title={isExpanded ? "Close" : "Edit"}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              {isExpanded ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
              )}
            </svg>
          </button>
          <button
            onClick={() => onDelete(step)}
            className="p-2 rounded hover:bg-clay-alert/5 transition-colors text-ink/30 hover:text-clay-alert"
            title="Delete"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded edit form */}
      {isExpanded && (
        <div className="px-4 pb-4">
          <div className="border-t border-ink/5 pt-4">
            <EditForm
              step={step}
              onSave={handleSave}
              onCancel={() => setEditing(null)}
              saving={saving === step._id}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  AddStepForm — creates a new step at a chosen position
// ══════════════════════════════════════════════════════════════

function AddStepForm({ type, steps, onAdd, onCancel, adding }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [commonErrors, setCommonErrors] = useState([]);
  const [mediaUrls, setMediaUrls] = useState({ image: "", video: "", audioDua: "" });
  const [position, setPosition] = useState(steps.length);

  const handleAdd = () => {
    onAdd({
      ritualType: type,
      order: position + 1, // 1-indexed
      name: name.trim(),
      description: description.trim(),
      location: location.trim(),
      commonErrors,
      mediaUrls,
    });
  };

  // Reset form when switching types or after successful add
  useEffect(() => {
    setName("");
    setDescription("");
    setLocation("");
    setCommonErrors([]);
    setMediaUrls({ image: "", video: "", audioDua: "" });
    setPosition(steps.length);
  }, [type, steps.length]);

  return (
    <div className="rounded-xl border-2 border-dashed border-emerald/30 bg-emerald/[0.02] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-ink">Add New Step</h3>
        <button onClick={onCancel} className="p-1.5 rounded hover:bg-ink/5 text-ink/30 hover:text-ink transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Position selector */}
      <div>
        <label className="block text-xs font-medium text-ink/50 mb-1">Insert at position</label>
        <div className="flex items-center gap-2">
          {steps.length === 0 ? (
            <span className="text-sm text-ink/30 font-mono">1 (first step)</span>
          ) : (
            <div className="flex items-center gap-1.5 flex-wrap">
              {Array.from({ length: steps.length + 1 }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPosition(i)}
                  className={`w-8 h-8 rounded-lg text-xs font-mono font-bold transition-all ${
                    position === i
                      ? "bg-emerald text-paper"
                      : "bg-ink/5 text-ink/40 hover:text-ink hover:bg-ink/10"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="block text-xs font-medium text-ink/50 mb-1">Name *</label>
        <input value={name} onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-ink/15 bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-emerald/30 focus:border-emerald transition-all"
          placeholder="Step name"
        />
      </div>

      {/* Location */}
      <div>
        <label className="block text-xs font-medium text-ink/50 mb-1">Location *</label>
        <input value={location} onChange={(e) => setLocation(e.target.value)}
          className="w-full rounded-lg border border-ink/15 bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-emerald/30 focus:border-emerald transition-all"
          placeholder="e.g. Masjid al-Haram, Makkah"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-medium text-ink/50 mb-1">Description *</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
          className="w-full rounded-lg border border-ink/15 bg-paper px-3 py-2 text-sm text-ink resize-y min-h-[80px] focus:outline-none focus:ring-2 focus:ring-emerald/30 focus:border-emerald transition-all"
          placeholder="Describe this ritual step…"
        />
      </div>

      {/* Media */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MediaField
          label="Image" acceptType="image" currentUrl={mediaUrls.image}
          onSelect={(asset) => setMediaUrls((p) => ({ ...p, image: asset.secureUrl || asset.url }))}
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" /></svg>}
        />
        <MediaField
          label="Video" acceptType="video" currentUrl={mediaUrls.video}
          onSelect={(asset) => setMediaUrls((p) => ({ ...p, video: asset.secureUrl || asset.url }))}
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9.75a2.25 2.25 0 002.25-2.25V7.5a2.25 2.25 0 00-2.25-2.25H4.5A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg>}
        />
        <MediaField
          label="Du'a Audio" acceptType="raw" currentUrl={mediaUrls.audioDua}
          onSelect={(asset) => setMediaUrls((p) => ({ ...p, audioDua: asset.secureUrl || asset.url }))}
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" /></svg>}
        />
      </div>

      {/* Common errors */}
      <div>
        <label className="block text-xs font-medium text-ink/50 mb-1">Common Mistakes</label>
        <TagInput tags={commonErrors} onChange={setCommonErrors} placeholder="Add a common mistake…" />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-medium text-ink/50 hover:text-ink hover:bg-ink/5 transition-all">Cancel</button>
        <button onClick={handleAdd} disabled={adding || !name.trim() || !description.trim() || !location.trim()}
          className="px-4 py-2 rounded-lg text-sm font-semibold bg-emerald text-paper hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all inline-flex items-center gap-2"
        >
          {adding && <Spinner className="w-4 h-4" />}
          Add Step
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  Main AdminRituals Page
// ══════════════════════════════════════════════════════════════

export default function AdminRituals() {
  const { t } = useTranslation();
  const { addAlert: showAlert } = useAlert();

  const [type, setType] = useState("hajj");
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // step._id or null
  const [saving, setSaving] = useState(null); // step._id or "add"
  const [showAddForm, setShowAddForm] = useState(false);
  const [previewStep, setPreviewStep] = useState(null);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Drag state
  const [dragIndex, setDragIndex] = useState(null);

  // ── Load steps ──
  const loadSteps = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/admin/rituals?type=${type}`);
      setSteps(res.data.steps);
    } catch { /* empty */ } finally { setLoading(false); }
  }, [type]);

  useEffect(() => { loadSteps(); }, [loadSteps]);

  // ── Save step ──
  const handleSave = useCallback(async (stepId, data) => {
    setSaving(stepId);
    try {
      await api.put(`/api/admin/rituals/${stepId}`, data);
      showAlert("Step updated successfully.", "success");
      setEditing(null);
      loadSteps();
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to update step.";
      showAlert(msg, "error");
    } finally { setSaving(null); }
  }, [loadSteps, showAlert]);

  // ── Add step ──
  const handleAdd = useCallback(async (data) => {
    setSaving("add");
    try {
      // Create the step — POST returns the created document with its _id
      const { data: newStep } = await api.post("/api/admin/rituals", data);

      // Reorder: insert the new step's ID at the chosen position
      const reorderIds = [...steps.map((s) => s._id)];
      reorderIds.splice(data.order - 1, 0, newStep._id);
      await api.patch("/api/admin/rituals/reorder", { type, stepIds: reorderIds });

      showAlert("Step created successfully.", "success");
      setShowAddForm(false);
      loadSteps();
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to create step.";
      showAlert(msg, "error");
    } finally { setSaving(null); }
  }, [steps, type, loadSteps, showAlert]);

  // ── Delete step ──
  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/api/admin/rituals/${deleteTarget._id}`);
      showAlert(`"${deleteTarget.name}" deleted.`, "success");
      setDeleteTarget(null);
      loadSteps();
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to delete step.";
      showAlert(msg, "error");
    } finally { setDeleting(false); }
  }, [deleteTarget, loadSteps, showAlert]);

  // ── Reorder via move up/down ──
  const persistReorder = useCallback(async (orderedSteps) => {
    try {
      await api.patch("/api/admin/rituals/reorder", {
        type,
        stepIds: orderedSteps.map((s) => s._id),
      });
      setSteps(orderedSteps);
    } catch {
      loadSteps();
    }
  }, [type, loadSteps]);

  const handleMoveUp = useCallback((step) => {
    const idx = steps.indexOf(step);
    if (idx <= 0) return;
    const reordered = [...steps];
    [reordered[idx - 1], reordered[idx]] = [reordered[idx], reordered[idx - 1]];
    persistReorder(reordered);
  }, [steps, persistReorder]);

  const handleMoveDown = useCallback((step) => {
    const idx = steps.indexOf(step);
    if (idx >= steps.length - 1) return;
    const reordered = [...steps];
    [reordered[idx], reordered[idx + 1]] = [reordered[idx + 1], reordered[idx]];
    persistReorder(reordered);
  }, [steps, persistReorder]);

  // ── Drag and drop ──
  const handleDragStart = useCallback((_step, index) => {
    setDragIndex(index);
  }, []);

  const handleDragOver = useCallback((_step, index) => {
    if (dragIndex === null || dragIndex === index) return;
    const reordered = [...steps];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(index, 0, moved);
    setSteps(reordered);
    setDragIndex(index);
  }, [dragIndex, steps]);

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    persistReorder(steps);
  }, [steps, persistReorder]);

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-semibold text-ink">
            {t("admin.rituals", "Rituals")}
          </h1>
          <p className="text-sm text-ink/50 mt-1 font-mono">
            {t("admin.ritualsDesc", "Manage Hajj and Umrah ritual steps.")}
          </p>
        </div>
        <button
          onClick={() => { setShowAddForm(true); setEditing(null); }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-emerald text-paper hover:opacity-90 transition-all shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Step
        </button>
      </div>

      {/* ── Type toggle ── */}
      <div className="flex items-center gap-3 mb-6">
        {["hajj", "umrah"].map((tpe) => (
          <button
            key={tpe}
            onClick={() => { setType(tpe); setEditing(null); setShowAddForm(false); }}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              type === tpe
                ? "bg-emerald text-paper shadow-sm"
                : "bg-ink/5 text-ink/50 hover:text-ink hover:bg-ink/10"
            }`}
          >
            {t(`nav.${tpe}`, tpe.charAt(0).toUpperCase() + tpe.slice(1))}
          </button>
        ))}
      </div>

      {/* ── Steps list ── */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner className="w-8 h-8 text-emerald" /></div>
      ) : (
        <div className="space-y-2">
          {/* Add step form (shown at top) */}
          {showAddForm && (
            <AddStepForm
              type={type}
              steps={steps}
              onAdd={handleAdd}
              onCancel={() => setShowAddForm(false)}
              adding={saving === "add"}
            />
          )}

          {steps.length === 0 && !showAddForm ? (
            <div className="text-center py-20">
              <p className="text-ink/40 font-mono text-sm mb-3">No {type} steps yet.</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-emerald/10 text-emerald hover:bg-emerald/20 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add the first step
              </button>
            </div>
          ) : (
            steps.map((step, i) => (
              <StepCard
                key={step._id}
                step={step}
                index={i}
                totalSteps={steps.length}
                onSave={handleSave}
                onDelete={setDeleteTarget}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
                onPreview={setPreviewStep}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                editing={editing}
                setEditing={setEditing}
                saving={saving}
              />
            ))
          )}
        </div>
      )}

      {/* ── Delete confirmation dialog ── */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Step"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />

      {/* ── Live Preview panel ── */}
      {previewStep && (
        <>
          <div className="fixed inset-0 z-30 bg-ink/20 backdrop-blur-sm" onClick={() => setPreviewStep(null)} />
          <LivePreview step={previewStep} onClose={() => setPreviewStep(null)} />
        </>
      )}
    </div>
  );
}
