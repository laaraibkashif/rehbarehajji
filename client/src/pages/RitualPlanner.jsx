"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import gsap from "gsap";
import api from "../services/api";
import { useAlert } from "../components/Alert";
import { useAuth } from "../context/AuthContext";
import { RevealText, MagneticButton } from "../components/animations";
import useReducedMotion from "../hooks/useReducedMotion";

// ═══════════════════════════════════════════════════════
//  PlanLoading — percentage counter + thin bar
//  Visually rhymes with SitePreloader at smaller scale
// ═══════════════════════════════════════════════════════

function PlanLoading({ progress }) {
  const counterRef = useRef(null);
  const fillRef = useRef(null);
  const prefersReduced = useReducedMotion();
  const dataRef = useRef({ val: 0 });

  useEffect(() => {
    if (prefersReduced || !counterRef.current || !fillRef.current) return;

    gsap.to(dataRef.current, {
      val: progress,
      duration: 0.5,
      ease: "power2.out",
      overwrite: "auto",
      onUpdate: () => {
        if (counterRef.current) {
          counterRef.current.textContent = `${Math.round(dataRef.current.val)}%`;
        }
      },
    });

    gsap.to(fillRef.current, {
      scaleX: progress / 100,
      duration: 0.5,
      ease: "power2.out",
      overwrite: "auto",
    });
  }, [progress, prefersReduced]);

  return (
    <div
      className="flex flex-col items-center justify-center py-16"
      role="status"
      aria-live="polite"
      aria-label={`Generating plan: ${Math.round(progress)}%`}
    >
      <div
        ref={counterRef}
        style={{
          fontFamily: "var(--font-display, 'Fraunces', serif)",
          fontSize: "clamp(3rem, 8vw, 5rem)",
          fontWeight: 600,
          fontVariationSettings: "'opsz' 48",
          lineHeight: 1,
          letterSpacing: "-0.03em",
          color: "var(--emerald, #2F5233)",
        }}
      >
        0%
      </div>

      <div
        className="relative mt-6 overflow-hidden"
        style={{
          width: "clamp(100px, 20vw, 200px)",
          height: 2,
          borderRadius: 1,
          backgroundColor: "rgba(47, 82, 51, 0.12)",
        }}
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          ref={fillRef}
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: "var(--emerald, #2F5233)",
            borderRadius: 1,
            transformOrigin: "left center",
            transform: "scaleX(0)",
            willChange: "transform",
          }}
        />
      </div>

      <span
        className="typo-eyebrow mt-6"
        style={{
          color: "rgba(47, 82, 51, 0.35)",
          fontSize: "0.625rem",
        }}
      >
        Crafting your personalised plan…
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  PlanTimelineSVG — vertical path with step markers
//  Visual language from RitualGuide's TimelineSVG
// ═══════════════════════════════════════════════════════

