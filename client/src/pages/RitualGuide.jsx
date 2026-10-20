"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import api from "../services/api";
import { Parallax, RevealText } from "../components/animations";
import useReducedMotion from "../hooks/useReducedMotion";
import { getRitualImage } from "../utils/ritualImages";

gsap.registerPlugin(ScrollTrigger);

// ═══════════════════════════════════════════════════════
//  TimelineSVG — vertical path with step markers
// ═══════════════════════════════════════════════════════

function TimelineSVG({ steps, activeIndex, progress }) {
  const lineRef = useRef(null);
  const dotGroupRef = useRef(null);
  const prefersReduced = useReducedMotion();
  const svgHeight = 360; // fixed viewBox height
  const dotCount = steps.length;
  const padding = 20;
  const usableHeight = svgHeight - padding * 2;
  const spacing = dotCount > 1 ? usableHeight / (dotCount - 1) : 0;
  const lineLength = dotCount > 1 ? spacing * (dotCount - 1) : 0;

  // Line animates via parent's ScrollTrigger
  useEffect(() => {
    if (prefersReduced || !lineRef.current) return;
    // Initial state: hidden
    gsap.set(lineRef.current, { strokeDashoffset: lineLength });
    // Parent's ScrollTrigger drives this via a GSAP tween
  }, [lineLength, prefersReduced]);

  return (
    <svg
      viewBox={`0 0 40 ${svgHeight}`}
      className="w-full h-full"
      aria-hidden="true"
      data-timeline-line="true"
    >
      {/* Background guide line (very faint) */}
      <line
        x1="20" y1={padding}
        x2="20" y2={svgHeight - padding}
        stroke="rgba(47, 82, 51, 0.1)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Animated foreground line */}
      <line
        ref={lineRef}
        x1="20" y1={padding}
        x2="20" y2={svgHeight - padding}
        stroke="var(--emerald, #2F5233)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={lineLength}
        strokeDashoffset={prefersReduced ? 0 : lineLength}
        style={{ willChange: "stroke-dashoffset" }}
      />

      {/* Step markers */}
      <g ref={dotGroupRef}>
        {steps.map((_, i) => {
          const y = padding + spacing * i;
          const isActive = i <= activeIndex;
          const isCurrent = i === activeIndex;
          return (
            <g key={i}>
              {/* Outer ring */}
              <circle
                cx="20" cy={y} r="7"
                fill={isActive ? "var(--emerald, #2F5233)" : "transparent"}
                stroke={
                  isCurrent
                    ? "var(--emerald, #2F5233)"
                    : isActive
                      ? "var(--emerald, #2F5233)"
                      : "rgba(47, 82, 51, 0.25)"
                }
                strokeWidth="2.5"
                className="transition-colors duration-300"
              />
              {/* Inner dot (for active markers) */}
              {isActive && (
                <circle
                  cx="20" cy={y} r="2.5"
                  fill="#FAF8F2"
                  className="transition-opacity duration-300"
                />
              )}
            </g>
          );
        })}
      </g>

      {/* Bottom glow cap */}
      <circle cx="20" cy={svgHeight - padding} r="1.5" fill="rgba(47, 82, 51, 0.08)" />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════
//  MediaBlock — image/video/audio with Parallax drift
// ═══════════════════════════════════════════════════════

function MediaBlock({ mediaUrls, stepName, location }) {
  const { video, audioDua } = mediaUrls || {};
  // Admin-picked image wins; otherwise show the default photo for this ritual.
  const image = mediaUrls?.image || getRitualImage(stepName, location);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
      {image && (
        <Parallax speed={0.15} start="top bottom" end="bottom top">
          <div className="relative rounded-xl overflow-hidden bg-sand/50 border border-ink/5">
            <img
              src={image}
              alt={`${stepName} illustration`}
              loading="lazy"
              className="w-full aspect-[4/3] object-cover"
            />
          </div>
        </Parallax>
      )}

      {video && (
        <Parallax speed={0.1} start="top bottom" end="bottom top">
          <div className="relative rounded-xl overflow-hidden bg-sand/50 border border-ink/5">
            <video
              src={video}
              controls
              preload="metadata"
              playsInline
              className="w-full aspect-[4/3] object-cover bg-ink/5"
              aria-label={`${stepName} video guide`}
            />
          </div>
        </Parallax>
      )}

      {audioDua && (
        <Parallax speed={0.08} start="top bottom" end="bottom top">
          <div className="rounded-xl bg-sand/30 border border-ink/5 p-5 flex flex-col items-center">
            <p className="text-xs font-medium text-ink/60 mb-3">Supplication (Du'a) Audio</p>
            <audio
              src={audioDua}
              controls
              preload="none"
              className="w-full"
              aria-label={`Du'a audio for ${stepName}`}
            />
          </div>
        </Parallax>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  ErrorCallout — common mistakes using clay-alert
// ═══════════════════════════════════════════════════════

function ErrorCallout({ errors }) {
  if (!errors || errors.length === 0) return null;

  return (
    <div
      className="rounded-xl border border-clay-alert/20 bg-clay-alert/5 p-5 mt-6"
      role="alert"
    >
      <div className="flex items-start gap-3">
        <svg
          className="w-5 h-5 text-clay-alert flex-shrink-0 mt-0.5"
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
        <div className="flex-1 min-w-0">
          <RevealText
            as="h4"
            mode="words"
            stagger={0.03}
            duration={0.4}
            threshold={0.3}
            className="text-sm font-semibold text-clay-alert mb-2"
          >
            Common Mistakes to Avoid
          </RevealText>
          <ul className="space-y-1.5">
            {errors.map((err, i) => (
              <RevealText
                key={i}
                as="li"
                mode="words"
                stagger={0.02}
                duration={0.35}
                threshold={0.3}
                className="flex items-start gap-2 text-sm text-clay-alert/80"
              >
                <span className="mt-1.5 block w-1.5 h-1.5 rounded-full bg-clay-alert/30 flex-shrink-0" />
                {err}
              </RevealText>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  StepBlock — one step's full scroll section
// ═══════════════════════════════════════════════════════

function StepBlock({ step, index, isActive, onSelect, totalSteps }) {
  const sectionRef = useRef(null);

  return (
    <section
      ref={sectionRef}
      className="min-h-[80vh] py-16 lg:py-24 flex items-start"
      data-step-index={index}
      aria-label={`Step ${step.order}: ${step.name}`}
    >
      <div className="w-full">
        {/* Step number + name header */}
        <div className="flex items-center gap-3 mb-2">
          <span
            className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-mono font-bold transition-colors duration-500 ${
              isActive
                ? "bg-emerald text-paper"
                : "bg-ink/5 text-ink/40 border border-ink/10"
            }`}
          >
            {step.order}
          </span>
          <span className="typo-eyebrow text-[10px]">
            Step {step.order} of {totalSteps}
          </span>
        </div>

        {/* Step name */}
        <RevealText
          as="h2"
          mode="words"
          stagger={0.04}
          duration={0.6}
          threshold={0.2}
          className="font-display text-2xl lg:text-4xl font-semibold text-ink leading-tight mb-3"
        >
          {step.name}
        </RevealText>

        {/* Location tag */}
        <div className="flex items-center gap-1.5 mb-5">
          <svg className="w-4 h-4 text-emerald/60 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
          <span className="text-sm font-mono text-ink/50">{step.location}</span>
        </div>

        {/* Description */}
        <RevealText
          as="p"
          mode="words"
          stagger={0.04}
          duration={0.5}
          threshold={0.25}
          className="typo-body text-ink/70 max-w-2xl leading-relaxed"
        >
          {step.description}
        </RevealText>

        {/* Media (image/video/audio with Parallax) */}
        <MediaBlock mediaUrls={step.mediaUrls} stepName={step.name} location={step.location} />

        {/* Common errors */}
        <ErrorCallout errors={step.commonErrors} />

        {/* View detail button */}
        <button
          onClick={() => onSelect(step)}
          className="btn-secondary mt-6 text-sm"
          aria-label={`Open full details for ${step.name}`}
        >
          View full details
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </button>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════
//  DetailPanel — GSAP slide-in panel (side / full-screen sheet)
// ═══════════════════════════════════════════════════════

function DetailPanel({ step, onClose }) {
  const panelRef = useRef(null);
  const overlayRef = useRef(null);
  const innerRef = useRef(null);
  const prefersReduced = useReducedMotion();
  const [visible, setVisible] = useState(false);

  // Enter animation
  useEffect(() => {
    if (!step) {
      setVisible(false);
      return;
    }

    setVisible(true);

    if (prefersReduced) {
      gsap.set(panelRef.current, { x: 0, opacity: 1 });
      gsap.set(overlayRef.current, { opacity: 1 });
      return;
    }

    const isMobile = window.innerWidth < 1024;
    const initX = isMobile ? 0 : "100%";
    const initY = isMobile ? "100%" : 0;

    const ctx = gsap.context(() => {
      gsap.set(panelRef.current, { x: initX, y: initY, opacity: 1 });
      gsap.set(overlayRef.current, { opacity: 0 });

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.to(overlayRef.current, { opacity: 1, duration: 0.3 }, 0);
      tl.to(panelRef.current, { x: 0, y: 0, duration: 0.45 }, 0);
    });

    return () => ctx.revert();
  }, [step, prefersReduced]);

  // Exit animation
  const handleClose = useCallback(() => {
    if (prefersReduced || !panelRef.current) {
      onClose();
      return;
    }

    const isMobile = window.innerWidth < 1024;
    const exitX = isMobile ? 0 : "100%";
    const exitY = isMobile ? "100%" : 0;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "power3.in" },
        onComplete: onClose,
      });
      tl.to(panelRef.current, { x: exitX, y: exitY, opacity: 0, duration: 0.3 }, 0);
      tl.to(overlayRef.current, { opacity: 0, duration: 0.2 }, 0);
    });

    return () => ctx.revert();
  }, [onClose, prefersReduced]);

  // Trap focus — close on Escape
  useEffect(() => {
    if (!step) return;
    const handler = (e) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [step, handleClose]);

  if (!step && !visible) return null;

  const hasErrors = step?.commonErrors?.length > 0;

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-40 bg-ink/20 backdrop-blur-sm"
        style={{ willChange: "opacity", opacity: 0 }}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Details for ${step?.name}`}
        className="fixed z-50 lg:right-4 lg:top-24 lg:bottom-4 lg:w-[480px] lg:rounded-2xl inset-x-0 bottom-0 top-0 lg:top-auto rounded-t-2xl lg:rounded-2xl bg-paper border-l lg:border border-ink/10 shadow-2xl overflow-hidden"
        style={{ willChange: "transform, opacity", transform: "translateX(100%)" }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-ink/5 flex-shrink-0">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald/10 text-emerald text-xs font-mono font-bold">
                {step?.order}
              </span>
              <span className="text-xs font-medium text-ink/50 uppercase tracking-wider font-mono">
                Step {step?.order}
              </span>
            </div>
            <button
              onClick={handleClose}
              className="w-9 h-9 rounded-full bg-ink/5 hover:bg-ink/10 flex items-center justify-center text-ink/50 hover:text-ink transition-colors"
              aria-label="Close details"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Scrollable content */}
          <div ref={innerRef} className="flex-1 overflow-y-auto px-5 py-6">
            {step && (
              <div className="space-y-6">
                {/* Name */}
                <h2 className="font-display text-2xl lg:text-3xl font-semibold text-ink leading-tight">
                  {step.name}
                </h2>

                {/* Location */}
                <div className="flex items-center gap-2 text-sm text-ink/50 font-mono">
                  <svg className="w-4 h-4 text-emerald/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  {step.location}
                </div>

                {/* Description */}
                <p className="typo-body text-ink/70 leading-relaxed">
                  {step.description}
                </p>

                {/* Media */}
                <MediaBlock mediaUrls={step.mediaUrls} stepName={step.name} location={step.location} />

                {/* Errors */}
                {hasErrors && (
                  <div className="rounded-xl border border-clay-alert/20 bg-clay-alert/5 p-5">
                    <h4 className="text-sm font-semibold text-clay-alert mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                      </svg>
                      Common Mistakes
                    </h4>
                    <ul className="space-y-1.5">
                      {step.commonErrors.map((err, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-clay-alert/80">
                          <span className="mt-1.5 block w-1.5 h-1.5 rounded-full bg-clay-alert/30 flex-shrink-0" />
                          {err}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
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
      {/* Mini ring */}
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
//  Loading & Error states
// ═══════════════════════════════════════════════════════

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <svg width="48" height="48" viewBox="0 0 48 48" className="animate-spin" aria-hidden="true">
        <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(47, 82, 51, 0.12)" strokeWidth="3" />
        <circle cx="24" cy="24" r="20" fill="none" stroke="var(--emerald)" strokeWidth="3" strokeDasharray="126" strokeDashoffset="90" strokeLinecap="round" />
      </svg>
      <span className="sr-only">Loading guide…</span>
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-clay-alert/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-clay-alert/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h3 className="font-display text-xl font-semibold text-ink mb-1">Unable to load guide</h3>
        <p className="text-sm text-ink/50">{message}</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  GuideHeader — title + step count + toggle
// ═══════════════════════════════════════════════════════

function GuideHeader({ type, stepCount, onToggle }) {
  const { t } = useTranslation();

  const guideLabel = type === "hajj"
    ? t("nav.hajj", "Hajj")
    : t("nav.umrah", "Umrah");

  return (
    <header className="py-8 lg:py-12">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <RevealText
            as="h1"
            mode="words"
            stagger={0.04}
            duration={0.6}
            threshold={0.01}
            className="font-display text-3xl lg:text-5xl font-semibold text-ink leading-tight"
          >
            {guideLabel} {t("guide.title", "Guide")}
          </RevealText>
          <p className="text-sm text-ink/50 mt-2 font-mono">
            {stepCount} {t("guide.ritualSteps", "ritual steps")} · {t("guide.scrollHint", "scroll through the journey")}
          </p>
        </div>

        {/* Toggle buttons */}
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => onToggle?.("hajj")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              type === "hajj"
                ? "bg-emerald text-paper shadow-md"
                : "bg-ink/5 text-ink/60 hover:bg-ink/10"
            }`}
            aria-pressed={type === "hajj"}
          >
            {t("nav.hajj", "Hajj")}
          </button>
          <button
            onClick={() => onToggle?.("umrah")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              type === "umrah"
                ? "bg-emerald text-paper shadow-md"
                : "bg-ink/5 text-ink/60 hover:bg-ink/10"
            }`}
            aria-pressed={type === "umrah"}
          >
            {t("nav.umrah", "Umrah")}
          </button>
        </div>
      </div>

      {/* Decorative emerald line */}
      <div className="mt-6 h-px bg-gradient-to-r from-emerald/30 via-emerald/10 to-transparent" />
    </header>
  );
}

// ═══════════════════════════════════════════════════════
//  Main RitualGuide
// ═══════════════════════════════════════════════════════

export default function RitualGuide() {
  const { type: routeType } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const prefersReduced = useReducedMotion();

  const [type, setType] = useState(routeType || "hajj");
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [selectedStep, setSelectedStep] = useState(null);

  const contentRef = useRef(null);
  const stepRefs = useRef([]);
  const scrollTweenRef = useRef(null);

  // ── Fetch steps ──
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setActiveStepIndex(0);
    setSelectedStep(null);

    (async () => {
      try {
        const res = await api.get(`/api/rituals/${type}`);
        if (!cancelled) {
          setSteps(res.data.steps || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.error || "Could not load the guide.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [type]);

  // ── Sync route param with type ──
  useEffect(() => {
    if (routeType && routeType !== type) {
      setType(routeType);
    }
  }, [routeType]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggle = useCallback((newType) => {
    if (newType !== type) {
      navigate(`/guide/${newType}`, { replace: true });
    }
  }, [type, navigate]);

  // ── ScrollTrigger: line drawing + active step tracking ──
  useEffect(() => {
    if (loading || steps.length === 0 || prefersReduced) {
      if (scrollTweenRef.current) {
        scrollTweenRef.current.kill();
        scrollTweenRef.current = null;
      }
      return;
    }

    const content = contentRef.current;
    if (!content) return;

    // Find the timeline SVG line anywhere in the DOM
    const timelineSvg = document.querySelector("[data-timeline-line]");
    if (!timelineSvg) return;

    // The foreground animated line is the second <line> element
    const lines = timelineSvg.querySelectorAll("line");
    const fgLine = lines[1];
    if (!fgLine) return;

    // Read stroke-dasharray (set by TimelineSVG as an attribute)
    const dashArray = parseFloat(fgLine.getAttribute("stroke-dasharray") || "0");
    if (dashArray <= 0) return;

    const ctx = gsap.context(() => {
      // Animate the timeline SVG line drawing itself
      scrollTweenRef.current = gsap.to(fgLine, {
        strokeDashoffset: 0,
        ease: "none",
        scrollTrigger: {
          trigger: content,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
        },
      });

      // Track active step via IntersectionObserver-based ScrollTrigger
      stepRefs.current.forEach((ref, i) => {
        if (!ref) return;
        ScrollTrigger.create({
          trigger: ref,
          start: "top 45%",
          end: "top 15%",
          onEnter: () => setActiveStepIndex(i),
          onEnterBack: () => setActiveStepIndex(i),
        });
      });
    }, content);

    return () => ctx.revert();
  }, [loading, steps, prefersReduced]);

  // ── Refresh ScrollTrigger on type change ──
  useEffect(() => {
    ScrollTrigger.refresh();
  }, [steps]);

  // ── Step detail handler ──
  const handleSelectStep = useCallback((step) => {
    setSelectedStep(step);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedStep(null);
  }, []);

  // ── Render ──
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} />;
  if (steps.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-ink/50 font-mono text-sm">No ritual steps found for {type}.</p>
      </div>
    );
  }

  return (
    <div className="relative max-w-5xl mx-auto">
      {/* ── Desktop: Sticky Timeline ── */}
      <aside
        className="hidden lg:block fixed left-[max(0px,calc(50vw-32rem))] top-32 w-14 z-10"
        aria-hidden="true"
      >
        <div className="h-[55vh] flex items-center justify-center">
          <TimelineSVG
            steps={steps}
            activeIndex={activeStepIndex}
            progress={steps.length > 0 ? (activeStepIndex + 1) / steps.length : 0}
          />
        </div>
      </aside>

      {/* ── Main content ── */}
      <main ref={contentRef} className="lg:pl-20">

        <GuideHeader type={type} stepCount={steps.length} onToggle={handleToggle} />

        <div className="space-y-4">
          {steps.map((step, i) => (
            <div
              key={step._id}
              ref={(el) => { stepRefs.current[i] = el; }}
              className="relative"
            >
              {/* Mobile timeline dot (visible on small screens) */}
              <div className="lg:hidden absolute left-0 top-8 bottom-0 w-px bg-ink/8" aria-hidden="true" />
              <div
                className={`lg:hidden absolute left-[-3px] top-12 w-[7px] h-[7px] rounded-full border-2 transition-colors duration-300 z-10 ${
                  i <= activeStepIndex
                    ? "bg-emerald border-emerald"
                    : "bg-paper border-ink/20"
                }`}
                aria-hidden="true"
              />

              <StepBlock
                step={step}
                index={i}
                isActive={i === activeStepIndex}
                onSelect={handleSelectStep}
                totalSteps={steps.length}
              />
            </div>
          ))}
        </div>

        {/* Bottom spacer for scroll */}
        <div className="h-16 lg:h-24" />
      </main>

      {/* ── Detail panel ── */}
      <DetailPanel step={selectedStep} onClose={handleCloseDetail} />

      {/* ── Mini progress indicator ── */}
      {steps.length > 0 && (
        <MiniProgress current={activeStepIndex} total={steps.length} />
      )}
    </div>
  );
}
