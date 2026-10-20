"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import gsap from "gsap";
import api from "../services/api";
import useReducedMotion from "../hooks/useReducedMotion";

// ═══════════════════════════════════════════════════════════════
//  Constants
// ═══════════════════════════════════════════════════════════════

const STORAGE_KEY = "emergency_contacts_cache";

// The nationwide Red Crescent ambulance number — always shown at the top
const CRITICAL_PHONE = "997";
const CRITICAL_LABEL = "Saudi Red Crescent — Emergency Ambulance";

const CATEGORY_META = {
  medical: {
    label: "Medical Centers",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
  helpline: {
    label: "Emergency Helplines",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
  },
  embassy: {
    label: "Embassies & Consulates",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
};

// ═══════════════════════════════════════════════════════════════
//  CriticalBanner — sticky "Call now" shortcut
// ═══════════════════════════════════════════════════════════════

function CriticalBanner() {
  return (
    <div className="sticky top-0 z-20 -mx-4 px-4 pt-4 pb-3 bg-gradient-to-b from-paper via-paper/95 to-transparent">
      <a
        href={`tel:${CRITICAL_PHONE}`}
        className="flex items-center gap-4 rounded-2xl border-2 border-clay-alert/40 bg-clay-alert/[0.04] p-4 hover:bg-clay-alert/[0.08] hover:border-clay-alert/60 transition-all duration-200 group"
        aria-label={`Call ${CRITICAL_LABEL}: ${CRITICAL_PHONE}`}
      >
        {/* Urgent icon */}
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-clay-alert/10 flex items-center justify-center group-hover:bg-clay-alert/20 transition-colors">
          <svg className="w-6 h-6 text-clay-alert" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-clay-alert">{CRITICAL_LABEL}</p>
          <p className="text-xs text-clay-alert/60 mt-0.5 font-mono">
            Nationwide — available 24/7
          </p>
        </div>

        {/* Phone + call arrow */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="font-mono text-lg font-bold text-clay-alert tabular-nums">
            {CRITICAL_PHONE}
          </span>
          <svg className="w-5 h-5 text-clay-alert/50 group-hover:text-clay-alert/80 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        </div>
      </a>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  ContactRow — one contact with large tap target
// ═══════════════════════════════════════════════════════════════

function ContactRow({ contact }) {
  const isCritical = contact.phoneNumber === CRITICAL_PHONE;

  return (
    <a
      href={`tel:${contact.phoneNumber}`}
      className={`flex items-center gap-4 rounded-xl p-4 transition-all duration-200 border ${
        isCritical
          ? "border-clay-alert/20 bg-clay-alert/[0.02] hover:border-clay-alert/40"
          : "border-ink/8 bg-paper hover:border-ink/20"
      }`}
      aria-label={`Call ${contact.name}: ${contact.phoneNumber}`}
    >
      {/* Category icon */}
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
          isCritical
            ? "bg-clay-alert/10 text-clay-alert"
            : "bg-ink/5 text-ink/40"
        }`}
      >
        {CATEGORY_META[contact.category]?.icon || (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        )}
      </div>

      {/* Name + region */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink truncate">{contact.name}</p>
        {contact.region && (
          <p className="text-xs text-ink/40 mt-0.5 truncate">{contact.region}</p>
        )}
      </div>

      {/* Phone number + call button */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="font-mono text-sm font-semibold text-ink/70 tabular-nums">
          {contact.phoneNumber}
        </span>
        <span className="flex-shrink-0 w-9 h-9 rounded-full bg-emerald/10 flex items-center justify-center text-emerald hover:bg-emerald/20 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        </span>
      </div>
    </a>
  );
}

// ═══════════════════════════════════════════════════════════════
//  CategorySection — group header + rows
// ═══════════════════════════════════════════════════════════════

function CategorySection({ category, contacts }) {
  const meta = CATEGORY_META[category];
  if (!contacts || contacts.length === 0) return null;

  return (
    <div>
      {/* Category header */}
      <div className="flex items-center gap-3 mb-3">
        <span className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold bg-ink/5 text-ink/60">
          <span className="text-ink/40">{meta.icon}</span>
          {meta.label}
        </span>
        <span className="text-xs font-mono text-ink/30">{contacts.length}</span>
      </div>

      <div className="space-y-2">
        {contacts.map((contact) => (
          <ContactRow key={contact._id} contact={contact} />
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  Main EmergencyContacts
// ═══════════════════════════════════════════════════════════════

export default function EmergencyContacts() {
  const { t } = useTranslation();
  const prefersReduced = useReducedMotion();

  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [usingCache, setUsingCache] = useState(false);

  const contentRef = useRef(null);
  const enteredRef = useRef(false);

  // ── Fetch contacts ──
  const fetchContacts = useCallback(async () => {
    setLoading(true);
    setError("");
    setUsingCache(false);
    try {
      const res = await api.get("/api/emergency-contacts");
      const data = res.data.contacts;
      setContacts(data);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch {
        /* storage full — ignore */
      }
    } catch (err) {
      // Try cache
      try {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          setContacts(parsed);
          setUsingCache(true);
        } else {
          setError("Could not load contacts. No cached data available.");
        }
      } catch {
        setError("Could not load contacts. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // ── Fast entrance animation (under 300ms) ──
  useEffect(() => {
    if (loading || enteredRef.current || !contentRef.current) return;
    enteredRef.current = true;

    if (prefersReduced) {
      gsap.set(contentRef.current, { opacity: 1, y: 0 });
      return;
    }

    gsap.fromTo(
      contentRef.current,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.28, ease: "power2.out" }
    );
  }, [loading, prefersReduced]);

  // ── Group contacts by category ──
  const grouped = {
    medical: contacts.filter((c) => c.category === "medical"),
    helpline: contacts.filter((c) => c.category === "helpline"),
    embassy: contacts.filter((c) => c.category === "embassy"),
  };

  const hasContacts = contacts.length > 0;

  // ── Loading state ──
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <svg width="40" height="40" viewBox="0 0 40 40" className="animate-spin" aria-hidden="true">
          <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(47, 82, 51, 0.1)" strokeWidth="3" />
          <circle cx="20" cy="20" r="16" fill="none" stroke="var(--emerald)" strokeWidth="3" strokeDasharray="100" strokeDashoffset="70" strokeLinecap="round" />
        </svg>
        <span className="sr-only">Loading emergency contacts…</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 lg:py-12" ref={contentRef}>
      {/* ── Header ── */}
      <div className="mb-6">
        <h1 className="font-display text-3xl lg:text-4xl font-semibold text-ink leading-tight">
          {t("emergency.title", "Emergency Contacts")}
        </h1>
        <p className="text-sm text-ink/50 mt-1 font-mono">
          {t("emergency.subtitle", "Important numbers for your pilgrimage — tap to call")}
        </p>
      </div>

      {/* ── Offline cache note ── */}
      {usingCache && (
        <div className="mb-4 rounded-xl border border-emerald/15 bg-emerald/5 px-4 py-3 text-sm text-ink/60 flex items-center gap-2">
          <svg className="w-4 h-4 text-emerald/60 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {t("emergency.offlineNote", "Showing saved contacts. Data may not be current — refresh when online.")}
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="mb-4 rounded-xl border border-clay-alert/20 bg-clay-alert/5 px-5 py-3 text-sm text-clay-alert flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* ── Sticky critical banner ── */}
      {hasContacts && <CriticalBanner />}

      {/* ── Category sections ── */}
      {hasContacts ? (
        <div className="space-y-8 mt-4">
          <CategorySection category="helpline" contacts={grouped.helpline} />
          <CategorySection category="medical" contacts={grouped.medical} />
          <CategorySection category="embassy" contacts={grouped.embassy} />
        </div>
      ) : (
        !error && (
          <div className="text-center py-16">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-ink/5 flex items-center justify-center">
              <svg className="w-7 h-7 text-ink/20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 3.75v4.5m0-4.5h-4.5m4.5 0l-6 6m3 12c-8.284 0-15-6.716-15-15V4.5A2.25 2.25 0 014.5 2.25h1.372c.516 0 .966.351 1.091.852l1.106 4.423c.11.44-.054.902-.417 1.173l-1.293.97a1.062 1.062 0 00-.38 1.21 12.035 12.035 0 007.143 7.143c.441.162.928-.004 1.21-.38l.97-1.293a1.125 1.125 0 011.173-.417l4.423 1.106c.5.125.852.575.852 1.091V19.5a2.25 2.25 0 01-2.25 2.25h-2.25z" />
              </svg>
            </div>
            <p className="text-sm text-ink/40 font-mono">
              {t("emergency.empty", "No contacts available.")}
            </p>
          </div>
        )
      )}

      {/* ── Refresh button ── */}
      {hasContacts && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={fetchContacts}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-paper px-5 py-2.5 text-sm font-medium text-ink/50 hover:text-ink hover:border-ink/30 transition-all duration-200 disabled:opacity-40"
          >
            <svg
              className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"
              />
            </svg>
            {t("emergency.refresh", "Refresh")}
          </button>
        </div>
      )}

      {/* ── Footer note ── */}
      <div className="mt-6 rounded-xl border border-ink/10 bg-sand/30 px-5 py-4">
        <p className="text-xs text-ink/40 leading-relaxed">
          {t(
            "emergency.disclaimer",
            "These numbers are provided as a reference. Verify emergency contacts with your travel organiser before departure. In an emergency, dial 997 for an ambulance or 999 for police."
          )}
        </p>
      </div>
    </div>
  );
}