function PlanTimelineSVG({ stepCount, activeIndex }) {
  const svgHeight = stepCount > 1 ? stepCount * 80 : 80;
  const padding = 10;
  const usableHeight = svgHeight - padding * 2;
  const spacing = stepCount > 1 ? usableHeight / (stepCount - 1) : 0;

  return (
    <svg
      viewBox={`0 0 40 ${svgHeight}`}
      className="w-full h-full"
      aria-hidden="true"
    >
      {/* Background guide line */}
      <line
        x1="20" y1={padding}
        x2="20" y2={svgHeight - padding}
        stroke="rgba(47, 82, 51, 0.08)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Foreground filled line */}
      <line
        x1="20" y1={padding}
        x2="20" y2={padding + spacing * Math.max(0, activeIndex)}
        stroke="var(--emerald, #2F5233)"
        strokeWidth="2"
        strokeLinecap="round"
        className="transition-all duration-500 ease-out"
      />
      {/* Step markers */}
      {Array.from({ length: stepCount }).map((_, i) => {
        const y = padding + spacing * i;
        const isActive = i <= activeIndex;
        const isCurrent = i === activeIndex;
        return (
          <g key={i}>
            <circle
              cx="20" cy={y} r="6"
              fill={isActive ? "var(--emerald, #2F5233)" : "transparent"}
              stroke={
                isCurrent
                  ? "var(--emerald, #2F5233)"
                  : isActive
                    ? "var(--emerald, #2F5233)"
                    : "rgba(47, 82, 51, 0.2)"
              }
              strokeWidth="2"
              className="transition-colors duration-300"
            />
            {isActive && (
              <circle
                cx="20" cy={y} r="2"
                fill="#FAF8F2"
                className="transition-opacity duration-300"
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ═══════════════════════════════════════════════════════
//  PlanStepCard — one generated step with parent→child notes
// ═══════════════════════════════════════════════════════

function PlanStepCard({ step, index, isActive }) {
  const cardRef = useRef(null);
  const notesRef = useRef(null);
  const notesAnimatedRef = useRef(false);
  const prefersReduced = useReducedMotion();
  const hasNotes = step.notes && step.notes.length > 0;

  /* ── Parent→child animation: observe card, delay notes ── */
  useEffect(() => {
    if (!hasNotes || !notesRef.current || prefersReduced) return;
    if (notesAnimatedRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !notesAnimatedRef.current) {
          notesAnimatedRef.current = true;

          if (prefersReduced) {
            gsap.set(notesRef.current, { opacity: 1, y: 0 });
            observer.disconnect();
            return;
          }

          // Wait 400ms after card enters viewport (parent step name
          // RevealText has ~150ms total animation), then animate notes
          gsap.fromTo(
            notesRef.current,
            { opacity: 0, y: 12, filter: "blur(3px)" },
            {
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
              duration: 0.5,
              delay: 0.4,
              ease: "power3.out",
            }
          );
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [hasNotes, prefersReduced]);

  return (
    <div ref={cardRef} className="relative flex gap-4 pb-8 last:pb-0">
      <div className="flex-1 min-w-0">
        {/* Step badge + name */}
        <div className="flex items-center gap-2 mb-1">
          <span
            className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-mono font-bold transition-colors duration-300 ${
              isActive
                ? "bg-emerald text-paper"
                : "bg-ink/5 text-ink/40 border border-ink/10"
            }`}
          >
            {index + 1}
          </span>
          <RevealText
            as="h3"
            mode="words"
            stagger={0.03}
            duration={0.35}
            threshold={0.2}
            className="font-display text-lg lg:text-xl font-semibold text-ink leading-tight"
          >
            {step.stepName}
          </RevealText>
        </div>

        {/* Date */}
        {step.date && (
          <p className="text-xs font-mono text-ink/40 ml-9 mb-2 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            {step.date}
          </p>
        )}

        {/* Personalised notes — animated with delay after parent */}
        {hasNotes && (
          <div className="ml-9 mt-2">
            <div
              ref={notesRef}
              className="rounded-lg border border-emerald/15 bg-emerald/5 px-4 py-3"
              style={{
                opacity: prefersReduced ? 1 : 0,
                filter: prefersReduced ? "blur(0px)" : "blur(3px)",
                willChange: "transform, opacity, filter",
              }}
            >
              <p className="text-sm text-ink/65 leading-relaxed">{step.notes}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  MiniProgress — persistent floating step indicator
// ═══════════════════════════════════════════════════════

function MiniProgress({ current, total }) {
  const pct = total > 0 ? (current + 1) / total : 0;

  return (
    <div
      className="fixed bottom-6 right-6 z-30 flex items-center gap-3 rounded-full bg-paper/90 backdrop-blur-md border border-ink/10 shadow-lg px-4 py-2.5"
      role="progressbar"
      aria-valuenow={current + 1}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-label={`Step ${current + 1} of ${total}`}
    >
      <svg width="28" height="28" viewBox="0 0 28 28" className="flex-shrink-0">
        <circle cx="14" cy="14" r="11" fill="none" stroke="rgba(47, 82, 51, 0.12)" strokeWidth="2.5" />
        <circle
          cx="14" cy="14" r="11"
          fill="none"
          stroke="var(--emerald, #2F5233)"
          strokeWidth="2.5"
          strokeDasharray={2 * Math.PI * 11}
          strokeDashoffset={2 * Math.PI * 11 * (1 - pct)}
          strokeLinecap="round"
          transform="rotate(-90, 14, 14)"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <span className="font-mono text-xs font-semibold text-ink">
        {current + 1}<span className="text-ink/30 mx-0.5">/</span>{total}
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  Shared styling
// ═══════════════════════════════════════════════════════

const labelBase = "block text-sm font-medium text-ink/60 mb-1.5";
const inputBase =
  "w-full rounded-xl border border-ink/15 bg-paper px-4 py-3 text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-emerald/30 focus:border-emerald transition-all duration-200";

function ToggleGroup({ options, value, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`rounded-xl border-2 p-4 text-center transition-all duration-200 ${
              selected
                ? "border-emerald bg-emerald/5 shadow-sm"
                : "border-ink/10 bg-paper hover:border-emerald/30 hover:bg-emerald/[0.02]"
            }`}
            aria-pressed={selected}
          >
            <span
              className={`text-sm font-semibold block ${
                selected ? "text-emerald" : "text-ink/60"
              }`}
            >
              {opt.label}
            </span>
            {opt.sub && (
              <span className="text-xs text-ink/40 mt-0.5 block">
                {opt.sub}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  Main RitualPlanner — two-act structure
// ═══════════════════════════════════════════════════════

export default function RitualPlanner() {
  const { t } = useTranslation();
  const { addAlert } = useAlert();
  const prefersReduced = useReducedMotion();

  // ── State ──
  const [step, setStep] = useState("form"); // "form" | "loading" | "result"
  const [progress, setProgress] = useState(0);
  const [form, setForm] = useState({
    ritualType: "",
    ageGroup: "",
    healthCondition: "",
    travelMode: "",
  });
  const [error, setError] = useState("");
  const [plan, setPlan] = useState(null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  // ── Refs (all panels always in DOM → refs always valid) ──
  const containerRef = useRef(null);
  const formPanelRef = useRef(null);
  const resultPanelRef = useRef(null);
  const loadingPanelRef = useRef(null);
  const timelineRef = useRef(null);
  const stepCardsRef = useRef([]);
  const fieldsRef = useRef([]);
  const submitRef = useRef(null);
  const ctxRef = useRef(null);
  const isEditingRef = useRef(false); // prevents stagger re-run on edit

  // ── Field change ──
  const setField = useCallback((name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
  }, []);

  const canSubmit = form.ritualType && form.ageGroup && form.travelMode;

  // ── Submit ──
  const handleSubmit = useCallback(async () => {
    if (!canSubmit) {
      setError("Please fill in all required fields.");
      return;
    }

    setError("");
    setStep("loading");
    setProgress(0);

    const MIN_DISPLAY_MS = 1200;
    const startTime = Date.now();

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(60 + (elapsed / (MIN_DISPLAY_MS * 2)) * 30, 90);
      setProgress(Math.round(pct));
    }, 100);

    try {
      const res = await api.post("/api/plans/generate", form);
      const planData = res.data.plan;

      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_DISPLAY_MS) {
        await new Promise((r) => setTimeout(r, MIN_DISPLAY_MS - elapsed));
      }

      clearInterval(progressInterval);
      setProgress(100);

      await new Promise((r) => setTimeout(r, 400));

      setPlan(planData);
      setStep("result");
      setActiveStepIndex(0);
      addAlert("Plan generated successfully!", "success");

      setTimeout(() => {
        timelineRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 200);
    } catch (err) {
      clearInterval(progressInterval);
      const msg =
        err.response?.data?.error || "Failed to generate plan. Please try again.";
      setError(msg);
      setStep("form");
    }
  }, [canSubmit, form, addAlert]);

  // ── Edit & Regenerate (GSAP crossfade) ──
  const handleEdit = useCallback(() => {
    if (ctxRef.current) ctxRef.current.revert();

    // Tell the stagger effect to skip re-animation
    isEditingRef.current = true;

    const editCtx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "power3.inOut" },
        onComplete: () => {
          setStep("form");
          setPlan(null);
          setActiveStepIndex(0);
        },
      });

      if (prefersReduced) {
        gsap.set(resultPanelRef.current, { opacity: 0 });
        gsap.set(formPanelRef.current, { opacity: 1 });
        setStep("form");
        setPlan(null);
        return;
      }

      // Both panels are always in the DOM — refs are valid
      tl.to(resultPanelRef.current, {
        opacity: 0,
        y: 20,
        scale: 0.97,
        duration: 0.3,
      });
      tl.to(
        formPanelRef.current,
        { opacity: 1, y: 0, scale: 1, duration: 0.35 },
        "-=0.15"
      );
    }, containerRef);

    ctxRef.current = editCtx;

    // Auto-clean after animation completes
    setTimeout(() => {
      if (ctxRef.current === editCtx) {
        editCtx.revert();
        ctxRef.current = null;
      }
    }, 1000);
  }, [prefersReduced]);

  // Cleanup any orphaned context on unmount
  useEffect(() => {
    return () => {
      if (ctxRef.current) {
        ctxRef.current.revert();
        ctxRef.current = null;
      }
    };
  }, []);

  // ── Form entrance stagger animation ──
  useEffect(() => {
    if (step !== "form" || prefersReduced || isEditingRef.current) return;

    const els = fieldsRef.current.filter(Boolean);
    const ctx = gsap.context(() => {
      if (els.length > 0) {
        gsap.fromTo(
          els,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: "power3.out" }
        );
      }
      if (submitRef.current) {
        gsap.fromTo(
          submitRef.current,
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.4, delay: 0.4, ease: "power3.out" }
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, [step, prefersReduced]);

  // ── Loading entrance ──
  useEffect(() => {
    if (step !== "loading" || prefersReduced) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        loadingPanelRef.current,
        { opacity: 0, scale: 0.95 },
        { opacity: 1, scale: 1, duration: 0.4, ease: "power3.out" }
      );
    }, loadingPanelRef);
    return () => ctx.revert();
  }, [step, prefersReduced]);

  // ── Result entrance ──
  useEffect(() => {
    if (step !== "result" || prefersReduced) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        resultPanelRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }
      );
    }, resultPanelRef);
    return () => ctx.revert();
  }, [step, prefersReduced]);

  // ── Track active step via IntersectionObserver ──
  useEffect(() => {
    if (step !== "result" || !plan?.generatedSteps) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = parseInt(entry.target.dataset.stepIndex, 10);
            if (!isNaN(idx)) setActiveStepIndex(idx);
          }
        });
      },
      { rootMargin: "-40% 0px -40% 0px" }
    );

    stepCardsRef.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [step, plan]);

  // ── Reset editing flag after stagger cycle ──
  useEffect(() => {
    if (step === "form") {
      // After the next frame, allow stagger again
      const id = setTimeout(() => {
        isEditingRef.current = false;
      }, 800);
      return () => clearTimeout(id);
    }
  }, [step]);

  // ── Compute which panel is visible ──
  const showForm = step === "form";
  const showLoading = step === "loading";
  const showResult = step === "result";

  // ════════════════════════════════════════════════════
  //  Render — all three panels always in the DOM
  // ════════════════════════════════════════════════════

  return (
    <div className="max-w-4xl mx-auto py-8 lg:py-12" ref={containerRef}>
      {/* ── FORM PANEL ── */}
      <div
        ref={formPanelRef}
        style={{
          display: showForm || isEditingRef.current ? "block" : "none",
          opacity: showForm ? 1 : 0,
          willChange: "transform, opacity",
        }}
        key="form-panel"
      >
        <div className="mb-8">
          <RevealText
            as="h1"
            mode="words"
            stagger={0.04}
            duration={0.6}
            threshold={0.1}
            className="font-display text-3xl lg:text-5xl font-semibold text-ink leading-tight"
          >
            {t("planner.title", "Your Pilgrimage Plan")}
          </RevealText>
          <RevealText
            as="p"
            mode="words"
            stagger={0.03}
            duration={0.5}
            threshold={0.1}
            className="text-sm text-ink/50 mt-3 font-mono"
          >
            {t(
              "planner.subtitle",
              "Tell us about yourself and we'll generate a personalised step-by-step guide."
            )}
          </RevealText>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-clay-alert/20 bg-clay-alert/5 px-5 py-3 text-sm text-clay-alert flex items-start gap-3">
            <svg
              className="w-5 h-5 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <div className="rounded-2xl border border-ink/10 bg-sand/40 p-6 lg:p-8">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="space-y-6"
          >
            <div ref={(el) => (fieldsRef.current[0] = el)}>
              <label className={labelBase}>
                {t("planner.ritualType", "Ritual Type")}{" "}
                <span className="text-clay-alert">*</span>
              </label>
              <ToggleGroup
                value={form.ritualType}
                onChange={(v) => setField("ritualType", v)}
                options={[
                  {
                    value: "hajj",
                    label: t("nav.hajj", "Hajj"),
                    sub: t("planner.hajjDesc", "Full pilgrimage — 5–6 days"),
                  },
                  {
                    value: "umrah",
                    label: t("nav.umrah", "Umrah"),
                    sub: t("planner.umrahDesc", "Lesser pilgrimage — 2–4 hours"),
                  },
                ]}
              />
            </div>

            <div ref={(el) => (fieldsRef.current[1] = el)}>
              <label className={labelBase}>
                {t("planner.ageGroup", "Age Group")}{" "}
                <span className="text-clay-alert">*</span>
              </label>
              <ToggleGroup
                value={form.ageGroup}
                onChange={(v) => setField("ageGroup", v)}
                options={[
                  {
                    value: "child",
                    label: t("planner.child", "Child"),
                    sub: t("planner.childAge", "Under 12"),
                  },
                  {
                    value: "adult",
                    label: t("planner.adult", "Adult"),
                    sub: t("planner.adultAge", "12–59"),
                  },
                  {
                    value: "senior",
                    label: t("planner.senior", "Senior"),
                    sub: t("planner.seniorAge", "60+"),
                  },
                ]}
              />
            </div>

            <div ref={(el) => (fieldsRef.current[2] = el)}>
              <label className={labelBase}>
                {t("planner.healthCondition", "Health Condition")}{" "}
                <span className="text-ink/30 font-normal">
                  {t("planner.optional", "(optional)")}
                </span>
              </label>
              <input
                type="text"
                value={form.healthCondition}
                onChange={(e) => setField("healthCondition", e.target.value)}
                placeholder={t(
                  "planner.healthPlaceholder",
                  'e.g. "mobility issues", "diabetes", "asthma"'
                )}
                className={inputBase}
              />
              <p className="mt-1 text-xs text-ink/40 font-mono">
                {t(
                  "planner.healthHint",
                  "We'll include relevant tips based on your condition."
                )}
              </p>
            </div>

            <div ref={(el) => (fieldsRef.current[3] = el)}>
              <label className={labelBase}>
                {t("planner.travelMode", "Travel Mode")}{" "}
                <span className="text-clay-alert">*</span>
              </label>
              <ToggleGroup
                value={form.travelMode}
                onChange={(v) => setField("travelMode", v)}
                options={[
                  {
                    value: "solo",
                    label: t("planner.solo", "Solo"),
                    sub: t("planner.soloDesc", "Travel independently"),
                  },
                  {
                    value: "group",
                    label: t("planner.group", "Group"),
                    sub: t("planner.groupDesc", "With an organised group"),
                  },
                ]}
              />
            </div>

            <div ref={submitRef}>
              <MagneticButton
                as="button"
                type="submit"
                disabled={!canSubmit}
                className="btn-primary w-full py-3.5 text-base font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {t("planner.generate", "Generate My Plan")}
              </MagneticButton>
            </div>
          </form>
        </div>
      </div>

      {/* ── LOADING PANEL ── */}
      <div
        ref={loadingPanelRef}
        style={{
          display: showLoading ? "block" : "none",
          opacity: showLoading ? 1 : 0,
          willChange: "transform, opacity",
        }}
        key="loading-panel"
      >
        <PlanLoading progress={progress} />
      </div>

      {/* ── RESULT PANEL ── */}
      <div
        ref={resultPanelRef}
        style={{
          display: showResult ? "block" : "none",
          opacity: showResult ? 1 : 0,
          willChange: "transform, opacity",
        }}
        key="result-panel"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl lg:text-4xl font-semibold text-ink leading-tight">
            {t("planner.yourPlan", "Your Personalised Plan")}
          </h1>
          <p className="text-sm font-mono text-ink/50 mt-1">
            {plan?.ritualType
              ? plan.ritualType.charAt(0).toUpperCase() + plan.ritualType.slice(1)
              : ""}
            {plan?.ageGroup ? ` · ${plan.ageGroup}` : ""}
            {plan?.healthCondition ? ` · ${plan.healthCondition}` : ""}
            {plan?.travelMode ? ` · ${plan.travelMode}` : ""}
          </p>
        </div>

        {/* Edit & Regenerate */}
        <button
          onClick={handleEdit}
          className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-ink/15 text-sm text-ink/60 hover:text-emerald hover:border-emerald/30 hover:bg-emerald/5 transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
            />
          </svg>
          {t("planner.editRegenerate", "Edit & Regenerate")}
        </button>

        {/* Timeline + Steps */}
        <div
          ref={timelineRef}
          className="rounded-2xl border border-ink/10 bg-paper p-6 lg:p-8"
        >
          <div className="flex gap-6">
            <div
              className="hidden lg:block flex-shrink-0 w-10 pt-2"
              aria-hidden="true"
            >
              {plan?.generatedSteps && (
                <PlanTimelineSVG
                  stepCount={plan.generatedSteps.length}
                  activeIndex={activeStepIndex}
                />
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-2">
              {plan?.generatedSteps?.map((s, i) => (
                <div
                  key={i}
                  ref={(el) => {
                    stepCardsRef.current[i] = el;
                  }}
                  data-step-index={i}
                >
                  <PlanStepCard
                    step={s}
                    index={i}
                    isActive={i === activeStepIndex}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Mobile dots */}
          {plan?.generatedSteps && plan.generatedSteps.length > 0 && (
            <div className="lg:hidden mt-4 flex justify-center gap-2">
              {plan.generatedSteps.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    i <= activeStepIndex ? "bg-emerald w-4" : "bg-ink/15"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Mini progress */}
        {plan?.generatedSteps?.length > 0 && (
          <MiniProgress
            current={activeStepIndex}
            total={plan.generatedSteps.length}
          />
        )}
      </div>
    </div>
  );
}
