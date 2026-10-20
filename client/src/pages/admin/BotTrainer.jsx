"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import api from "../../services/api";
import { useAlert } from "../../components/Alert";
import {
  HeaderSection, SearchBar, FilterPills, LoadingState,
  EmptyState, ConfirmDialog, Spinner,
} from "../../components/AdminResourceTable";

const TABS = [
  { key: "knowledge", label: "Knowledge Base" },
  { key: "config", label: "Persona" },
  { key: "test", label: "Test & Logs" },
];

const CATEGORIES = ["ritual", "ihram", "dua", "logistics", "emergency", "other"];

// ══════════════════════════════════════════════════════════════
//  Knowledge Base Tab
// ══════════════════════════════════════════════════════════════

function KnowledgeTab({ prefillQuestion }) {
  const { addAlert: showAlert } = useAlert();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({ topic: "", question: "", answer: "", category: "other", tags: "", isActive: true });
  const [bulkJson, setBulkJson] = useState("");

  // When prefillQuestion is set (from 'train this' in logs), open the add form with it
  useEffect(() => {
    if (prefillQuestion) {
      setForm((prev) => ({ ...prev, question: prefillQuestion }));
      setEditing("add");
    }
  }, [prefillQuestion]);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (catFilter) params.category = catFilter;
      const res = await api.get("/api/admin/bot/knowledge", { params });
      setEntries(res.data.entries);
    } catch { /* empty */ } finally { setLoading(false); }
  }, [search, catFilter]);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  const resetForm = () => setForm({ topic: "", question: "", answer: "", category: "other", tags: "", isActive: true });

  const handleSave = async () => {
    const isAdd = editing === "add";
    setSaving(editing);
    try {
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      };
      if (isAdd) {
        await api.post("/api/admin/bot/knowledge", payload);
        showAlert("Entry created.", "success");
      } else {
        await api.patch(`/api/admin/bot/knowledge/${editing}`, payload);
        showAlert("Entry updated.", "success");
      }
      setEditing(null);
      resetForm();
      loadEntries();
    } catch (err) {
      showAlert(err.response?.data?.error || "Failed to save.", "error");
    } finally { setSaving(null); }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/api/admin/bot/knowledge/${deleteTarget._id}`);
      showAlert("Entry deleted.", "success");
      setDeleteTarget(null);
      loadEntries();
    } catch (err) {
      showAlert(err.response?.data?.error || "Failed to delete.", "error");
    } finally { setDeleting(false); }
  };

  const handleBulkImport = async () => {
    let parsed;
    try {
      parsed = JSON.parse(bulkJson);
    } catch {
      showAlert("Invalid JSON. Please check the format.", "error");
      return;
    }
    if (!Array.isArray(parsed)) {
      showAlert("JSON must be an array of { question, answer, ... } objects.", "error");
      return;
    }
    setSaving("bulk");
    try {
      const res = await api.post("/api/admin/bot/knowledge/bulk", { entries: parsed });
      showAlert(`${res.data.inserted} entries imported.`, "success");        if (res.data.errors?.length > 0) {
          showAlert(`${res.data.inserted} imported, ${res.data.errors.length} had errors.`, "error");
        }
      setEditing(null);
      setBulkJson("");
      loadEntries();
    } catch (err) {
      showAlert(err.response?.data?.error || "Import failed.", "error");
    } finally { setSaving(null); }
  };

  const startEdit = (entry) => {
    setForm({
      topic: entry.topic || "",
      question: entry.question || "",
      answer: entry.answer || "",
      category: entry.category || "other",
      tags: (entry.tags || []).join(", "),
      isActive: entry.isActive !== false,
    });
    setEditing(entry._id);
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div className="w-full sm:w-64">
          <SearchBar value={search} onChange={setSearch} placeholder="Search knowledge base…" />
        </div>
        <FilterPills
          options={[
            { value: "", label: "All" },
            ...CATEGORIES.map((c) => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) })),
          ]}
          value={catFilter}
          onChange={setCatFilter}
        />
        <div className="flex items-center gap-2 ml-auto">
          <button onClick={() => { resetForm(); setEditing("add"); }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald text-paper hover:opacity-90 transition-all">
            + Add Entry
          </button>
          <button onClick={() => { setBulkJson(""); setEditing("bulk"); }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gold/10 text-gold border border-gold/20 hover:bg-gold/20 transition-all">
            Bulk Import
          </button>
        </div>
      </div>

      {/* Add form */}
      {editing === "add" && (
        <div className="rounded-xl border-2 border-dashed border-emerald/30 bg-emerald/[0.02] p-5 mb-6 space-y-4">
          <h3 className="font-display text-base font-semibold text-ink">New Knowledge Entry</h3>
          <KnowledgeForm form={form} setForm={setForm} onSave={handleSave} onCancel={() => { setEditing(null); resetForm(); }} saving={saving === "add"} />
        </div>
      )}

      {/* Bulk import */}
      {editing === "bulk" && (
        <div className="rounded-xl border-2 border-dashed border-gold/30 bg-gold/[0.02] p-5 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-ink">Bulk Import</h3>
            <button onClick={() => setEditing(null)} className="p-1 text-ink/30 hover:text-ink">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-ink/40 font-mono">
            Paste a JSON array of objects. Each object must have at least <code>question</code> and <code>answer</code>.
            Optional fields: topic, category, tags (array), isActive.
          </p>
          <textarea value={bulkJson} onChange={(e) => setBulkJson(e.target.value)} rows={8}
            className="w-full rounded-lg border border-ink/15 bg-paper px-3 py-2 text-sm font-mono text-ink focus:outline-none focus:ring-2 focus:ring-emerald/30 focus:border-emerald transition-all"
            placeholder='[\n  { "question": "What is Tawaf?", "answer": "Tawaf is the act of circling the Kaaba seven times...", "category": "ritual", "tags": ["tawaf", "kaaba"] }\n]'
          />
          <div className="flex justify-end gap-3">
            <button onClick={() => setEditing(null)} className="px-4 py-2 rounded-lg text-sm text-ink/50 hover:text-ink">Cancel</button>
            <button onClick={handleBulkImport} disabled={saving === "bulk" || !bulkJson.trim()}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-emerald text-paper hover:opacity-90 disabled:opacity-50 transition-all inline-flex items-center gap-2"
            >
              {saving === "bulk" && <Spinner className="w-4 h-4" />}
              Import
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? <LoadingState /> : entries.length === 0 ? (
        <EmptyState message="No knowledge entries yet." actionLabel="Add your first entry" onAction={() => { resetForm(); setEditing("add"); }} />
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => {
            const isEditing = editing === entry._id;
            return (
              <div key={entry._id} className={`rounded-xl border transition-all ${isEditing ? "border-emerald/30 bg-emerald/[0.02]" : "border-ink/10 bg-paper hover:border-ink/20"}`}>
                {isEditing ? (
                  <div className="p-5">
                    <h3 className="font-display text-base font-semibold text-ink mb-4">Edit Entry</h3>
                    <KnowledgeForm form={form} setForm={setForm} onSave={handleSave} onCancel={() => setEditing(null)} saving={saving === entry._id} />
                  </div>
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${entry.isActive ? "bg-emerald/10 text-emerald border-emerald/20" : "bg-ink/5 text-ink/30 border-ink/10"}`}>
                          {entry.category}
                        </span>
                        {!entry.isActive && (
                          <span className="text-[10px] font-mono text-clay-alert">Inactive</span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-ink truncate mt-1">{entry.question}</p>
                      <p className="text-xs text-ink/40 line-clamp-1 mt-0.5">{entry.answer}</p>
                      {entry.tags?.length > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          {entry.tags.slice(0, 3).map((tag, i) => (
                            <span key={i} className="px-1.5 py-0.5 rounded bg-ink/5 text-[10px] text-ink/40">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => startEdit(entry)} className="p-2 rounded hover:bg-emerald/10 text-ink/30 hover:text-emerald">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                        </svg>
                      </button>
                      <button onClick={() => setDeleteTarget(entry)} className="p-2 rounded hover:bg-clay-alert/5 text-ink/30 hover:text-clay-alert">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog open={!!deleteTarget} title="Delete Entry" message={`Delete "${deleteTarget?.question?.slice(0, 60)}…"? This cannot be undone.`}
        onConfirm={handleDeleteConfirm} onCancel={() => setDeleteTarget(null)} loading={deleting} />
    </div>
  );
}

function KnowledgeForm({ form, setForm, onSave, onCancel, saving }) {
  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-ink/50 mb-1">Topic</label>
          <input value={form.topic} onChange={(e) => set("topic", e.target.value)}
            className="w-full rounded-lg border border-ink/15 bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-emerald/30 transition-all" placeholder="e.g. Tawaf" />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink/50 mb-1">Category</label>
          <select value={form.category} onChange={(e) => set("category", e.target.value)}
            className="w-full rounded-lg border border-ink/15 bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-emerald/30 transition-all">
            {CATEGORIES.map((c) => (<option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-ink/50 mb-1">Question *</label>
        <input value={form.question} onChange={(e) => set("question", e.target.value)}
          className="w-full rounded-lg border border-ink/15 bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-emerald/30 transition-all" placeholder="e.g. What are the steps of Umrah?" />
      </div>
      <div>
        <label className="block text-xs font-medium text-ink/50 mb-1">Answer *</label>
        <textarea value={form.answer} onChange={(e) => set("answer", e.target.value)} rows={4}
          className="w-full rounded-lg border border-ink/15 bg-paper px-3 py-2 text-sm text-ink resize-y focus:outline-none focus:ring-2 focus:ring-emerald/30 transition-all" placeholder="Detailed answer…" />
      </div>
      <div>
        <label className="block text-xs font-medium text-ink/50 mb-1">Tags (comma-separated)</label>
        <input value={form.tags} onChange={(e) => set("tags", e.target.value)}
          className="w-full rounded-lg border border-ink/15 bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-emerald/30 transition-all" placeholder="tawaf, kaaba, circumambulation" />
      </div>
      <div className="flex items-center gap-2">
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} className="sr-only peer" />
          <div className="w-9 h-5 bg-ink/15 rounded-full peer peer-checked:bg-emerald after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
        </label>
        <span className="text-xs text-ink/50">Active (visible to chatbot)</span>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm text-ink/50 hover:text-ink">Cancel</button>
        <button onClick={onSave} disabled={saving || !form.question.trim() || !form.answer.trim()}
          className="px-4 py-2 rounded-lg text-sm font-semibold bg-emerald text-paper hover:opacity-90 disabled:opacity-50 transition-all inline-flex items-center gap-2"
        >
          {saving && <Spinner className="w-4 h-4" />}
          Save
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  Persona Tab
// ══════════════════════════════════════════════════════════════

function ConfigTab() {
  const { addAlert: showAlert } = useAlert();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [fallbackMessage, setFallbackMessage] = useState("");
  const [matchThreshold, setMatchThreshold] = useState(0.12);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/api/admin/bot/config")
      .then((res) => {
        setConfig(res.data);
        setSystemPrompt(res.data.systemPrompt || "");
        setFallbackMessage(res.data.fallbackMessage || "");
        setMatchThreshold(res.data.matchThreshold ?? 0.12);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch("/api/admin/bot/config", { systemPrompt, fallbackMessage, matchThreshold });
      showAlert("Persona settings saved.", "success");
      const res = await api.get("/api/admin/bot/config");
      setConfig(res.data);
    } catch (err) {
      showAlert(err.response?.data?.error || "Failed to save.", "error");
    } finally { setSaving(false); }
  };

  const hasChanges =
    systemPrompt !== (config?.systemPrompt || "") ||
    fallbackMessage !== (config?.fallbackMessage || "") ||
    matchThreshold !== (config?.matchThreshold ?? 0.12);

  if (loading) return <LoadingState />;

  return (
    <div className="max-w-2xl space-y-6">
      {/* System Prompt */}
      <div className="rounded-xl border border-ink/10 bg-paper p-5 space-y-4">
        <h3 className="font-display text-base font-semibold text-ink">System Prompt</h3>
        <p className="text-xs text-ink/40 font-mono leading-relaxed">
          This is the base persona and instructions given to the AI for every conversation.
          It defines the chatbot's scope, tone, and limitations. The knowledge base entries
          are injected as additional grounding context on top of this. Keep it focused on
          Hajj/Umrah pilgrimage scope.
        </p>
        <textarea value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} rows={14}
          className="w-full rounded-lg border border-ink/15 bg-paper px-3 py-2 text-sm text-ink font-mono leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-emerald/30 focus:border-emerald transition-all"
        />
      </div>

      {/* Fallback Message */}
      <div className="rounded-xl border border-ink/10 bg-paper p-5 space-y-4">
        <h3 className="font-display text-base font-semibold text-ink">Fallback Message</h3>
        <p className="text-xs text-ink/40 font-mono leading-relaxed">
          This message is shown when the knowledge base has no confident match for the user's
          question. Make it clear, helpful, and encouraging — it may prompt them to rephrase.
        </p>
        <textarea value={fallbackMessage} onChange={(e) => setFallbackMessage(e.target.value)} rows={3}
          className="w-full rounded-lg border border-ink/15 bg-paper px-3 py-2 text-sm text-ink resize-y focus:outline-none focus:ring-2 focus:ring-emerald/30 focus:border-emerald transition-all"
          placeholder="I don't have a trained answer for that yet. Please try rephrasing your question or ask about Hajj and Umrah rituals."
        />
      </div>

      {/* Match Threshold slider */}
      <div className="rounded-xl border border-ink/10 bg-paper p-5 space-y-4">
        <h3 className="font-display text-base font-semibold text-ink">Match Threshold</h3>
        <p className="text-xs text-ink/40 font-mono leading-relaxed">
          Controls how confident the bot must be before answering from the knowledge base.
          <br />
          <strong>Lower</strong> = answers more often but may be less relevant (will still try to use the closest match).
          <br />
          <strong>Higher</strong> = only answers when very sure; falls back to the fallback message more frequently.
        </p>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={matchThreshold}
              onChange={(e) => setMatchThreshold(parseFloat(e.target.value))}
              className="w-full accent-emerald"
            />
          </div>
          <span className="text-sm font-mono font-bold text-ink w-12 text-right">{matchThreshold.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-[10px] font-mono text-ink/20">
          <span>0.00 — Match anything</span>
          <span>1.00 — Exact match only</span>
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center justify-between pt-2">
        <div className="text-xs text-ink/20 font-mono">
          {config?.updatedAt && (
            <span>Last updated: {new Date(config.updatedAt).toLocaleString()}</span>
          )}
        </div>
        <button onClick={handleSave} disabled={!hasChanges || saving}
          className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-emerald text-paper hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all inline-flex items-center gap-2 shadow-sm"
        >
          {saving && <Spinner className="w-4 h-4" />}
          Save Changes
        </button>
      </div>

      {/* Info note */}
      <div className="rounded-xl border border-emerald/10 bg-emerald/[0.02] p-4 text-xs text-ink/50">
        <p className="font-medium text-emerald mb-1">⚡ Changes take effect immediately</p>
        <p>Persona settings and knowledge base are read from the database on every chat request. No restart or redeploy needed.</p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  Test & Logs Tab
// ══════════════════════════════════════════════════════════════

function TestAndLogsTab({ onTrainThis }) {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Logs
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsPage, setLogsPage] = useState(1);
  const [logsPagination, setLogsPagination] = useState(null);

  const loadLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const res = await api.get(`/api/admin/bot/logs?page=${logsPage}&limit=15`);
      setLogs(res.data.logs);
      setLogsPagination(res.data.pagination);
    } catch { /* empty */ } finally { setLogsLoading(false); }
  }, [logsPage]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const handleTest = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await api.post("/api/admin/bot/test", { question: question.trim() });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Test failed.");
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-3xl space-y-8">
      {/* ── Test Console ── */}
      <div>
        <p className="text-sm text-ink/50 font-mono mb-4">
          Test how the chatbot responds to a question using the current knowledge base, threshold, and system prompt.
        </p>

        {/* Input */}
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={2}
              className="w-full rounded-xl border border-ink/15 bg-paper px-4 py-3 text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-emerald/30 focus:border-emerald transition-all resize-none"
              placeholder="Type a test question…"
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleTest(); } }}
            />
          </div>
          <button onClick={handleTest} disabled={loading || !question.trim()}
            className="px-5 py-3 rounded-xl bg-emerald text-paper text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition-all inline-flex items-center gap-2"
          >
            {loading ? <Spinner className="w-4 h-4" /> : "Test"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-xl border border-clay-alert/15 bg-clay-alert/[0.03] px-4 py-3 text-sm text-clay-alert">
            {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="mt-6 space-y-4">
            {/* Mode badge + usedFallback indicator */}
            <div className="flex items-center gap-3">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                result.mode === "llm-grounded"
                  ? "bg-emerald/10 text-emerald border-emerald/20"
                  : result.mode === "extractive"
                    ? "bg-gold/10 text-gold border-gold/20"
                    : "bg-clay-alert/10 text-clay-alert border-clay-alert/20"
              }`}>
                {result.mode === "llm-grounded"
                  ? "🤖 LLM Grounded"
                  : result.mode === "extractive"
                    ? "📄 Extractive"
                    : "⚠️ Fallback"}
              </span>
              {result.usedFallback && (
                <span className="px-2.5 py-1 rounded-full bg-clay-alert/10 text-clay-alert border border-clay-alert/20 text-[10px] font-semibold">
                  Fallback triggered
                </span>
              )}
            </div>

            {/* Answer */}
            <div className="rounded-xl border border-ink/10 bg-sand/30 p-5">
              <p className="text-[10px] font-mono text-ink/30 uppercase tracking-wider mb-3">Answer</p>
              <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">{result.answer}</p>
            </div>

            {/* Matched entries */}
            <div className="rounded-xl border border-ink/10 bg-paper p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-mono text-ink/30 uppercase tracking-wider">
                  Knowledge Matches ({result.matched?.length || 0})
                </p>
                <span className="text-[10px] font-mono text-ink/20">
                  {result.matched?.length > 0 ? "Retrieval active" : "No match — fallback"}
                </span>
              </div>
              {result.matched?.length > 0 ? (
                <div className="space-y-2">
                  {result.matched.map((m, i) => (
                    <div key={i} className="rounded-lg border border-ink/5 bg-ink/[0.02] p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-semibold text-emerald uppercase truncate max-w-[180px]">
                          {m.question.slice(0, 60)}
                        </span>
                        <span className="text-[10px] font-mono text-ink/20 flex-shrink-0 ml-2">
                          Score: {(m.score * 100).toFixed(0)}%
                        </span>
                      </div>
                      <p className="text-[11px] text-ink/50 font-mono truncate">ID: {m.id}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-xs text-ink/30 font-mono">
                    No knowledge base entries matched the threshold. The fallback message was used.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Divider ── */}
      <hr className="border-ink/5" />

      {/* ── Chat Logs Feed ── */}
      <div>
        <h3 className="font-display text-base font-semibold text-ink mb-1">Recent Client Questions</h3>
        <p className="text-xs text-ink/40 font-mono mb-4">
          Real questions pilgrims are asking. Fallback-triggering questions are flagged in amber —
          these are the best candidates for training next.
        </p>

        {logsLoading ? (
          <div className="flex justify-center py-8">
            <Spinner className="w-6 h-6 text-emerald" />
          </div>
        ) : logs.length === 0 ? (
          <p className="text-xs text-ink/30 text-center py-8 font-mono">No chat logs yet.</p>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log._id}
                className={`rounded-xl border px-4 py-3 transition-all ${
                  log.usedFallback
                    ? "border-clay-alert/20 bg-clay-alert/[0.02]"
                    : "border-ink/10 bg-paper hover:border-ink/20"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {/* Fallback marker */}
                      {log.usedFallback && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-clay-alert/10 text-clay-alert border border-clay-alert/20 text-[10px] font-semibold">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                          </svg>
                          Needs training
                        </span>
                      )}
                      {log.matchedIds?.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald/10 text-emerald border border-emerald/20 text-[10px] font-semibold">
                          Matched {log.matchedIds.length}
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-ink/20 ml-auto">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-ink truncate">{log.question}</p>
                    <p className="text-xs text-ink/40 line-clamp-1 mt-0.5">{log.answer}</p>
                  </div>

                  {/* Train this button — only for fallback-triggering questions */}
                  {log.usedFallback && onTrainThis && (
                    <button
                      onClick={() => onTrainThis(log.question)}
                      className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-clay-alert/10 text-clay-alert text-[11px] font-semibold hover:bg-clay-alert/20 transition-colors whitespace-nowrap"
                      title="Train this question"
                    >
                      + Train
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {logsPagination && logsPagination.pages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-4">
            <button disabled={logsPage <= 1} onClick={() => setLogsPage((p) => p - 1)}
              className="px-3 py-1.5 rounded-lg border border-ink/15 text-xs font-medium text-ink/50 hover:text-ink hover:border-ink/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Prev
            </button>
            <span className="text-xs text-ink/30 font-mono">
              {logsPage} / {logsPagination.pages}
            </span>
            <button disabled={logsPage >= logsPagination.pages} onClick={() => setLogsPage((p) => p + 1)}
              className="px-3 py-1.5 rounded-lg border border-ink/15 text-xs font-medium text-ink/50 hover:text-ink hover:border-ink/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  Main AdminBotTrainer
// ══════════════════════════════════════════════════════════════

export default function AdminBotTrainer() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("knowledge");
  const [prefillQuestion, setPrefillQuestion] = useState(null);

  // 'Train this' handler — switches to Knowledge Base tab with pre-filled question
  const handleTrainThis = (question) => {
    setPrefillQuestion(question);
    setActiveTab("knowledge");
  };

  return (
    <div>
      <HeaderSection
        title={t("admin.botTrainer", "Bot Trainer")}
        description={t("admin.botTrainerDesc", "Train and fine-tune the AI pilgrimage assistant.")}
      />

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-ink/10">
        {TABS.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${
              activeTab === tab.key
                ? "text-emerald border-emerald"
                : "text-ink/40 hover:text-ink border-transparent"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "knowledge" && <KnowledgeTab key={prefillQuestion ? "prefilled" : "default"} prefillQuestion={prefillQuestion} />}
      {activeTab === "config" && <ConfigTab />}
      {activeTab === "test" && <TestAndLogsTab onTrainThis={handleTrainThis} />}
    </div>
  );
}
