"use client";

import { useState, useEffect } from "react";
import { Spinner } from "./AdminResourceTable";

/**
 * AdminResourceForm — reusable inline form pattern for admin CRUD pages.
 *
 * Props:
 *   fields: Array<{ name, label, type: 'text'|'textarea'|'select'|'media'|'taginput', placeholder?, options?, acceptType?, icon? }>
 *   initialData: Object with initial field values
 *   onSave: (data) => void
 *   onCancel: () => void
 *   saving: boolean
 *   renderExtra?: (data, setData) => JSX — for page-specific custom fields
 */
export default function AdminResourceForm({ fields, initialData, onSave, onCancel, saving, renderExtra }) {
  const [data, setData] = useState({});
  const [pickerOpen, setPickerOpen] = useState(null);
  const [tagValues, setTagValues] = useState({});

  useEffect(() => {
    if (initialData) {
      setData({ ...initialData });
      // Initialize tag input values
      const tags = {};
      fields.forEach((f) => {
        if (f.type === "taginput") {
          tags[f.name] = "";
        }
      });
      setTagValues(tags);
    }
  }, [initialData, fields]);

  const handleChange = (name, value) => {
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const addTag = (fieldName) => {
    const val = (tagValues[fieldName] || "").trim();
    if (!val) return;
    const current = data[fieldName] || [];
    if (current.includes(val)) return;
    handleChange(fieldName, [...current, val]);
    setTagValues((prev) => ({ ...prev, [fieldName]: "" }));
  };

  const removeTag = (fieldName, index) => {
    const current = data[fieldName] || [];
    handleChange(fieldName, current.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const trimmed = {};
    fields.forEach((f) => {
      const val = data[f.name];
      if (typeof val === "string") trimmed[f.name] = val.trim();
      else trimmed[f.name] = val;
    });
    onSave(trimmed);
  };

  const hasChanges = fields.some((f) => {
    const val = data[f.name];
    const init = initialData?.[f.name];
    if (Array.isArray(val)) return JSON.stringify(val) !== JSON.stringify(init || []);
    return val !== (init ?? "");
  });

  const isValid = fields
    .filter((f) => f.required !== false)
    .every((f) => {
      const val = data[f.name];
      if (typeof val === "string") return val.trim().length > 0;
      return val != null;
    });

  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <div key={field.name}>
          <label className="block text-xs font-medium text-ink/50 mb-1">
            {field.label}{field.required !== false && " *"}
          </label>

          {field.type === "textarea" ? (
            <textarea
              value={data[field.name] || ""}
              onChange={(e) => handleChange(field.name, e.target.value)}
              rows={field.rows || 3}
              placeholder={field.placeholder}
              className="w-full rounded-lg border border-ink/15 bg-paper px-3 py-2 text-sm text-ink resize-y min-h-[80px] focus:outline-none focus:ring-2 focus:ring-emerald/30 focus:border-emerald transition-all"
            />
          ) : field.type === "select" ? (
            <select
              value={data[field.name] || ""}
              onChange={(e) => handleChange(field.name, e.target.value)}
              className="w-full rounded-lg border border-ink/15 bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-emerald/30 focus:border-emerald transition-all"
            >
              <option value="">Select…</option>
              {(field.options || []).map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ) : field.type === "media" ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPickerOpen(field.name)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-ink/15 bg-paper hover:border-emerald/30 hover:bg-emerald/[0.02] text-sm text-ink/60 hover:text-ink transition-all"
              >
                {field.icon}
                <span className="truncate max-w-[160px]">
                  {data[field.name] ? data[field.name].split("/").pop()?.slice(0, 30) || "Selected" : "Choose from Library"}
                </span>
              </button>
              {data[field.name] && (
                <button
                  onClick={() => handleChange(field.name, "")}
                  className="p-2 rounded hover:bg-clay-alert/5 text-ink/30 hover:text-clay-alert transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ) : field.type === "taginput" ? (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <input
                  value={tagValues[field.name] || ""}
                  onChange={(e) => setTagValues((prev) => ({ ...prev, [field.name]: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(field.name); } }}
                  placeholder={field.placeholder || "Add…"}
                  className="flex-1 rounded-lg border border-ink/15 bg-paper px-3 py-1.5 text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-emerald/30 focus:border-emerald transition-all"
                />
                <button onClick={() => addTag(field.name)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald/10 text-emerald hover:bg-emerald/20 transition-all"
                >
                  Add
                </button>
              </div>
              {(data[field.name] || []).length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {(data[field.name] || []).map((tag, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-clay-alert/5 border border-clay-alert/15 text-xs text-clay-alert">
                      {tag}
                      <button onClick={() => removeTag(field.name, i)} className="hover:text-clay-alert/70 transition-colors">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <input
              type={field.type === "number" ? "number" : "text"}
              value={data[field.name] || ""}
              onChange={(e) => handleChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              className="w-full rounded-lg border border-ink/15 bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-emerald/30 focus:border-emerald transition-all"
            />
          )}
        </div>
      ))}

      {renderExtra?.(data, handleChange)}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-medium text-ink/50 hover:text-ink hover:bg-ink/5 transition-all">
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!hasChanges || saving || !isValid}
          className="px-4 py-2 rounded-lg text-sm font-semibold bg-emerald text-paper hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all inline-flex items-center gap-2"
        >
          {saving && <Spinner className="w-4 h-4" />}
          Save
        </button>
      </div>
    </div>
  );
}
