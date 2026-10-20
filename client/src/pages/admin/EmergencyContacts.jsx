"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import api from "../../services/api";
import { useAlert } from "../../components/Alert";
import {
  HeaderSection, AddButton, SearchBar, FilterPills,
  LoadingState, EmptyState, ConfirmDialog, Spinner,
} from "../../components/AdminResourceTable";

export default function AdminEmergency() {
  const { t } = useTranslation();  const { addAlert: showAlert } = useAlert();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [saving, setSaving] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Inline edit state: { id: string } | null
  const [editing, setEditing] = useState(null);
  const [editData, setEditData] = useState({});

  // Add modal state
  const [showAdd, setShowAdd] = useState(false);
  const [addData, setAddData] = useState({ name: "", category: "medical", phoneNumber: "", region: "" });

  const loadContacts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (categoryFilter) params.category = categoryFilter;
      const res = await api.get("/api/admin/emergency", { params });
      setContacts(res.data.contacts);
    } catch { /* empty */ } finally { setLoading(false); }
  }, [categoryFilter]);

  useEffect(() => { loadContacts(); }, [loadContacts]);

  // ── Start inline edit ──
  const startEdit = (contact) => {
    setEditing(contact._id);
    setEditData({
      name: contact.name,
      category: contact.category,
      phoneNumber: contact.phoneNumber,
      region: contact.region || "",
    });
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditData({});
  };

  // ── Save inline edit ──
  const handleSave = async (id) => {
    if (!editData.name.trim() || !editData.phoneNumber.trim()) {
      showAlert("Name and phone number are required.", "error");
      return;
    }
    setSaving(id);
    try {
      await api.put(`/api/admin/emergency/${id}`, editData);
      showAlert("Contact updated.", "success");
      setEditing(null);
      loadContacts();
    } catch (err) {
      showAlert(err.response?.data?.error || "Failed to update.", "error");
    } finally { setSaving(null); }
  };

  // ── Add ──
  const handleAdd = async () => {
    if (!addData.name.trim() || !addData.phoneNumber.trim()) {
      showAlert("Name and phone number are required.", "error");
      return;
    }
    setSaving("add");
    try {
      await api.post("/api/admin/emergency", addData);
      showAlert("Contact created.", "success");
      setShowAdd(false);
      setAddData({ name: "", category: "medical", phoneNumber: "", region: "" });
      loadContacts();
    } catch (err) {
      showAlert(err.response?.data?.error || "Failed to create.", "error");
    } finally { setSaving(null); }
  };

  // ── Delete ──
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/api/admin/emergency/${deleteTarget._id}`);
      showAlert("Contact deleted.", "success");
      setDeleteTarget(null);
      loadContacts();
    } catch (err) {
      showAlert(err.response?.data?.error || "Failed to delete.", "error");
    } finally { setDeleting(false); }
  };

  // ── Category badge classes ──
  const badgeClass = (cat) => {
    switch (cat) {
      case "medical": return "bg-clay-alert/10 text-clay-alert border-clay-alert/20";
      case "helpline": return "bg-gold/10 text-gold border-gold/20";
      case "embassy": return "bg-emerald/10 text-emerald border-emerald/20";
      default: return "bg-ink/5 text-ink/40 border-ink/10";
    }
  };

  return (
    <div>
      <HeaderSection
        title={t("admin.emergency", "Emergency Contacts")}
        description={t("admin.emergencyDesc", "Manage emergency contact numbers for pilgrims.")}
        actions={<AddButton label="Add Contact" onClick={() => setShowAdd(true)} />}
      />

      {/* Category filter */}
      <div className="mb-6">
        <FilterPills
          options={[
            { value: "", label: "All" },
            { value: "medical", label: "Medical" },
            { value: "helpline", label: "Helpline" },
            { value: "embassy", label: "Embassy" },
          ]}
          value={categoryFilter}
          onChange={setCategoryFilter}
        />
      </div>

      {/* Add form modal/section */}
      {showAdd && (
        <div className="rounded-xl border-2 border-dashed border-emerald/30 bg-emerald/[0.02] p-5 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-ink">New Contact</h3>
            <button onClick={() => setShowAdd(false)} className="p-1 text-ink/30 hover:text-ink">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-ink/50 mb-1">Name *</label>
              <input value={addData.name} onChange={(e) => setAddData((p) => ({ ...p, name: e.target.value }))}
                className="w-full rounded-lg border border-ink/15 bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-emerald/30 transition-all"
                placeholder="Contact name" />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink/50 mb-1">Category *</label>
              <select value={addData.category} onChange={(e) => setAddData((p) => ({ ...p, category: e.target.value }))}
                className="w-full rounded-lg border border-ink/15 bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-emerald/30 transition-all"
              >
                <option value="medical">Medical</option>
                <option value="helpline">Helpline</option>
                <option value="embassy">Embassy</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink/50 mb-1">Phone Number *</label>
              <input value={addData.phoneNumber} onChange={(e) => setAddData((p) => ({ ...p, phoneNumber: e.target.value }))}
                className="w-full rounded-lg border border-ink/15 bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-emerald/30 transition-all"
                placeholder="+966 XX XXX XXXX" />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink/50 mb-1">Region</label>
              <input value={addData.region} onChange={(e) => setAddData((p) => ({ ...p, region: e.target.value }))}
                className="w-full rounded-lg border border-ink/15 bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-emerald/30 transition-all"
                placeholder="e.g. Makkah, Madinah" />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-lg text-sm text-ink/50 hover:text-ink">Cancel</button>
            <button onClick={handleAdd} disabled={saving === "add"}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-emerald text-paper hover:opacity-90 disabled:opacity-50 transition-all inline-flex items-center gap-2"
            >
              {saving === "add" && <Spinner className="w-4 h-4" />}
              Create Contact
            </button>
          </div>
        </div>
      )}

      {loading ? <LoadingState /> : (
        <div className="space-y-2">
          {contacts.length === 0 && !showAdd ? (
            <EmptyState message="No contacts found." actionLabel="Add the first contact" onAction={() => setShowAdd(true)} />
          ) : (
            contacts.map((contact) => {
              const isEditing = editing === contact._id;
              return (
                <div key={contact._id} className={`rounded-xl border transition-all ${
                  isEditing ? "border-emerald/30 bg-emerald/[0.02] shadow-sm" : "border-ink/10 bg-paper hover:border-ink/20"
                }`}>
                  <div className="flex items-center gap-3 px-4 py-3">
                    {/* Category badge */}
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border flex-shrink-0 ${badgeClass(contact.category)}`}>
                      {contact.category}
                    </span>

                    {/* Fields */}
                    <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {isEditing ? (
                        <>
                          <input value={editData.name} onChange={(e) => setEditData((p) => ({ ...p, name: e.target.value }))}
                            className="rounded-lg border border-ink/15 bg-paper px-2 py-1 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-emerald/30 transition-all" />
                          <input value={editData.phoneNumber} onChange={(e) => setEditData((p) => ({ ...p, phoneNumber: e.target.value }))}
                            className="rounded-lg border border-ink/15 bg-paper px-2 py-1 text-sm text-ink font-mono focus:outline-none focus:ring-2 focus:ring-emerald/30 transition-all" />
                          <input value={editData.region} onChange={(e) => setEditData((p) => ({ ...p, region: e.target.value }))}
                            className="rounded-lg border border-ink/15 bg-paper px-2 py-1 text-sm text-ink/60 focus:outline-none focus:ring-2 focus:ring-emerald/30 transition-all" />
                        </>
                      ) : (
                        <>
                          <span className="text-sm font-medium text-ink truncate">{contact.name}</span>
                          <span className="text-sm font-mono text-ink/60">{contact.phoneNumber}</span>
                          <span className="text-sm text-ink/40 truncate">{contact.region || "—"}</span>
                        </>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {isEditing ? (
                        <>
                          <button onClick={cancelEdit} className="p-2 rounded hover:bg-ink/5 text-ink/30 hover:text-ink transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                          <button onClick={() => handleSave(contact._id)} disabled={saving === contact._id}
                            className="p-2 rounded hover:bg-emerald/10 text-emerald transition-colors"
                          >
                            {saving === contact._id ? <Spinner className="w-4 h-4" /> : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              </svg>
                            )}
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(contact)} className="p-2 rounded hover:bg-emerald/10 text-ink/30 hover:text-emerald transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                            </svg>
                          </button>
                          <button onClick={() => setDeleteTarget(contact)} className="p-2 rounded hover:bg-clay-alert/5 text-ink/30 hover:text-clay-alert transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Contact"
        message={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
