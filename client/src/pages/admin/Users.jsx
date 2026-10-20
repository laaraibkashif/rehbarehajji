"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import { useAlert } from "../../components/Alert";
import {
  HeaderSection, AddButton, SearchBar, FilterPills,
  LoadingState, EmptyState, ConfirmDialog, Spinner,
} from "../../components/AdminResourceTable";

// ── Badge helpers ──
function RoleBadge({ role }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
      role === "admin"
        ? "bg-emerald/10 text-emerald border-emerald/20"
        : "bg-ink/5 text-ink/40 border-ink/10"
    }`}>
      {role}
    </span>
  );
}

function StatusBadge({ active, label, activeLabel, inactiveLabel }) {
  if (active) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald/10 text-emerald border border-emerald/20">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald" />
        {activeLabel || "Active"}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-clay-alert/10 text-clay-alert border border-clay-alert/20">
      <span className="w-1.5 h-1.5 rounded-full bg-clay-alert" />
      {inactiveLabel || "Inactive"}
    </span>
  );
}

function VerifiedBadge({ verified }) {
  if (verified) {
    return (
      <span className="inline-flex items-center gap-1 text-emerald/60">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-[10px] font-medium">Verified</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-ink/30">
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
      <span className="text-[10px] font-medium">Unverified</span>
    </span>
  );
}

// ── DetailPanel — read-only user detail with stats ──
function UserDetailPanel({ userId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    api.get(`/api/admin/users/${userId}`)
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  if (!userId) return null;

  return (
    <>
      <div className="fixed inset-0 z-30 bg-ink/20 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-40 w-full max-w-lg bg-paper border-l border-ink/10 shadow-2xl flex flex-col animate-slideInRight">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink/5 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-ink/50 uppercase tracking-wider font-mono">
              User Details
            </span>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-ink/5 hover:bg-ink/10 flex items-center justify-center text-ink/50 hover:text-ink transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center py-16"><Spinner className="w-8 h-8 text-emerald" /></div>
          ) : data ? (
            <div className="space-y-6">
              {/* User info card */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-emerald/10 flex items-center justify-center text-emerald font-bold text-xl flex-shrink-0">
                  {data.user.fullName?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div>
                  <h2 className="font-display text-xl font-semibold text-ink">{data.user.fullName}</h2>
                  <p className="text-sm text-ink/50 font-mono">{data.user.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <RoleBadge role={data.user.role} />
                    <StatusBadge active={data.user.isActive !== false} />
                    <VerifiedBadge verified={data.user.isVerified} />
                  </div>
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-ink/10 bg-paper p-4">
                  <p className="text-[10px] font-mono text-ink/30 uppercase tracking-wider">Country</p>
                  <p className="text-sm font-medium text-ink mt-1">{data.user.country || "—"}</p>
                </div>
                <div className="rounded-xl border border-ink/10 bg-paper p-4">
                  <p className="text-[10px] font-mono text-ink/30 uppercase tracking-wider">Language</p>
                  <p className="text-sm font-medium text-ink mt-1 uppercase">{data.user.preferredLanguage || "en"}</p>
                </div>
                <div className="rounded-xl border border-ink/10 bg-paper p-4">
                  <p className="text-[10px] font-mono text-ink/30 uppercase tracking-wider">Joined</p>
                  <p className="text-sm font-medium text-ink mt-1 font-mono">{new Date(data.user.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="rounded-xl border border-ink/10 bg-paper p-4">
                  <p className="text-[10px] font-mono text-ink/30 uppercase tracking-wider">Phone</p>
                  <p className="text-sm font-medium text-ink mt-1">{data.user.phone || "—"}</p>
                </div>
              </div>

              {/* Stats */}
              <h3 className="font-display text-base font-semibold text-ink">Activity Summary</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-ink/10 bg-sand/30 p-4 text-center">
                  <p className="text-2xl font-bold font-mono text-emerald">{data.stats?.totalPlans ?? 0}</p>
                  <p className="text-[10px] font-mono text-ink/30 mt-1">Plans</p>
                </div>
                <div className="rounded-xl border border-ink/10 bg-sand/30 p-4 text-center">
                  <p className="text-2xl font-bold font-mono text-gold">{data.stats?.totalChatQueries ?? 0}</p>
                  <p className="text-[10px] font-mono text-ink/30 mt-1">Chat Queries</p>
                </div>
                <div className="rounded-xl border border-ink/10 bg-sand/30 p-4 text-center">
                  <p className="text-2xl font-bold font-mono text-emerald">{data.stats?.totalTawafTaps ?? 0}</p>
                  <p className="text-[10px] font-mono text-ink/30 mt-1">Tawaf Taps</p>
                </div>
              </div>

              {/* Latest plan */}
              {data.latestPlan ? (
                <div className="rounded-xl border border-ink/10 bg-paper p-4">
                  <p className="text-[10px] font-mono text-ink/30 uppercase tracking-wider mb-2">Latest Plan</p>
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-emerald/10 text-emerald border border-emerald/20 capitalize">
                      {data.latestPlan.ritualType}
                    </span>
                    <span className="text-xs text-ink/50 font-mono capitalize">{data.latestPlan.ageGroup}</span>
                    <span className="text-xs text-ink/50 font-mono capitalize">{data.latestPlan.travelMode}</span>
                    <span className="text-xs text-ink/30 font-mono">{data.latestPlan.stepCount} steps</span>
                  </div>
                  <p className="text-[10px] font-mono text-ink/20 mt-2">
                    Created {new Date(data.latestPlan.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-ink/30 text-center py-6 font-mono">No plans created yet.</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-ink/30 text-center py-16 font-mono">Failed to load user data.</p>
          )}
        </div>
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════
//  Main AdminUsers Page
// ══════════════════════════════════════════════════════════════

export default function AdminUsers() {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const { addAlert: showAlert } = useAlert();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  // Detail panel
  const [detailUserId, setDetailUserId] = useState(null);

  // Confirmation dialogs
  const [confirmTarget, setConfirmTarget] = useState(null); // { user, action: 'promote'|'demote'|'deactivate'|'reactivate' }
  const [confirming, setConfirming] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page);
      params.set("limit", "20");
      if (search) params.set("search", search);
      if (roleFilter) params.set("role", roleFilter);
      if (verifiedFilter) params.set("isVerified", verifiedFilter);

      const res = await api.get(`/api/admin/users?${params.toString()}`);
      setUsers(res.data.users);
      setPagination(res.data.pagination);
    } catch { /* empty */ } finally { setLoading(false); }
  }, [page, search, roleFilter, verifiedFilter]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(loadUsers, 300);
    return () => clearTimeout(timer);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConfirmAction = useCallback(async () => {
    if (!confirmTarget) return;
    const { user: targetUser, action } = confirmTarget;
    setConfirming(true);

    try {
      switch (action) {
        case "promote":
          await api.patch(`/api/admin/users/${targetUser._id}`, { role: "admin" });
          showAlert(`${targetUser.fullName} promoted to Admin.`, "success");
          break;
        case "demote":
          await api.patch(`/api/admin/users/${targetUser._id}`, { role: "pilgrim" });
          showAlert(`${targetUser.fullName} demoted to Pilgrim.`, "success");
          break;
        case "deactivate":
          await api.patch(`/api/admin/users/${targetUser._id}`, { isActive: false });
          showAlert(`${targetUser.fullName} deactivated.`, "success");
          break;
        case "reactivate":
          await api.patch(`/api/admin/users/${targetUser._id}`, { isActive: true });
          showAlert(`${targetUser.fullName} reactivated.`, "success");
          break;
        default:
          break;
      }
      setConfirmTarget(null);
      loadUsers();
    } catch (err) {
      const msg = err.response?.data?.error || "Action failed.";
      showAlert(msg, "error");
    } finally { setConfirming(false); }
  }, [confirmTarget, loadUsers, showAlert]);

  const confirmModal = confirmTarget ? {
    title: confirmTarget.action === "promote" ? "Promote to Admin" :
           confirmTarget.action === "demote" ? "Demote to Pilgrim" :
           confirmTarget.action === "deactivate" ? "Deactivate Account" :
           "Reactivate Account",
    message: confirmTarget.action === "promote" ? `Promote "${confirmTarget.user.fullName}" to Admin? They will gain full access to the admin panel.` :
             confirmTarget.action === "demote" ? `Demote "${confirmTarget.user.fullName}" to Pilgrim? They will lose admin access.` :
             confirmTarget.action === "deactivate" ? `Deactivate "${confirmTarget.user.fullName}"? They will be unable to log in until reactivated.` :
             `Reactivate "${confirmTarget.user.fullName}"? They will be able to log in again.`,
    confirmLabel: confirmTarget.action === "promote" ? "Promote" :
                  confirmTarget.action === "demote" ? "Demote" :
                  confirmTarget.action === "deactivate" ? "Deactivate" :
                  "Reactivate",
  } : null;

  return (
    <div>
      <HeaderSection
        title={t("admin.users", "Users")}
        description={t("admin.usersDesc", "Manage registered pilgrims and admins.")}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div className="w-full sm:w-64">
          <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search by name or email…" />
        </div>
        <FilterPills
          options={[
            { value: "", label: "All Roles" },
            { value: "pilgrim", label: "Pilgrims" },
            { value: "admin", label: "Admins" },
          ]}
          value={roleFilter}
          onChange={(v) => { setRoleFilter(v); setPage(1); }}
        />
        <FilterPills
          options={[
            { value: "", label: "All" },
            { value: "true", label: "Verified" },
            { value: "false", label: "Unverified" },
          ]}
          value={verifiedFilter}
          onChange={(v) => { setVerifiedFilter(v); setPage(1); }}
        />
      </div>

      {loading ? <LoadingState /> : (
        <>
          {users.length === 0 ? (
            <EmptyState message="No users found matching your criteria." />
          ) : (
            <div className="space-y-2">
              {users.map((u) => {
                const isSelf = currentUser?._id === u._id;
                const isActive = u.isActive !== false;

                return (
                  <div key={u._id} className="rounded-xl border border-ink/10 bg-paper hover:border-ink/20 transition-all">
                    <div className="flex items-center gap-3 px-4 py-3">
                      {/* Avatar */}
                      <button onClick={() => setDetailUserId(u._id)}
                        className="w-10 h-10 rounded-full bg-emerald/10 flex items-center justify-center text-emerald font-bold text-sm flex-shrink-0 hover:bg-emerald/20 transition-colors"
                        title="View details"
                      >
                        {u.fullName?.charAt(0)?.toUpperCase() || "?"}
                      </button>

                      {/* Info */}
                      <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-ink truncate">{u.fullName}</p>
                          <p className="text-xs text-ink/40 truncate font-mono">{u.email}</p>
                        </div>
                        <div className="hidden sm:block">
                          <p className="text-xs text-ink/50">{u.country || "—"}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <RoleBadge role={u.role} />
                          <VerifiedBadge verified={u.isVerified} />
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <StatusBadge active={isActive} />
                          <span className="text-[10px] font-mono text-ink/20">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => setDetailUserId(u._id)}
                          className="p-2 rounded hover:bg-ink/5 text-ink/30 hover:text-ink transition-colors"
                          title="View details"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </button>

                        {/* Role toggle */}
                        {u.role === "admin" && !isSelf && (
                          <button onClick={() => setConfirmTarget({ user: u, action: "demote" })}
                            className="p-2 rounded hover:bg-clay-alert/5 text-ink/30 hover:text-clay-alert transition-colors"
                            title="Demote to Pilgrim"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                            </svg>
                          </button>
                        )}
                        {u.role === "pilgrim" && (
                          <button onClick={() => setConfirmTarget({ user: u, action: "promote" })}
                            className="p-2 rounded hover:bg-emerald/10 text-ink/30 hover:text-emerald transition-colors"
                            title="Promote to Admin"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                            </svg>
                          </button>
                        )}

                        {/* Active toggle */}
                        <button onClick={() => setConfirmTarget({ user: u, action: isActive ? "deactivate" : "reactivate" })}
                          className={`p-2 rounded transition-colors ${
                            isActive
                              ? "hover:bg-clay-alert/5 text-ink/30 hover:text-clay-alert"
                              : "hover:bg-emerald/10 text-ink/30 hover:text-emerald"
                          }`}
                          title={isActive ? "Deactivate" : "Reactivate"}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                            {isActive ? (
                              <path strokeLinecap="round" strokeLinejoin="round" d="M22 10.5V12a10 10 0 11-5.93-9.14" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            )}
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 rounded-lg border border-ink/15 text-xs font-medium text-ink/50 hover:text-ink hover:border-ink/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Prev
              </button>
              <span className="text-xs text-ink/30 font-mono">
                {page} / {pagination.pages}
              </span>
              <button disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-ink/15 text-xs font-medium text-ink/50 hover:text-ink hover:border-ink/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Confirmation dialog */}
      {confirmModal && (
        <ConfirmDialog
          open={true}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmLabel={confirmModal.confirmLabel}
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirmTarget(null)}
          loading={confirming}
        />
      )}

      {/* User detail panel */}
      <UserDetailPanel userId={detailUserId} onClose={() => setDetailUserId(null)} />
    </div>
  );
}
