"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";

// ── Spinner ──
export function Spinner({ className = "w-5 h-5" }) {
  return (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ── ConfirmDialog ──
export function ConfirmDialog({ open, title, message, confirmLabel, onConfirm, onCancel, loading }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 backdrop-blur-sm" onClick={onCancel}>
      <div className="bg-paper rounded-2xl border border-ink/10 shadow-2xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-lg font-semibold text-ink mb-2">{title}</h3>
        <p className="text-sm text-ink/60 mb-6">{message}</p>
        <div className="flex items-center justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-medium text-ink/50 hover:text-ink hover:bg-ink/5 transition-all">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-clay-alert text-paper hover:opacity-90 disabled:opacity-50 transition-all inline-flex items-center gap-2"
          >
            {loading && <Spinner className="w-4 h-4" />}
            {confirmLabel || "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── SearchBar ──
export function SearchBar({ value, onChange, placeholder }) {
  return (
    <div className="relative">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "Search…"}
        className="w-full rounded-lg border border-ink/15 bg-paper pl-9 pr-3 py-1.5 text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-emerald/30 focus:border-emerald transition-all"
      />
    </div>
  );
}

// ── FilterPills ──
export function FilterPills({ options, value, onChange }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            value === opt.value
              ? "bg-emerald text-paper"
              : "bg-ink/5 text-ink/50 hover:text-ink hover:bg-ink/10"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ── DragHandle ──
export function DragHandle() {
  return (
    <div className="flex-shrink-0 cursor-grab active:cursor-grabbing text-ink/20 hover:text-ink/40 transition-colors">
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M8 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm8 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4zM8 14a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm8 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4zM8 22a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm8 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" />
      </svg>
    </div>
  );
}

// ── RowActions ──
export function RowActions({ onEdit, onDelete }) {
  return (
    <div className="flex items-center gap-1 flex-shrink-0">
      {onEdit && (
        <button onClick={onEdit} className="p-2 rounded hover:bg-emerald/10 transition-colors text-ink/30 hover:text-emerald" title="Edit">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
          </svg>
        </button>
      )}
      {onDelete && (
        <button onClick={onDelete} className="p-2 rounded hover:bg-clay-alert/5 transition-colors text-ink/30 hover:text-clay-alert" title="Delete">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </div>
  );
}

// ── MoveButtons ──
export function MoveButtons({ onMoveUp, onMoveDown, isFirst, isLast }) {
  return (
    <div className="flex flex-col gap-0.5 flex-shrink-0">
      <button onClick={onMoveUp} disabled={isFirst}
        className="p-0.5 rounded hover:bg-ink/5 disabled:opacity-20 disabled:cursor-not-allowed transition-colors text-ink/30 hover:text-ink"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
      </button>
      <button onClick={onMoveDown} disabled={isLast}
        className="p-0.5 rounded hover:bg-ink/5 disabled:opacity-20 disabled:cursor-not-allowed transition-colors text-ink/30 hover:text-ink"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>
    </div>
  );
}

// ── EmptyState ──
export function EmptyState({ message, actionLabel, onAction }) {
  return (
    <div className="text-center py-16">
      <p className="text-ink/30 font-mono text-sm mb-4">{message}</p>
      {actionLabel && onAction && (
        <button onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-emerald/10 text-emerald hover:bg-emerald/20 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// ── LoadingState ──
export function LoadingState() {
  return (
    <div className="flex justify-center py-20"><Spinner className="w-8 h-8 text-emerald" /></div>
  );
}

// ── HeaderSection ──
export function HeaderSection({ title, description, actions }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="font-display text-2xl lg:text-3xl font-semibold text-ink">{title}</h1>
        {description && <p className="text-sm text-ink/50 mt-1 font-mono">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

// ── AddButton ──
export function AddButton({ label, onClick }) {
  return (
    <button onClick={onClick}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-emerald text-paper hover:opacity-90 transition-all shadow-sm"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
      {label || "Add"}
    </button>
  );
}
