import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { useAlert } from "../components/Alert";

// ── Spinner ──
function Spinner({ className = "w-5 h-5" }) {
  return (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ── Media uploader widget ──
function MediaUploader({ label, accept, currentUrl, onUrlChange }) {
  const { t } = useTranslation();
  const { addAlert: showAlert } = useAlert();
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/api/admin/upload", formData);
      onUrlChange(res.data.url);
      showAlert(t("admin.uploadSuccess", "File uploaded."), "success");
    } catch (err) {
      const msg = err.response?.data?.error || t("admin.uploadFailed", "Upload failed.");
      showAlert(msg, "error");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs text-stone mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={currentUrl}
          onChange={(e) => onUrlChange(e.target.value)}
          className="input-night flex-1 text-sm"
          placeholder="https://... or upload a file"
        />
        <label className={`flex-shrink-0 cursor-pointer btn-outline text-xs px-3 py-2 rounded-lg ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
          {uploading ? <Spinner className="w-4 h-4" /> : t("admin.upload", "Upload")}
          <input type="file" accept={accept} onChange={handleFile} className="hidden" />
        </label>
      </div>
      {/* Preview */}
      {currentUrl && (
        <div className="mt-1">
          {currentUrl.match(/\.(jpe?g|png|webp|gif)(\?.*)?$/i) ? (
            <img src={currentUrl} alt="preview" className="max-h-24 rounded-lg object-cover border border-lantern/10" />
          ) : currentUrl.match(/\.(mp4|webm|ogg)(\?.*)?$/i) ? (
            <video src={currentUrl} controls className="max-h-24 rounded-lg border border-lantern/10 w-full max-w-xs" />
          ) : currentUrl.match(/\.(mp3|wav|ogg|webm)(\?.*)?$/i) ? (
            <audio src={currentUrl} controls className="w-full max-w-xs h-8" />
          ) : null}
        </div>
      )}
    </div>
  );
}

// ── Stat card ──
function StatCard({ label, value, icon }) {
  return (
    <div className="glass-card rounded-xl p-5 flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-lantern/10 flex items-center justify-center text-lantern flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-dune font-mono">{value}</p>
        <p className="text-xs text-stone">{label}</p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TAB: Dashboard
// ══════════════════════════════════════════════════════════════

function DashboardTab() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/api/admin/dashboard");
        setData(res.data);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner className="w-8 h-8 text-lantern" /></div>;
  }

  if (!data) {
    return <p className="text-stone text-center py-20">{t("admin.dashboardError", "Failed to load dashboard.")}</p>;
  }

  const { stats, recentUsers, recentChats } = data;

  return (
    <div className="space-y-8">
      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t("admin.totalUsers", "Total Users")}
          value={stats.totalUsers}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          }
        />
        <StatCard
          label={t("admin.adminUsers", "Admins")}
          value={stats.adminUsers}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          }
        />
        <StatCard
          label={t("admin.totalSteps", "Ritual Steps")}
          value={stats.totalRitualSteps}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
        <StatCard
          label={t("admin.totalPlans", "Plans Generated")}
          value={stats.totalPlans}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
      </div>

      {/* Hajj / Umrah breakdown */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="font-display text-lg font-bold text-dune mb-4">{t("admin.stepsBreakdown", "Steps Breakdown")}</h3>
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-lantern" />
            <span className="text-sm text-dune">{t("nav.hajj")}: <strong className="font-mono">{stats.hajjSteps}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-horizon-teal" />
            <span className="text-sm text-dune">{t("nav.umrah")}: <strong className="font-mono">{stats.umrahSteps}</strong></span>
          </div>
        </div>
      </div>

      {/* Recent users */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="font-display text-lg font-bold text-dune mb-4">{t("admin.recentUsers", "Recent Registrations")}</h3>
        {recentUsers.length === 0 ? (
          <p className="text-stone text-sm">{t("admin.noUsers", "No users yet.")}</p>
        ) : (
          <div className="space-y-2">
            {recentUsers.map((u) => (
              <div key={u._id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div>
                  <p className="text-sm text-dune font-medium">{u.fullName}</p>
                  <p className="text-xs text-stone">{u.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${u.role === "admin" ? "bg-lantern/20 text-lantern" : "bg-white/10 text-stone"}`}>
                    {u.role}
                  </span>
                  <span className="text-[10px] text-stone">{new Date(u.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent chat queries */}
      {recentChats && recentChats.length > 0 && (
        <div className="glass-card rounded-xl p-5">
          <h3 className="font-display text-lg font-bold text-dune mb-4">{t("admin.recentChats", "Recent AI Queries")}</h3>
          <div className="space-y-2">
            {recentChats.map((c) => (
              <div key={c._id} className="py-2 border-b border-white/5 last:border-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-stone font-medium">{c.userId?.fullName || "Unknown"}</span>
                  <span className="text-[10px] text-stone">{new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-dune truncate">{c.question}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TAB: Ritual Steps (existing functionality + file upload)
// ══════════════════════════════════════════════════════════════

function StepModal({ step, onClose, onSaved, type }) {
  const { t } = useTranslation();
  const { addAlert: showAlert } = useAlert();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: step?.name || "",
    description: step?.description || "",
    location: step?.location || "",
    order: step?.order || 1,
    imageUrl: step?.mediaUrls?.image || "",
    videoUrl: step?.mediaUrls?.video || "",
    audioDuaUrl: step?.mediaUrls?.audioDua || "",
    commonErrors: step?.commonErrors?.join("\n") || "",
  });

  const update = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));
  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    if (!form.name.trim() || !form.description.trim() || !form.location.trim()) {
      showAlert(t("admin.fillRequired", "Please fill in name, description, and location."), "error");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ritualType: type,
        order: Number(form.order),
        name: form.name.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        mediaUrls: {
          image: form.imageUrl.trim(),
          video: form.videoUrl.trim(),
          audioDua: form.audioDuaUrl.trim(),
        },
        commonErrors: form.commonErrors.split("\n").map((s) => s.trim()).filter(Boolean),
      };
      if (step) {
        await api.put(`/api/admin/rituals/${step._id}`, payload);
        showAlert(t("admin.stepUpdated", "Step updated."), "success");
      } else {
        await api.post("/api/admin/rituals", payload);
        showAlert(t("admin.stepCreated", "Step created."), "success");
      }
      onSaved();
    } catch (err) {
      const msg = err.response?.data?.error || t("admin.saveFailed", "Failed to save.");
      showAlert(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 px-4 overflow-y-auto bg-night/80 backdrop-blur-sm">
      <div className="glass-card rounded-2xl p-6 lg:p-8 w-full max-w-3xl my-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-bold text-dune">
            {step ? t("admin.editStep", "Edit Step") : t("admin.addStep", "Add Step")}
          </h2>
          <button onClick={onClose} className="p-2 rounded hover:bg-white/10 transition-colors text-stone hover:text-dune">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone mb-1 uppercase tracking-wider">{t("admin.name", "Name")}</label>
              <input name="name" value={form.name} onChange={handleChange} className="input-night w-full text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone mb-1 uppercase tracking-wider">{t("admin.order", "Order")}</label>
              <input name="order" type="number" value={form.order} onChange={handleChange} className="input-night w-full text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone mb-1 uppercase tracking-wider">{t("admin.location", "Location")}</label>
            <input name="location" value={form.location} onChange={handleChange} className="input-night w-full text-sm" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone mb-1 uppercase tracking-wider">{t("admin.description", "Description")}</label>
            <textarea name="description" rows={4} value={form.description} onChange={handleChange} className="input-night w-full text-sm resize-y" />
          </div>

          {/* Media with file upload */}
          <div className="border-t border-lantern/10 pt-4">
            <h3 className="text-sm font-semibold text-dune mb-4">{t("admin.mediaUrls", "Media Files")}</h3>
            <div className="space-y-4">
              <MediaUploader
                label={t("admin.imageUrl", "Image")}
                accept="image/*"
                currentUrl={form.imageUrl}
                onUrlChange={update("imageUrl")}
              />
              <MediaUploader
                label={t("admin.videoUrl", "Video Guide")}
                accept="video/*"
                currentUrl={form.videoUrl}
                onUrlChange={update("videoUrl")}
              />
              <MediaUploader
                label={t("admin.audioUrl", "Audio Du'a")}
                accept="audio/*"
                currentUrl={form.audioDuaUrl}
                onUrlChange={update("audioDuaUrl")}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone mb-1 uppercase tracking-wider">{t("admin.commonErrors", "Common Mistakes (one per line)")}</label>
            <textarea name="commonErrors" rows={3} value={form.commonErrors} onChange={handleChange} className="input-night w-full text-sm resize-y" />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          <button onClick={onClose} className="btn-outline text-sm px-5 py-2">{t("admin.cancel", "Cancel")}</button>
          <button onClick={handleSave} disabled={saving} className="btn-lantern text-sm px-5 py-2 min-w-[100px] flex items-center justify-center gap-2">
            {saving && <Spinner />}
            {step ? t("admin.save", "Save") : t("admin.create", "Create")}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({ step, onClose, onDeleted }) {
  const { t } = useTranslation();
  const { addAlert: showAlert } = useAlert();
  const [deleting, setDeleting] = useState(false);
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/api/admin/rituals/${step._id}`);
      showAlert(t("admin.stepDeleted", "Step deleted."), "success");
      onDeleted();
    } catch (err) {
      const msg = err.response?.data?.error || t("admin.deleteFailed", "Failed to delete.");
      showAlert(msg, "error");
      setDeleting(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-night/80 backdrop-blur-sm">
      <div className="glass-card rounded-2xl p-6 w-full max-w-sm text-center">
        <div className="w-12 h-12 rounded-full bg-clay-alert/10 flex items-center justify-center mx-auto mb-4 text-clay-alert">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-dune mb-2">{t("admin.confirmDelete", "Delete Step?")}</h3>
        <p className="text-sm text-stone mb-6">
          {t("admin.deleteWarning", "Are you sure you want to delete")} <strong className="text-dune">{step.name}</strong>?
        </p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={onClose} className="btn-outline text-sm px-5 py-2">{t("admin.cancel", "Cancel")}</button>
          <button onClick={handleDelete} disabled={deleting} className="bg-clay-alert text-sm font-semibold px-5 py-2 rounded-lg hover:bg-clay-alert/80 transition-colors flex items-center gap-2 min-w-[100px] justify-center">
            {deleting && <Spinner className="w-4 h-4" />}
            {t("admin.delete", "Delete")}
          </button>
        </div>
      </div>
    </div>
  );
}

function StepRow({ step, onEdit, onDelete, onMoveUp, onMoveDown, isFirst, isLast }) {
  return (
    <div className="glass-card rounded-xl p-4 flex items-center gap-4">
      <div className="flex flex-col gap-0.5">
        <button onClick={() => onMoveUp(step)} disabled={isFirst} className="p-1 rounded hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-colors text-stone hover:text-dune">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
        </button>
        <button onClick={() => onMoveDown(step)} disabled={isLast} className="p-1 rounded hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-colors text-stone hover:text-dune">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </button>
      </div>
      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-lantern/10 border border-lantern/20 flex items-center justify-center text-lantern text-sm font-bold">{step.order}</span>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-dune truncate">{step.name}</h3>
        <p className="text-xs text-stone truncate">{step.location}</p>
        <div className="flex items-center gap-2 mt-1">
          {step.mediaUrls?.image && <span className="text-[10px] text-lantern font-medium">🖼</span>}
          {step.mediaUrls?.video && <span className="text-[10px] text-lantern font-medium">🎬</span>}
          {step.mediaUrls?.audioDua && <span className="text-[10px] text-lantern font-medium">🎵</span>}
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button onClick={() => onEdit(step)} className="p-2 rounded hover:bg-lantern/10 transition-colors text-stone hover:text-lantern" title="Edit">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
        </button>
        <button onClick={() => onDelete(step)} className="p-2 rounded hover:bg-clay-alert/10 transition-colors text-stone hover:text-clay-alert" title="Delete">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      </div>
    </div>
  );
}

function StepsTab() {
  const { t } = useTranslation();
  const [type, setType] = useState("hajj");
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingStep, setEditingStep] = useState(null);
  const [deletingStep, setDeletingStep] = useState(null);
  const [adding, setAdding] = useState(false);

  const loadSteps = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/admin/rituals?type=${type}`);
      setSteps(res.data.steps);
    } catch { /* empty */ } finally { setLoading(false); }
  }, [type]);

  useEffect(() => { loadSteps(); }, [loadSteps]);

  const handleMoveUp = async (step) => {
    const idx = steps.indexOf(step);
    if (idx <= 0) return;
    const reordered = [...steps];
    [reordered[idx - 1], reordered[idx]] = [reordered[idx], reordered[idx - 1]];
    try {
      await api.patch("/api/admin/rituals/reorder", { type, stepIds: reordered.map((s) => s._id) });
      setSteps(reordered);
    } catch { loadSteps(); }
  };

  const handleMoveDown = async (step) => {
    const idx = steps.indexOf(step);
    if (idx >= steps.length - 1) return;
    const reordered = [...steps];
    [reordered[idx], reordered[idx + 1]] = [reordered[idx + 1], reordered[idx]];
    try {
      await api.patch("/api/admin/rituals/reorder", { type, stepIds: reordered.map((s) => s._id) });
      setSteps(reordered);
    } catch { loadSteps(); }
  };

  const handleSaved = () => { setEditingStep(null); setAdding(false); loadSteps(); };
  const handleDeleted = () => { setDeletingStep(null); loadSteps(); };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        {["hajj", "umrah"].map((tpe) => (
          <button key={tpe} onClick={() => setType(tpe)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${type === tpe ? "bg-lantern text-night shadow-md" : "bg-white/5 text-stone hover:text-dune hover:bg-white/10"}`}>
            {t(`nav.${tpe}`)}
          </button>
        ))}
        <div className="flex-1" />
        <button onClick={() => setAdding(true)} className="btn-lantern text-sm px-5 py-2 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          {t("admin.addStep", "Add Step")}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner className="w-8 h-8 text-lantern" /></div>
      ) : steps.length === 0 ? (
        <div className="text-center py-20"><p className="text-stone">{t("admin.noSteps", "No steps yet.")}</p></div>
      ) : (
        <div className="space-y-3">
          {steps.map((step, i) => (
            <StepRow key={step._id} step={step} onEdit={setEditingStep} onDelete={setDeletingStep}
              onMoveUp={handleMoveUp} onMoveDown={handleMoveDown} isFirst={i === 0} isLast={i === steps.length - 1} />
          ))}
        </div>
      )}

      {(editingStep || adding) && (
        <StepModal step={editingStep} type={type} onClose={() => { setEditingStep(null); setAdding(false); }} onSaved={handleSaved} />
      )}
      {deletingStep && <DeleteModal step={deletingStep} onClose={() => setDeletingStep(null)} onDeleted={handleDeleted} />}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TAB: Users
// ══════════════════════════════════════════════════════════════

function UserEditModal({ user, onClose, onSaved }) {
  const { t } = useTranslation();
  const { addAlert: showAlert } = useAlert();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    fullName: user.fullName || "",
    email: user.email || "",
    role: user.role || "pilgrim",
    isVerified: user.isVerified ?? false,
  });

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const toggleVerified = () => setForm((f) => ({ ...f, isVerified: !f.isVerified }));

  const handleSave = async () => {
    if (!form.fullName.trim() || !form.email.trim()) {
      showAlert(t("admin.fillRequired"), "error");
      return;
    }
    setSaving(true);
    try {
      await api.patch(`/api/admin/users/${user._id}`, form);
      showAlert(t("admin.userUpdated", "User updated."), "success");
      onSaved();
    } catch (err) {
      const msg = err.response?.data?.error || t("admin.saveFailed");
      showAlert(msg, "error");
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-night/80 backdrop-blur-sm">
      <div className="glass-card rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-bold text-dune">{t("admin.editUser", "Edit User")}</h2>
          <button onClick={onClose} className="p-2 rounded hover:bg-white/10 transition-colors text-stone hover:text-dune">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone mb-1 uppercase tracking-wider">{t("admin.fullName", "Full Name")}</label>
            <input name="fullName" value={form.fullName} onChange={handleChange} className="input-night w-full text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone mb-1 uppercase tracking-wider">{t("admin.email", "Email")}</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} className="input-night w-full text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone mb-1 uppercase tracking-wider">{t("admin.role", "Role")}</label>
            <select name="role" value={form.role} onChange={handleChange} className="input-night w-full text-sm">
              <option value="pilgrim">Pilgrim</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleVerified} className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${form.isVerified ? "bg-lantern border-lantern" : "border-stone"}`}>
              {form.isVerified && <svg className="w-3 h-3 text-night" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
            </button>
            <span className="text-sm text-dune">{t("admin.verified", "Email Verified")}</span>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 mt-6">
          <button onClick={onClose} className="btn-outline text-sm px-5 py-2">{t("admin.cancel")}</button>
          <button onClick={handleSave} disabled={saving} className="btn-lantern text-sm px-5 py-2 flex items-center gap-2 min-w-[100px] justify-center">
            {saving && <Spinner />}
            {t("admin.save")}
          </button>
        </div>
      </div>
    </div>
  );
}

function UsersTab() {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const { addAlert: showAlert } = useAlert();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/admin/users?page=${page}&limit=20&search=${encodeURIComponent(search)}`);
      setUsers(res.data.users);
      setPagination(res.data.pagination);
    } catch { /* empty */ } finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleDelete = async (userId) => {
    try {
      await api.delete(`/api/admin/users/${userId}`);
      showAlert(t("admin.userDeleted", "User deleted."), "success");
      setDeletingUserId(null);
      loadUsers();
    } catch (err) {
      const msg = err.response?.data?.error || t("admin.deleteFailed");
      showAlert(msg, "error");
    }
  };

  const handlePromote = async (userId, newRole) => {
    try {
      await api.patch(`/api/admin/users/${userId}`, { role: newRole });
      showAlert(t("admin.roleUpdated", "Role updated."), "success");
      loadUsers();
    } catch (err) {
      const msg = err.response?.data?.error || t("admin.saveFailed");
      showAlert(msg, "error");
    }
  };

  return (
    <div>
      {/* Search */}
      <div className="mb-6">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder={t("admin.searchUsers", "Search by name or email...")}
          className="input-night w-full max-w-md text-sm"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner className="w-8 h-8 text-lantern" /></div>
      ) : users.length === 0 ? (
        <div className="text-center py-20"><p className="text-stone">{t("admin.noUsers", "No users found.")}</p></div>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u._id} className="glass-card rounded-xl p-4 flex items-center gap-4">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-lantern/10 flex items-center justify-center text-lantern font-bold text-sm flex-shrink-0">
                {u.fullName.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-dune">{u.fullName}</h3>
                  <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full ${u.role === "admin" ? "bg-lantern/20 text-lantern" : "bg-white/10 text-stone"}`}>
                    {u.role}
                  </span>
                  {u.isVerified && (
                    <svg className="w-3.5 h-3.5 text-horizon-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <p className="text-xs text-stone">{u.email}</p>
                <p className="text-[10px] text-stone mt-0.5">
                  {t("admin.joined", "Joined")}: {new Date(u.createdAt).toLocaleDateString()}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {u.role === "pilgrim" ? (
                  <button onClick={() => handlePromote(u._id, "admin")} className="px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-lantern/10 text-lantern hover:bg-lantern/20 transition-colors"
                    title={t("admin.promoteToAdmin", "Promote to Admin")}>
                    {t("admin.promote", "Promote")}
                  </button>
                ) : (
                  currentUser?._id !== u._id && (
                    <button onClick={() => handlePromote(u._id, "pilgrim")} className="px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-white/10 text-stone hover:bg-clay-alert/20 hover:text-clay-alert transition-colors"
                      title={t("admin.demoteToPilgrim", "Demote to Pilgrim")}>
                      {t("admin.demote", "Demote")}
                    </button>
                  )
                )}

                <button onClick={() => setEditingUser(u)} className="p-2 rounded hover:bg-lantern/10 transition-colors text-stone hover:text-lantern" title={t("admin.edit")}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>

                {currentUser?._id !== u._id && (
                  <button onClick={() => setDeletingUserId(u._id)} className="p-2 rounded hover:bg-clay-alert/10 transition-colors text-stone hover:text-clay-alert" title={t("admin.delete")}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn-outline text-xs px-3 py-1.5 disabled:opacity-30">{t("admin.prev", "Prev")}</button>
          <span className="text-xs text-stone font-mono">{page} / {pagination.pages}</span>
          <button disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)} className="btn-outline text-xs px-3 py-1.5 disabled:opacity-30">{t("admin.next", "Next")}</button>
        </div>
      )}

      {editingUser && <UserEditModal user={editingUser} onClose={() => setEditingUser(null)} onSaved={() => { setEditingUser(null); loadUsers(); }} />}

      {/* Delete user confirm */}
      {deletingUserId && (() => {
        const u = users.find((x) => x._id === deletingUserId);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-night/80 backdrop-blur-sm">
            <div className="glass-card rounded-2xl p-6 w-full max-w-sm text-center">
              <div className="w-12 h-12 rounded-full bg-clay-alert/10 flex items-center justify-center mx-auto mb-4 text-clay-alert">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
              </div>
              <h3 className="text-lg font-semibold text-dune mb-2">{t("admin.confirmDeleteUser", "Delete User?")}</h3>
              <p className="text-sm text-stone mb-6">
                {t("admin.deleteUserWarning", "This will permanently delete")} <strong className="text-dune">{u?.fullName}</strong>. {t("admin.deleteUserDataNote", "All their plans, chats, and data will be removed.")}
              </p>
              <div className="flex items-center justify-center gap-3">
                <button onClick={() => setDeletingUserId(null)} className="btn-outline text-sm px-5 py-2">{t("admin.cancel")}</button>
                <button onClick={() => handleDelete(deletingUserId)} className="bg-clay-alert text-sm font-semibold px-5 py-2 rounded-lg hover:bg-clay-alert/80 transition-colors">{t("admin.delete")}</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// Unauthorized
// ══════════════════════════════════════════════════════════════

function Unauthorized() {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 rounded-full bg-clay-alert/10 flex items-center justify-center mx-auto mb-4 text-clay-alert">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m0-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="font-display text-xl font-bold text-dune mb-2">{t("admin.unauthorized", "Admin Access Required")}</h3>
        <p className="text-sm text-stone leading-relaxed">{t("admin.unauthorizedDesc", "You need admin privileges to access this panel.")}</p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// Main Admin Panel
// ══════════════════════════════════════════════════════════════

const TABS = [
  { key: "dashboard", labelKey: "admin.tabDashboard" },
  { key: "steps", labelKey: "admin.tabSteps" },
  { key: "users", labelKey: "admin.tabUsers" },
];

export default function AdminPanel() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");

  // Guard: non-admin users see unauthorized (after all hooks)
  if (user?.role !== "admin") {
    return <Unauthorized />;
  }

  return (
    <div className="py-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl lg:text-4xl font-bold text-dune">{t("admin.title", "Admin Panel")}</h1>
        <p className="text-sm text-stone mt-1">{t("admin.subtitle", "Manage Hajj & Umrah ritual steps, media, and guides.")}</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-8 border-b border-lantern/10 pb-2 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? "text-lantern border-b-2 border-lantern bg-lantern/5"
                : "text-stone hover:text-dune hover:bg-white/5"
            }`}
          >
            {t(tab.labelKey, tab.key.charAt(0).toUpperCase() + tab.key.slice(1))}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "dashboard" && <DashboardTab />}
      {activeTab === "steps" && <StepsTab />}
      {activeTab === "users" && <UsersTab />}
    </div>
  );
}
