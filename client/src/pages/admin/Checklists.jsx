"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import api from "../../services/api";
import { useAlert } from "../../components/Alert";
import {
  HeaderSection, Spinner, LoadingState, EmptyState,
  ConfirmDialog, DragHandle, MoveButtons, RowActions,
  AddButton,
} from "../../components/AdminResourceTable";

// ── Editable item row ──
function ItemRow({ item, index, items, onChange, onDelete, onMoveUp, onMoveDown, onDragStart, onDragOver, onDragEnd }) {
  return (
    <div
      draggable
      onDragStart={(e) => { onDragStart(index); e.dataTransfer.effectAllowed = "move"; }}
      onDragOver={(e) => { e.preventDefault(); onDragOver(index); }}
      onDragEnd={onDragEnd}
      className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-ink/10 bg-paper hover:border-ink/20 transition-all"
    >
      <DragHandle />
      <MoveButtons
        onMoveUp={() => onMoveUp(index)}
        onMoveDown={() => onMoveDown(index)}
        isFirst={index === 0}
        isLast={index === items.length - 1}
      />

      {/* Label input */}
      <input
        value={item.label}
        onChange={(e) => onChange(index, "label", e.target.value)}
        className="flex-1 min-w-0 rounded-lg border border-ink/10 bg-paper px-3 py-1.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-emerald/30 focus:border-emerald transition-all"
        placeholder="Item label…"
      />

      {/* Group badge */}
      <select
        value={item.group}
        onChange={(e) => onChange(index, "group", e.target.value)}
        className="w-36 rounded-lg border border-ink/10 bg-paper px-2 py-1.5 text-xs text-ink/60 focus:outline-none focus:ring-2 focus:ring-emerald/30 transition-all font-mono"
      >
        <option value="">No group</option>
        {["Documents", "Ihram & Clothing", "Health & Hygiene", "Essentials", "Beginning", "Core Rites", "Completion"].map((g) => (
          <option key={g} value={g}>{g}</option>
        ))}
      </select>

      <button onClick={() => onDelete(index)} className="p-1.5 rounded hover:bg-clay-alert/5 text-ink/30 hover:text-clay-alert transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export default function AdminChecklists() {
  const { t } = useTranslation();
  const { addAlert: showAlert } = useAlert();

  const [type, setType] = useState("preparation");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);

  const loadTemplate = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/admin/checklists/templates/${type}`);
      setItems(res.data.items || []);
    } catch { /* empty */ } finally { setLoading(false); }
  }, [type]);

  useEffect(() => { loadTemplate(); }, [loadTemplate]);

  const persist = useCallback(async (newItems) => {
    setSaving(true);
    try {
      await api.put(`/api/admin/checklists/templates/${type}`, { items: newItems });
      setItems(newItems);
      showAlert("Template saved.", "success");
    } catch (err) {
      showAlert(err.response?.data?.error || "Failed to save.", "error");
      loadTemplate();
    } finally { setSaving(false); }
  }, [type, loadTemplate, showAlert]);

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleDeleteItem = (index) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
  };

  const handleAddItem = () => {
    setItems([...items, { label: "", group: "" }]);
  };

  const handleMoveUp = (index) => {
    if (index <= 0) return;
    const updated = [...items];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    setItems(updated);
  };

  const handleMoveDown = (index) => {
    if (index >= items.length - 1) return;
    const updated = [...items];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    setItems(updated);
  };

  // Drag & drop
  const handleDragStart = (index) => setDragIndex(index);
  const handleDragOver = (index) => {
    if (dragIndex === null || dragIndex === index) return;
    const updated = [...items];
    const [moved] = updated.splice(dragIndex, 1);
    updated.splice(index, 0, moved);
    setItems(updated);
    setDragIndex(index);
  };
  const handleDragEnd = () => {
    setDragIndex(null);
    persist(items);
  };

  // Group items for display
  const groupedItems = {};
  items.forEach((item) => {
    const g = item.group || "Ungrouped";
    if (!groupedItems[g]) groupedItems[g] = [];
    groupedItems[g].push(item);
  });

  return (
    <div>
      <HeaderSection
        title={t("admin.checklists", "Checklist Templates")}
        description={t("admin.checklistsDesc", "Manage default template items new users receive.")}
      />

      {/* Type toggle */}
      <div className="flex items-center gap-3 mb-6">
        {["preparation", "ritual"].map((tpe) => (
          <button key={tpe} onClick={() => setType(tpe)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              type === tpe ? "bg-emerald text-paper shadow-sm" : "bg-ink/5 text-ink/50 hover:text-ink hover:bg-ink/10"
            }`}
          >
            {tpe === "preparation" ? "Preparation" : "Ritual Steps"}
          </button>
        ))}
      </div>

      {loading ? <LoadingState /> : (
        <div className="space-y-4">
          {/* Grouped items */}
          {Object.entries(groupedItems).map(([group, groupItems]) => (
            <div key={group}>
              <h3 className="text-xs font-semibold text-gold uppercase tracking-wider mb-2 font-mono">
                {group}
                <span className="text-ink/20 ml-2 font-normal">({groupItems.length})</span>
              </h3>
              <div className="space-y-1.5">
                {groupItems.map((item, i) => {
                  const realIndex = items.indexOf(item);
                  return (
                    <ItemRow
                      key={item._id || `${item.label}-${i}`}
                      item={item}
                      index={realIndex}
                      items={items}
                      onChange={handleItemChange}
                      onDelete={handleDeleteItem}
                      onMoveUp={handleMoveUp}
                      onMoveDown={handleMoveDown}
                      onDragStart={handleDragStart}
                      onDragOver={handleDragOver}
                      onDragEnd={handleDragEnd}
                    />
                  );
                })}
              </div>
            </div>
          ))}

          {items.length === 0 && (
            <EmptyState message="No items yet." actionLabel="Add the first item" onAction={handleAddItem} />
          )}

          {/* Add + Save actions */}
          <div className="flex items-center justify-between pt-4 border-t border-ink/5">
            <button onClick={handleAddItem}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-emerald/10 text-emerald hover:bg-emerald/20 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Item
            </button>
            <button onClick={() => persist(items)} disabled={saving}
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-emerald text-paper hover:opacity-90 disabled:opacity-50 transition-all inline-flex items-center gap-2"
            >
              {saving && <Spinner className="w-4 h-4" />}
              Save Template
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
