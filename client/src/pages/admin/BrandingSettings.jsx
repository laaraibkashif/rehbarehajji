"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../../services/api";
import { useSettings } from "../../context/SettingsContext";
import { useAlert } from "../../components/Alert";
import MediaPicker from "../../components/MediaPicker";
import { HeaderSection, Spinner } from "../../components/AdminResourceTable";

// ── ColorSwatch ──
function ColorSwatch({ color }) {
  if (!color) return null;
  return (
    <div className="flex items-center gap-2 mt-1">
      <span className="w-6 h-6 rounded-lg border border-ink/10" style={{ backgroundColor: color }} />
      <span className="text-xs font-mono text-ink/30">{color}</span>
    </div>
  );
}

// ── MediaUploadField ──
function MediaUploadField({ label, acceptType, currentUrl, onSelect, icon }) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div>
      <label className="block text-xs font-medium text-ink/50 mb-1.5">{label}</label>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setPickerOpen(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-ink/15 bg-paper hover:border-emerald/30 text-sm text-ink/60 hover:text-ink transition-all"
        >
          {icon}
          <span className="truncate max-w-[200px]">
            {currentUrl ? "Selected" : "Choose from Library"}
          </span>
        </button>
        {currentUrl && (
          <button onClick={() => onSelect("")} className="p-2 text-ink/30 hover:text-clay-alert transition-colors" aria-label="Clear">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      {currentUrl && acceptType === "image" && (
        <img src={currentUrl} alt={label} className="mt-2 h-16 w-auto rounded-lg border border-ink/10 object-contain" />
      )}
      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(asset) => {
          onSelect(asset.secureUrl || asset.url);
          setPickerOpen(false);
        }}
        acceptTypes={[acceptType]}
      />
    </div>
  );
}

// ── SocialLinkField ──
function SocialLinkField({ label, value, onChange, icon }) {
  return (
    <div>
      <label className="block text-xs font-medium text-ink/50 mb-1.5">{label}</label>
      <div className="flex items-center gap-2">
        <span className="text-ink/30 flex-shrink-0">{icon}</span>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://"
          className="flex-1 rounded-lg border border-ink/15 bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-emerald/30 focus:border-emerald transition-all"
        />
      </div>
    </div>
  );
}

