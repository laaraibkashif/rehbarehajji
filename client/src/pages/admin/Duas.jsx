"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import api from "../../services/api";
import { useAlert } from "../../components/Alert";
import MediaPicker from "../../components/MediaPicker";
import {
  HeaderSection, AddButton, SearchBar, FilterPills,
  LoadingState, EmptyState, ConfirmDialog, Spinner,
} from "../../components/AdminResourceTable";
import AdminResourceForm from "../../components/AdminResourceForm";

export default function AdminDuas() {
  const { t } = useTranslation();  const { addAlert: showAlert } = useAlert();
  const [duas, setDuas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [ritualStepFilter, setRitualStepFilter] = useState("");
  const [editing, setEditing] = useState(null); // dua _id or "add"
  const [saving, setSaving] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [audioPickerState, setAudioPickerState] = useState({ open: false, formDataSetter: null });

  const loadDuas = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (ritualStepFilter) params.ritualStep = ritualStepFilter;
      const res = await api.get("/api/admin/duas", { params });
      setDuas(res.data.duas);
    } catch { /* empty */ } finally { setLoading(false); }
  }, [search, ritualStepFilter]);

  useEffect(() => { loadDuas(); }, [loadDuas]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(loadDuas, 300);
    return () => clearTimeout(timer);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async (data) => {
    const isAdd = editing === "add";
    setSaving(editing);
    try {
      if (isAdd) {
        await api.post("/api/admin/duas", data);
        showAlert("Dua created.", "success");
      } else {
        await api.put(`/api/admin/duas/${editing}`, data);
        showAlert("Dua updated.", "success");
      }
      setEditing(null);
      loadDuas();
    } catch (err) {
      showAlert(err.response?.data?.error || "Failed to save.", "error");
    } finally { setSaving(null); }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/api/admin/duas/${deleteTarget._id}`);
      showAlert("Dua deleted.", "success");
      setDeleteTarget(null);
      loadDuas();
    } catch (err) {
      showAlert(err.response?.data?.error || "Failed to delete.", "error");
    } finally { setDeleting(false); }
  };

  // ── Edit form fields ──
  const formFields = [
    {
      name: "ritualType", label: "Show in (Hajj / Umrah card)", type: "select",
      options: [
        { value: "both", label: "Hajj & Umrah" },
        { value: "hajj", label: "Hajj only" },
        { value: "umrah", label: "Umrah only" },
      ],
    },
    { name: "relatedLocation", label: "Related Location", placeholder: "e.g. Masjid al-Haram" },
    { name: "relatedRitualStep", label: "Related Ritual Step", placeholder: "e.g. Tawaf" },
    { name: "textAr", label: "Arabic Text", type: "textarea", rows: 3, placeholder: "Arabic dua text…" },
    { name: "textEn", label: "English Translation", type: "textarea", rows: 3, placeholder: "English translation…" },
    { name: "textUr", label: "Urdu Translation", type: "textarea", rows: 2, placeholder: "Urdu translation…" },
  ];

  return (
    <div>
      <HeaderSection
        title={t("admin.duas", "Duas")}
        description={t("admin.duasDesc", "Manage supplications for each ritual step.")}
        actions={<AddButton label="Add Dua" onClick={() => setEditing("add")} />}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div className="w-full sm:w-64">
          <SearchBar value={search} onChange={setSearch} placeholder="Search duas…" />
        </div>
        <FilterPills
          options={[
            { value: "", label: "All Steps" },
            { value: "Ihram", label: "Ihram" },
            { value: "Tawaf", label: "Tawaf" },
            { value: "Sa'i", label: "Sa'i" },
          ]}
          value={ritualStepFilter}
          onChange={setRitualStepFilter}
        />
      </div>

      {loading ? <LoadingState /> : (
        <div className="space-y-3">
          {/* Add form */}
          {editing === "add" && (
            <div className="rounded-xl border-2 border-dashed border-emerald/30 bg-emerald/[0.02] p-5">
              <h3 className="font-display text-base font-semibold text-ink mb-4">New Dua</h3>
              <AdminResourceForm
                fields={formFields}
                initialData={{ ritualType: "both" }}
                onSave={handleSave}
                onCancel={() => setEditing(null)}
                saving={saving === "add"}
                renderExtra={(data, setData) => (
                  <div>
                    <label className="block text-xs font-medium text-ink/50 mb-1">Audio (Du'a Recitation)</label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setAudioPickerState({ open: true, formDataSetter: setData })}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-ink/15 bg-paper hover:border-emerald/30 text-sm text-ink/60 hover:text-ink transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303" />
                        </svg>
                        {data.audioUrl ? "Audio selected" : "Choose audio"}
                      </button>
                      {data.audioUrl && (
                        <button onClick={() => setData("audioUrl", "")} className="p-2 text-ink/30 hover:text-clay-alert">✕</button>
                      )}
                    </div>
                    {data.audioUrl && (
                      <audio src={data.audioUrl} controls className="w-full mt-2 h-8" />
                    )}
                    {/* Audio picker rendered inside renderExtra so it can access setData */}
                    <MediaPicker
                      open={audioPickerState.open}
                      onClose={() => setAudioPickerState({ open: false, formDataSetter: null })}
                      onSelect={(asset) => {
                        setData("audioUrl", asset.secureUrl || asset.url);
                        setAudioPickerState({ open: false, formDataSetter: null });
                      }}
                      acceptTypes={["raw"]}
                    />
                  </div>
                )}
              />
            </div>
          )}

          {duas.length === 0 && editing !== "add" ? (
            <EmptyState message="No duas found." actionLabel="Add the first dua" onAction={() => setEditing("add")} />
          ) : (
            duas.map((dua) => (
              <div key={dua._id} className={`rounded-xl border transition-all ${
                editing === dua._id ? "border-emerald/30 bg-emerald/[0.02] shadow-sm" : "border-ink/10 bg-paper hover:border-ink/20"
              }`}>
                {/* Collapsed row */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald/10 text-emerald flex-shrink-0">
                        {dua.ritualType || "both"}
                      </span>
                      <span className="text-xs font-mono text-ink/30 w-16 flex-shrink-0">
                        {dua.relatedRitualStep || "—"}
                      </span>
                      <p className="text-sm text-ink/80 line-clamp-1" dir="rtl">{dua.textAr}</p>
                    </div>
                    <p className="text-xs text-ink/40 truncate mt-0.5">
                      {dua.relatedLocation && <span className="mr-2">📍 {dua.relatedLocation}</span>}
                      {dua.audioUrl && <span className="text-emerald">🎵 Audio</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => setEditing(editing === dua._id ? null : dua._id)}
                      className={`p-2 rounded transition-colors ${editing === dua._id ? "bg-emerald/10 text-emerald" : "hover:bg-ink/5 text-ink/30 hover:text-ink"}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        {editing === dua._id ? (
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                        )}
                      </svg>
                    </button>
                    <button onClick={() => setDeleteTarget(dua)} className="p-2 rounded hover:bg-clay-alert/5 text-ink/30 hover:text-clay-alert">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Expanded edit form */}
                {editing === dua._id && (
                  <div className="px-4 pb-4 border-t border-ink/5 pt-4">
                    <AdminResourceForm
                      fields={formFields}
                      initialData={dua}
                      onSave={handleSave}
                      onCancel={() => setEditing(null)}
                      saving={saving === dua._id}
                      renderExtra={(data, setData) => (
                        <div>
                          <label className="block text-xs font-medium text-ink/50 mb-1">Audio (Du'a Recitation)</label>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setAudioPickerState({ open: true, formDataSetter: setData })}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-ink/15 bg-paper hover:border-emerald/30 text-sm text-ink/60 hover:text-ink transition-all"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303" />
                              </svg>
                              {data.audioUrl ? "Audio selected" : "Choose audio"}
                            </button>
                            {data.audioUrl && (
                              <button onClick={() => setData("audioUrl", "")} className="p-2 text-ink/30 hover:text-clay-alert">✕</button>
                            )}
                          </div>
                          {data.audioUrl && (
                            <audio src={data.audioUrl} controls className="w-full mt-2 h-8" />
                          )}
                          {/* Audio picker rendered inside renderExtra so it can access setData */}
                          <MediaPicker
                            open={audioPickerState.open}
                            onClose={() => setAudioPickerState({ open: false, formDataSetter: null })}
                            onSelect={(asset) => {
                              setData("audioUrl", asset.secureUrl || asset.url);
                              setAudioPickerState({ open: false, formDataSetter: null });
                            }}
                            acceptTypes={["raw"]}
                          />
                        </div>
                      )}
                    />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Dua"
        message={`Delete "${deleteTarget?.textEn?.slice(0, 60)}…"? This cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}