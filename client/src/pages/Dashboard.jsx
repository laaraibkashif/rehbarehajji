import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import gsap from "gsap";
import { useAuth } from "../context/AuthContext";
import ArcRing from "../components/ArcRing";
import { Parallax, RevealText } from "../components/animations";
import useReducedMotion from "../hooks/useReducedMotion";
import api from "../services/api";
import { getDuaImage } from "../utils/ritualImages";

// ═══════════════════════════════════════════════════════
//  ProgressRing — large SVG radial with GSAP stroke-dashoffset
// ═══════════════════════════════════════════════════════

function ProgressRing({ pct = 0, size = 140, strokeWidth = 6, label = "", value = "", subtitle = "" }) {
  const ringRef = useRef(null);
  const prefersReduced = useReducedMotion();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const targetOffset = circumference * (1 - Math.min(pct, 1));

  useEffect(() => {
    if (!ringRef.current) return;
    if (prefersReduced) {
      gsap.set(ringRef.current, { strokeDashoffset: targetOffset });
      return;
    }
    // Animate from full circle to target (0 → targetOffset)
    gsap.fromTo(
      ringRef.current,
      { strokeDashoffset: circumference },
      { strokeDashoffset: targetOffset, duration: 1.2, ease: "power3.out" },
    );
  }, [pct, circumference, targetOffset, prefersReduced]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        role="progressbar"
        aria-valuenow={Math.round(pct * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || `Progress: ${Math.round(pct * 100)}%`}
      >
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(47, 82, 51, 0.1)"
          strokeWidth={strokeWidth}
        />
        {/* Animated foreground arc */}
        <circle
          ref={ringRef}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--emerald, #2F5233)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={prefersReduced ? targetOffset : circumference}
          strokeLinecap="round"
          style={{ willChange: "stroke-dashoffset" }}
        />
      </svg>

      {/* Center content — Fraunces + mono */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        {value && (
          <span className="font-display text-2xl sm:text-3xl font-semibold text-ink leading-none">
            {value}
          </span>
        )}
        {label && (
          <span className="font-mono text-[11px] leading-tight text-ink/50 mt-1 uppercase tracking-widest">
            {label}
          </span>
        )}
        {subtitle && (
          <span className="text-xs text-ink/40 mt-0.5">{subtitle}</span>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  CountUpNumber — GSAP-animated number counter
// ═══════════════════════════════════════════════════════

function CountUpNumber({ value, suffix = "", decimals = 0, duration = 1.2 }) {
  const ref = useRef(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (!ref.current) return;
    if (prefersReduced) {
      ref.current.textContent = Number(value).toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }) + suffix;
      return;
    }

    const obj = { val: 0 };
    gsap.to(obj, {
      val: Number(value),
      duration,
      ease: "power3.out",
      onUpdate: () => {
        ref.current.textContent = obj.val.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }) + suffix;
      },
    });
  }, [value, suffix, decimals, duration, prefersReduced]);

  return <span ref={ref}>0</span>;
}

// ═══════════════════════════════════════════════════════
//  StatPanel — secondary stat card with Parallax + count-up
// ═══════════════════════════════════════════════════════

function StatPanel({ label, value, suffix = "", decimals = 0, sub, ringPct, ringLabel, parallaxSpeed = 0.08, index = 0, children }) {
  const panelRef = useRef(null);

  return (
    <Parallax speed={parallaxSpeed} start="top bottom" end="bottom top">
      <div
        ref={panelRef}
        className="surface-glass rounded-xl p-5 flex flex-col gap-3"
        data-stat-index={index}
      >
        {ringPct !== undefined ? (
          <div className="flex items-center gap-4">
            <ArcRing pct={ringPct} size={56} strokeWidth={3} value={value ? <CountUpNumber value={value} suffix={suffix} decimals={decimals} /> : undefined} label={ringLabel} />
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink/70">{label}</p>
              {sub && <p className="text-xs text-ink/40 mt-0.5">{sub}</p>}
            </div>
          </div>
        ) : (
          <>
            <p className="text-lg font-mono font-bold text-emerald">
              <CountUpNumber value={value} suffix={suffix} decimals={decimals} />
            </p>
            <p className="text-sm font-medium text-ink/70">{label}</p>
            {sub && <p className="text-xs text-ink/40">{sub}</p>}
          </>
        )}
        {children}
      </div>
    </Parallax>
  );
}

// ═══════════════════════════════════════════════════════
//  QuickNavCard — MagneticButton-style hover lift via GSAP
// ═══════════════════════════════════════════════════════

function QuickNavCard({ to, icon, title, desc }) {
  const cardRef = useRef(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    const el = cardRef.current;
    if (!el || prefersReduced) return;

    const ctx = gsap.context(() => {
      const handleEnter = () => {
        gsap.to(el, { scale: 1.03, y: -4, boxShadow: "0 8px 28px rgba(47, 82, 51, 0.12)", duration: 0.35, ease: "power2.out" });
      };
      const handleLeave = () => {
        gsap.to(el, { scale: 1, y: 0, boxShadow: "0 1px 3px rgba(22, 36, 28, 0.04)", duration: 0.4, ease: "power2.out" });
      };
      el.addEventListener("mouseenter", handleEnter);
      el.addEventListener("mouseleave", handleLeave);
      return () => {
        el.removeEventListener("mouseenter", handleEnter);
        el.removeEventListener("mouseleave", handleLeave);
      };
    }, el);

    return () => ctx.revert();
  }, [prefersReduced]);

  return (
    <Link
      ref={cardRef}
      to={to}
      className="surface-glass rounded-xl p-4 flex items-center gap-4 no-underline"
      style={{ willChange: prefersReduced ? "auto" : "transform, box-shadow" }}
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald/10 flex items-center justify-center text-emerald">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="text-xs text-ink/50 mt-0.5">{desc}</p>
      </div>
      <svg className="w-4 h-4 flex-shrink-0 text-ink/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

// ═══════════════════════════════════════════════════════
//  EmptyState — new user with no plan yet
// ═══════════════════════════════════════════════════════

function EmptyState({ onCreatePlan }) {
  const containerRef = useRef(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (prefersReduced || !containerRef.current) return;
    const ctx = gsap.context(() => {
      const cards = containerRef.current.querySelectorAll("[data-animate]");
      gsap.fromTo(
        cards,
        { opacity: 0, y: 20, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, stagger: 0.1, duration: 0.5, ease: "power2.out" },
      );
    }, containerRef);
    return () => ctx.revert();
  }, [prefersReduced]);

  return (
    <div ref={containerRef} className="surface-sand rounded-2xl p-8 lg:p-12 text-center" style={{ borderColor: "rgba(184, 134, 62, 0.15)" }}>
      {/* Decorative icon */}
      <div data-animate className="w-16 h-16 mx-auto mb-6 rounded-full bg-gold/10 flex items-center justify-center text-gold">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
      </div>

      <h3 data-animate className="font-display text-2xl lg:text-3xl font-semibold text-ink mb-3">
        Begin your pilgrimage guide
      </h3>
      <p data-animate className="text-sm text-ink/60 max-w-md mx-auto mb-8">
        Create a personalized ritual plan based on your travel type, age group, and preferences. We&apos;ll guide you through every step.
      </p>

      <button
        data-animate
        onClick={onCreatePlan}
        className="btn-primary text-base px-8 py-3"
      >
        Create Your Plan
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  DuaCard — Hajj / Umrah du'as, loaded from Admin → Duas
// ═══════════════════════════════════════════════════════

function DuaCard({ type, title }) {
  const [duas, setDuas] = useState(null); // null = still loading
  const [open, setOpen] = useState(false);

  useEffect(() => {
    api.get("/api/duas", { params: { type } })
      .then((res) => setDuas(res.data.duas || []))
      .catch(() => setDuas([]));
  }, [type]);

  return (
    <div className="surface-glass rounded-xl p-5">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 text-left"
      >
        <div>
          <p className="text-sm font-semibold text-ink">{title}</p>
          <p className="text-xs text-ink/50 mt-0.5">
            {duas === null ? "Loading…" : `${duas.length} du'as · tap to ${open ? "hide" : "view"}`}
          </p>
        </div>
        <span className="text-ink/40">{open ? "−" : "+"}</span>
      </button>

      {open && duas && (
        <div className="mt-4 space-y-3 border-t border-ink/5 pt-4">
          {duas.length === 0 && (
            <p className="text-sm text-ink/40">No du'as added yet.</p>
          )}
          {duas.map((d) => (
            <div key={d._id} className="rounded-lg bg-ink/[0.03] overflow-hidden">
              <img
                src={getDuaImage(d.relatedRitualStep, d.relatedLocation)}
                alt=""
                loading="lazy"
                className="w-full h-28 object-cover"
              />
              <div className="p-3">
              {d.relatedRitualStep && (
                <p className="text-[11px] font-mono text-emerald mb-1">{d.relatedRitualStep}</p>
              )}

              {/* Arabic */}
              <p dir="rtl" lang="ar" className="text-xl leading-loose text-ink text-right">
                {d.textAr}
              </p>

              {/* Urdu (shows whenever it was entered in Admin → Duas) */}
              {d.textUr && (
                <p dir="rtl" lang="ur" className="text-lg leading-loose text-ink/80 mt-2 text-right">
                  {d.textUr}
                </p>
              )}

              {/* English */}
              <p className="text-sm text-ink/70 mt-2">{d.textEn}</p>

              {d.audioUrl && <audio src={d.audioUrl} controls className="w-full mt-2 h-8" />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  Main Dashboard
// ═══════════════════════════════════════════════════════

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userId = user?.id || user?._id;
  const prefersReduced = useReducedMotion();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const denied = searchParams.get("admin_denied") === "1";

  // Refs for entrance animation
  const mainPanelRef = useRef(null);
  const statsGridRef = useRef(null);
  const entranceDoneRef = useRef(false);

  const fetchDashboard = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/api/dashboard/${userId}`);
      setData(res.data);
    } catch (err) {
      const msg = err.response?.data?.error || t("dashboard.loadError", "Failed to load dashboard.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [userId, t]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // ── Staggered entrance sequence ──
  useEffect(() => {
    if (loading || entranceDoneRef.current) return;
    const mainEl = mainPanelRef.current;
    const statsEl = statsGridRef.current;
    if (!mainEl) return;

    entranceDoneRef.current = true;

    if (prefersReduced) {
      gsap.set(mainEl, { opacity: 1, scale: 1 });
      if (statsEl) {
        gsap.set(statsEl.children, { opacity: 1, y: 0 });
      }
      return;
    }

    const ctx = gsap.context(() => {
      // 1. Main panel: scale+fade in
      gsap.set(mainEl, { opacity: 0, scale: 0.92 });
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.to(mainEl, { opacity: 1, scale: 1, duration: 0.6 }, 0.15);

      // 2. Stat panels: stagger below
      if (statsEl) {
        const statCards = statsEl.querySelectorAll("[data-stat-panel]");
        tl.fromTo(
          statCards,
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, stagger: 0.08, duration: 0.45 },
          "-=0.1",
        );
      }
    }, mainEl);

    return () => ctx.revert();
  }, [loading, prefersReduced]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Loading state ──
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <ArcRing size={48} strokeWidth={3} />
      </div>
    );
  }

  const { planSummary, tawafCounts, checklistSummary, recentChats } = data || {};
  const hasPlan = !!planSummary;

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8">
      {/* ── Admin denied message ── */}
      {denied && (
        <div className="rounded-xl border border-clay-alert/20 bg-clay-alert/5 px-5 py-4 flex items-start gap-3">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-clay-alert" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m0-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-clay-alert">{t("dashboard.adminDeniedTitle", "Access Denied")}</p>
            <p className="text-sm text-clay-alert/80 mt-0.5">
              {t("dashboard.adminDeniedDesc", "You don't have access to the admin panel. Only administrators can view that page.")}
            </p>
          </div>
          <button
            onClick={() => {
              const params = new URLSearchParams(searchParams);
              params.delete("admin_denied");
              navigate({ search: params.toString() }, { replace: true });
            }}
            className="flex-shrink-0 p-1 rounded hover:bg-clay-alert/10 transition-colors"
            aria-label={t("common.dismiss", "Dismiss")}
          >
            <svg className="w-4 h-4 text-clay-alert/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* ── Greeting ── */}
      <div>
        <RevealText
          as="h1"
          mode="words"
          stagger={0.04}
          duration={0.6}
          threshold={0.01}
          className="font-display text-3xl lg:text-4xl font-semibold text-ink"
        >
          Assalamu Alaikum, {user?.fullName || t("dashboard.title")}
        </RevealText>
        <p className="typo-body text-ink/50 mt-1">
          {t("dashboard.subtitle", "Here's your pilgrimage overview.")}
        </p>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="rounded-lg bg-clay-alert/10 border border-clay-alert/25 px-4 py-3 text-sm text-clay-alert">
          {error}
        </div>
      )}

      {/* ── Main panel: current ritual state / progress ring ── */}
      {hasPlan && (
        <div ref={mainPanelRef} style={{ willChange: "transform, opacity" }}>
          <div className="surface-glass rounded-2xl p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Large radial progress ring */}
              <div className="flex-shrink-0">
                <ProgressRing
                  pct={planSummary.completionPct / 100}
                  size={140}
                  strokeWidth={6}
                  value={`${planSummary.completionPct}%`}
                  label="complete"
                  subtitle={`${planSummary.totalSteps} steps`}
                />
              </div>

              {/* Ritual details */}
              <div className="flex-1 min-w-0">
                <p className="typo-eyebrow mb-1">{t("dashboard.currentRitual", "Current Ritual")}</p>
                <h2 className="font-display text-2xl lg:text-3xl font-semibold text-ink capitalize leading-tight">
                  {planSummary.ritualType}
                </h2>
                <p className="text-sm text-ink/50 mt-1">
                  {planSummary.ageGroup} · {planSummary.travelMode}
                </p>

                {/* Mini progress bar */}
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-medium text-ink/60">{t("dashboard.planProgress", "Plan Progress")}</span>
                    <span className="text-xs font-mono text-emerald">{planSummary.completionPct}%</span>
                  </div>
                  <div className="h-1.5 bg-ink/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${planSummary.completionPct}%` }}
                    />
                  </div>
                  <p className="text-xs text-ink/40 mt-1.5">
                    {planSummary.stepsWithNotes} {t("dashboard.of")} {planSummary.totalSteps} {t("dashboard.stepsWithNotes", "steps with guidance")}
                  </p>
                </div>

                <Link
                  to="/planner"
                  className="inline-block mt-4 btn-secondary text-xs"
                >
                  {t("dashboard.viewPlan", "View Plan")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Empty state (no plan) ── */}
      {!hasPlan && (
        <div ref={mainPanelRef} style={{ willChange: "transform, opacity" }}>
          <EmptyState onCreatePlan={() => navigate("/planner")} />
        </div>
      )}

      {/* ── Quick stats row (with Parallax + count-up) ── */}
      <div ref={statsGridRef} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div data-stat-panel>
          <StatPanel
            label={t("dashboard.tawafCircuits", "Tawaf Circuits")}
            value={tawafCounts?.tawaf?.count || 0}
            suffix="/7"
            ringPct={(tawafCounts?.tawaf?.count || 0) / 7}
            ringLabel="Tawaf"
            sub={tawafCounts?.tawaf?.count >= 7 ? t("dashboard.complete", "Complete") : t("dashboard.inProgress", "In progress")}
          />
        </div>
        <div data-stat-panel>
          <StatPanel
            label={t("dashboard.saiRounds", "Sa'i Rounds")}
            value={tawafCounts?.sai?.count || 0}
            suffix="/7"
            ringPct={(tawafCounts?.sai?.count || 0) / 7}
            ringLabel="Sa'i"
            sub={tawafCounts?.sai?.count >= 7 ? t("dashboard.complete", "Complete") : t("dashboard.inProgress", "In progress")}
          />
        </div>
        <div data-stat-panel>
          <StatPanel
            label={t("dashboard.preparationChecklist", "Preparation")}
            value={checklistSummary?.preparation?.pct || 0}
            suffix="%"
            ringPct={(checklistSummary?.preparation?.pct || 0) / 100}
            ringLabel="Prep"
            sub={`${checklistSummary?.preparation?.checked || 0}/${checklistSummary?.preparation?.total || 0}`}
          />
        </div>
        <div data-stat-panel>
          <StatPanel
            label={t("dashboard.ritualChecklist", "Ritual")}
            value={checklistSummary?.ritual?.pct || 0}
            suffix="%"
            ringPct={(checklistSummary?.ritual?.pct || 0) / 100}
            ringLabel="Ritual"
            sub={`${checklistSummary?.ritual?.checked || 0}/${checklistSummary?.ritual?.total || 0}`}
          />
        </div>
      </div>

      {/* ── Emergency quick-access ── */}
      <div data-stat-panel>
        <Parallax speed={0.06} start="top bottom" end="bottom top">
          <Link
            to="/emergency"
            className="flex items-center gap-4 rounded-xl bg-clay-alert/10 border border-clay-alert/20 p-5 text-ink hover:bg-clay-alert/15 transition-colors no-underline"
          >
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-clay-alert/15 flex items-center justify-center text-clay-alert">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-lg font-bold text-ink">{t("emergency.title")}</p>
              <p className="text-sm text-ink/50">{t("dashboard.emergencyDesc", "Important numbers — tap to call")}</p>
            </div>
            <svg className="w-5 h-5 flex-shrink-0 text-ink/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </Parallax>
      </div>

      {/* ── Dua cards (live from Admin → Duas) ── */}
      <div data-stat-panel>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
          <DuaCard type="hajj" title={t("dashboard.hajjDuas", "Hajj Du'as")} />
          <DuaCard type="umrah" title={t("dashboard.umrahDuas", "Umrah Du'as")} />
        </div>
      </div>

      {/* ── Quick Nav (MagneticButton-style hover lift) ── */}
      <div data-stat-panel>
        <h3 className="typo-eyebrow mb-4">{t("dashboard.quickAccess", "Quick Access")}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { to: "/guide/hajj", title: t("nav.hajj"), desc: t("dashboard.guideDesc", "Step-by-step Hajj guide") },
            { to: "/guide/umrah", title: t("nav.umrah"), desc: t("dashboard.guideDesc", "Step-by-step Umrah guide") },
            { to: "/planner", title: t("nav.planner"), desc: t("dashboard.plannerDesc", "Personalized ritual plan") },
            { to: "/tawaf", title: t("nav.tawaf"), desc: t("dashboard.tawafDesc", "Count circuits & rounds") },
            { to: "/checklist", title: t("nav.checklist"), desc: t("dashboard.checklistDesc", "Track preparation progress") },
            { to: "/ask-pilgrim", title: t("nav.askPilgrim"), desc: t("dashboard.askDesc", "AI-powered Q&A assistant") },
          ].map((item) => (
            <QuickNavCard
              key={item.to}
              to={item.to}
              title={item.title}
              desc={item.desc}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              }
            />
          ))}
        </div>
      </div>

      {/* ── Recent chats ── */}
      {recentChats && recentChats.length > 0 && (
        <div data-stat-panel>
          <div className="flex items-center justify-between mb-4">
            <h3 className="typo-eyebrow">{t("dashboard.recentQuestions", "Recent Questions")}</h3>
            <Link to="/ask-pilgrim" className="text-xs font-medium text-emerald hover:text-emerald/70 transition-colors">
              {t("dashboard.askMore", "Ask more →")}
            </Link>
          </div>
          <div className="space-y-2.5">
            {recentChats.map((chat) => (
              <div key={chat._id} className="surface-glass rounded-xl p-4">
                <p className="text-sm font-medium text-ink truncate">{chat.question}</p>
                <p className="text-xs text-ink/50 mt-1 line-clamp-2">{chat.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}