export default function AdminBranding() {
  const { t } = useTranslation();
  const { settings, refetch } = useSettings();
  const { addAlert: showAlert } = useAlert();

  const [form, setForm] = useState({
    logoUrl: settings.logoUrl,
    faviconUrl: settings.faviconUrl,
    siteName: settings.siteName,
    tagline: settings.tagline,
    primaryColor: settings.primaryColor,
    accentColor: settings.accentColor,
    supportEmail: settings.supportEmail,
    supportPhone: settings.supportPhone,
    socialLinks: { ...settings.socialLinks },
  });
  const [saving, setSaving] = useState(false);

  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const setSocial = (platform, value) => setForm((prev) => ({
    ...prev,
    socialLinks: { ...prev.socialLinks, [platform]: value },
  }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch("/api/admin/settings", form);
      showAlert("Branding settings saved.", "success");
      refetch(); // Refetch context to update entire app
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to save settings.";
      showAlert(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = JSON.stringify(form) !== JSON.stringify({
    logoUrl: settings.logoUrl,
    faviconUrl: settings.faviconUrl,
    siteName: settings.siteName,
    tagline: settings.tagline,
    primaryColor: settings.primaryColor,
    accentColor: settings.accentColor,
    supportEmail: settings.supportEmail,
    supportPhone: settings.supportPhone,
    socialLinks: settings.socialLinks,
  });

  return (
    <div>
      <HeaderSection
        title={t("admin.branding", "Branding & Settings")}
        description={t("admin.brandingDesc", "Customize the look and feel of the entire app.")}
      />

      <div className="space-y-8 max-w-2xl">
        {/* ── Logo & Favicon ── */}
        <section className="rounded-xl border border-ink/10 bg-paper p-5 space-y-4">
          <h3 className="font-display text-base font-semibold text-ink">Logo & Favicon</h3>
          <MediaUploadField
            label="Site Logo"
            acceptType="image"
            currentUrl={form.logoUrl}
            onSelect={(url) => setField("logoUrl", url)}
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" /></svg>}
          />
          <MediaUploadField
            label="Favicon"
            acceptType="image"
            currentUrl={form.faviconUrl}
            onSelect={(url) => setField("faviconUrl", url)}
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>}
          />
        </section>

        {/* ── Site Info ── */}
        <section className="rounded-xl border border-ink/10 bg-paper p-5 space-y-4">
          <h3 className="font-display text-base font-semibold text-ink">Site Info</h3>
          <div>
            <label className="block text-xs font-medium text-ink/50 mb-1.5">Site Name</label>
            <input value={form.siteName} onChange={(e) => setField("siteName", e.target.value)}
              className="w-full rounded-lg border border-ink/15 bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-emerald/30 focus:border-emerald transition-all"
              placeholder="Rehbar-e-Hajji" />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink/50 mb-1.5">Tagline</label>
            <input value={form.tagline} onChange={(e) => setField("tagline", e.target.value)}
              className="w-full rounded-lg border border-ink/15 bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-emerald/30 focus:border-emerald transition-all"
              placeholder="Your Personal Pilgrimage Companion" />
          </div>
        </section>

        {/* ── Colors ── */}
        <section className="rounded-xl border border-ink/10 bg-paper p-5 space-y-4">
          <h3 className="font-display text-base font-semibold text-ink">Colors</h3>
          <p className="text-xs text-ink/40 font-mono">
            These colors override the app's primary (emerald) and accent (gold) values site-wide. Changes take effect immediately.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-ink/50 mb-1.5">Primary Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.primaryColor}
                  onChange={(e) => setField("primaryColor", e.target.value)}
                  className="w-10 h-10 rounded-lg border border-ink/15 cursor-pointer p-0.5" />
                <input value={form.primaryColor}
                  onChange={(e) => setField("primaryColor", e.target.value)}
                  className="flex-1 rounded-lg border border-ink/15 bg-paper px-3 py-2 text-sm font-mono text-ink focus:outline-none focus:ring-2 focus:ring-emerald/30 focus:border-emerald transition-all"
                  placeholder="#2F5233" />
              </div>
              <ColorSwatch color={form.primaryColor} />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink/50 mb-1.5">Accent Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.accentColor}
                  onChange={(e) => setField("accentColor", e.target.value)}
                  className="w-10 h-10 rounded-lg border border-ink/15 cursor-pointer p-0.5" />
                <input value={form.accentColor}
                  onChange={(e) => setField("accentColor", e.target.value)}
                  className="flex-1 rounded-lg border border-ink/15 bg-paper px-3 py-2 text-sm font-mono text-ink focus:outline-none focus:ring-2 focus:ring-emerald/30 focus:border-emerald transition-all"
                  placeholder="#B8863E" />
              </div>
              <ColorSwatch color={form.accentColor} />
            </div>
          </div>
        </section>

        {/* ── Support Contact ── */}
        <section className="rounded-xl border border-ink/10 bg-paper p-5 space-y-4">
          <h3 className="font-display text-base font-semibold text-ink">Support Contact</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-ink/50 mb-1.5">Support Email</label>
              <input value={form.supportEmail} onChange={(e) => setField("supportEmail", e.target.value)}
                className="w-full rounded-lg border border-ink/15 bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-emerald/30 focus:border-emerald transition-all"
                placeholder="support@example.com" type="email" />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink/50 mb-1.5">Support Phone</label>
              <input value={form.supportPhone} onChange={(e) => setField("supportPhone", e.target.value)}
                className="w-full rounded-lg border border-ink/15 bg-paper px-3 py-2 text-sm font-mono text-ink focus:outline-none focus:ring-2 focus:ring-emerald/30 focus:border-emerald transition-all"
                placeholder="+966 XX XXX XXXX" />
            </div>
          </div>
        </section>

        {/* ── Social Links ── */}
        <section className="rounded-xl border border-ink/10 bg-paper p-5 space-y-4">
          <h3 className="font-display text-base font-semibold text-ink">Social Links</h3>
          <p className="text-xs text-ink/40 font-mono">
            Used in the app's footer and contact surfaces.
          </p>
          <div className="space-y-3">
            <SocialLinkField
              label="Facebook"
              value={form.socialLinks.facebook}
              onChange={(v) => setSocial("facebook", v)}
              icon={<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" /></svg>}
            />
            <SocialLinkField
              label="Instagram"
              value={form.socialLinks.instagram}
              onChange={(v) => setSocial("instagram", v)}
              icon={<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>}
            />
            <SocialLinkField
              label="Twitter / X"
              value={form.socialLinks.twitter}
              onChange={(v) => setSocial("twitter", v)}
              icon={<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>}
            />
          </div>
        </section>

        {/* ── Save ── */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-ink/5">
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-emerald text-paper hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all inline-flex items-center gap-2 shadow-sm"
          >
            {saving && <Spinner className="w-4 h-4" />}
            Save Changes
          </button>
        </div>

        {/* ── Live preview note ── */}
        <div className="rounded-xl border border-emerald/10 bg-emerald/[0.02] p-4 text-xs text-ink/50 leading-relaxed">
          <p className="font-medium text-emerald mb-1">⚡ Changes take effect immediately</p>
          <p>Saved settings are applied across the entire app — pilgrim-facing pages, admin panel, document title, favicon, and CSS custom properties — without requiring a redeploy.</p>
        </div>
      </div>
    </div>
  );
}
