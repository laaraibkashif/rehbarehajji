"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import gsap from "gsap";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useAlert } from "../components/Alert";
import { RevealText } from "../components/animations";
import useReducedMotion from "../hooks/useReducedMotion";
import SlidingPill from "../components/SlidingPill";

// ═══════════════════════════════════════════════════════════
//  Constants
// ═══════════════════════════════════════════════════════════

const CIRCUITS_TOTAL = 7;
const RING_SIZE = 240; // viewBox & CSS size
const STROKE_W = 8;

/** Return SVG arc length & computed offset for a given count out of 7. */
function ringGeometry(count) {
  const r = (RING_SIZE - STROKE_W) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(Math.max(count / CIRCUITS_TOTAL, 0), 1);
  return { radius: r, circumference: c, offset: c * (1 - pct) };
}

// ═══════════════════════════════════════════════════════════
//  TactileRing — the main tap target
// ═══════════════════════════════════════════════════════════

function TactileRing({ count, onTap, loading, completed }) {
  const prefersReduced = useReducedMotion();

  const svgRef = useRef(null);
  const ringRef = useRef(null);
  const glowRef = useRef(null);
  const numeralRef = useRef(null);
  const labelRef = useRef(null);

  const { radius, circumference, offset } = ringGeometry(count);

  // ── Animate ring stroke when count changes ──
  useEffect(() => {
    if (!ringRef.current) return;

    const ctx = gsap.context(() => {
      if (prefersReduced) {
        gsap.set(ringRef.current, { strokeDashoffset: offset });
        if (numeralRef.current) {
          numeralRef.current.textContent = String(count);
        }
        return;
      }

      // Kill any in-progress ring tweens
      gsap.killTweensOf(ringRef.current);

      // Animate stroke to new offset
      gsap.to(ringRef.current, {
        strokeDashoffset: offset,
        duration: 0.4,
        ease: "power2.out",
      });

      // Count-up animation on numeral
      if (numeralRef.current) {
        const prevVal = parseInt(numeralRef.current.textContent, 10) || 0;

        // On mode switch, start from 0 so the count always counts upward
        const startVal = prevVal > count ? 0 : prevVal;
        numeralRef.current.textContent = String(startVal);

        const data = { val: startVal };
        gsap.killTweensOf(data);
        gsap.to(data, {
          val: count,
          duration: 0.35,
          ease: "power2.out",
          onUpdate: () => {
            if (numeralRef.current) {
              numeralRef.current.textContent = String(Math.round(data.val));
            }
          },
        });
      }
    });

    return () => ctx.revert();
  }, [count, offset, prefersReduced]);

  // ── Scale-punch animation (triggered on tap) ──
  const punchRef = useRef(null);

  const punch = useCallback(() => {
    if (!svgRef.current || prefersReduced) return;

    // Clean up any previous punch animation
    if (punchRef.current) {
      punchRef.current.revert();
      punchRef.current = null;
    }

    const ctx = gsap.context(() => {
      gsap.killTweensOf(svgRef.current);
      gsap.killTweensOf(numeralRef.current);

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.to(svgRef.current, { scale: 1.08, duration: 0.1, ease: "power2.out" }, 0);
      tl.to(svgRef.current, { scale: 1, duration: 0.18, ease: "back.out(2.5)" }, 0.08);

      if (numeralRef.current) {
        tl.to(numeralRef.current, { scale: 1.12, duration: 0.08, ease: "power2.out" }, 0);
        tl.to(numeralRef.current, { scale: 1, duration: 0.15, ease: "back.out(3)" }, 0.07);
      }

      if (glowRef.current) {
        gsap.fromTo(
          glowRef.current,
          { opacity: 0.6, scale: 0.97 },
          { opacity: 0, scale: 1.04, duration: 0.35, ease: "power2.out" }
        );
      }
    });

    punchRef.current = ctx;

    // Auto-clean after animations complete
    setTimeout(() => {
      if (punchRef.current === ctx) {
        ctx.revert();
        punchRef.current = null;
      }
    }, 500);
  }, [prefersReduced]);

  // Cleanup punch context on unmount
  useEffect(() => {
    return () => {
      if (punchRef.current) {
        punchRef.current.revert();
        punchRef.current = null;
      }
    };
  }, []);

  // ── Completion glow (full ring gold glow, calm) ──
  useEffect(() => {
    if (!glowRef.current) return;

    const ctx = gsap.context(() => {
      if (completed && !prefersReduced) {
        gsap.to(glowRef.current, {
          opacity: 0.15,
          scale: 1.06,
          duration: 0.8,
          ease: "power2.out",
        });
      } else if (!prefersReduced) {
        gsap.to(glowRef.current, {
          opacity: 0,
          scale: 1,
          duration: 0.4,
          ease: "power2.out",
        });
      } else {
        gsap.set(glowRef.current, { opacity: 0, scale: 1 });
      }
    });

    return () => ctx.revert();
  }, [completed, prefersReduced]);

  return (
    <button
      onClick={(e) => {
        if (!loading && onTap) {
          punch();
          onTap(e);
        }
      }}
      disabled={loading}
      className="relative select-none touch-none outline-none focus-visible:outline-2 focus-visible:outline-emerald focus-visible:outline-offset-8 rounded-full"
      aria-label={`Tap to count. Current: ${count} of ${CIRCUITS_TOTAL}`}
    >
      {/* SVG ring container */}
      <div
        ref={svgRef}
        className="relative"
        style={{
          width: RING_SIZE,
          height: RING_SIZE,
          willChange: "transform",
        }}
      >
        <svg
          width={RING_SIZE}
          height={RING_SIZE}
          viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
          className="block transform -rotate-90"
          role="progressbar"
          aria-valuenow={count}
          aria-valuemin={0}
          aria-valuemax={CIRCUITS_TOTAL}
        >
          {/* Glow filter */}
          <defs>
            <filter id="ring-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Gold glow ring (behind main ring) */}
          {!prefersReduced && (
            <circle
              ref={glowRef}
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={radius}
              fill="none"
              stroke="var(--gold, #B8863E)"
              strokeWidth={STROKE_W + 2}
              opacity={0}
              style={{ willChange: "opacity, transform" }}
            />
          )}

          {/* Background track */}
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={radius}
            fill="none"
            stroke="rgba(47, 82, 51, 0.08)"
            strokeWidth={STROKE_W}
          />

          {/* Completed strokes (solid segments) */}
          {count > 0 && Array.from({ length: count }).map((_, i) => {
            const segAngle = (2 * Math.PI) / CIRCUITS_TOTAL;
            const startAngle = -Math.PI / 2 + i * segAngle;
            const endAngle = startAngle + segAngle * 0.85;
            const x1 = RING_SIZE / 2 + radius * Math.cos(startAngle);
            const y1 = RING_SIZE / 2 + radius * Math.sin(startAngle);
            const x2 = RING_SIZE / 2 + radius * Math.cos(endAngle);
            const y2 = RING_SIZE / 2 + radius * Math.sin(endAngle);
            // Only show separated strokes if not completed
            if (count < CIRCUITS_TOTAL) {
              return (
                <line
                  key={i}
                  x1={x1} y1={y1}
                  x2={x2} y2={y2}
                  stroke="var(--emerald, #2F5233)"
                  strokeWidth={STROKE_W}
                  strokeLinecap="round"
                  opacity={0.6}
                />
              );
            }
            return null;
          })}

          {/* Foreground arc (continuous for 7/7 completion, otherwise incremental) */}
          <circle
            ref={ringRef}
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={radius}
            fill="none"
            stroke={
              completed
                ? "var(--gold, #B8863E)"
                : "var(--emerald, #2F5233)"
            }
            strokeWidth={STROKE_W}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              willChange: "stroke-dashoffset",
              filter: completed ? "url(#ring-glow)" : "none",
            }}
          />

          {/* Completion: full gold arc */}
          {completed && (
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={radius}
              fill="none"
              stroke="var(--gold, #B8863E)"
              strokeWidth={STROKE_W}
              strokeDasharray={circumference}
              strokeDashoffset={0}
              strokeLinecap="round"
              opacity={0.3}
              style={{ filter: "url(#ring-glow)" }}
            />
          )}
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span
            ref={numeralRef}
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "clamp(2.5rem, 8vw, 4.5rem)",
              fontWeight: 600,
              lineHeight: 1,
              color: completed ? "var(--gold, #B8863E)" : "var(--ink, #16241C)",
              willChange: "transform",
            }}
          >
            {count}
          </span>
          <span
            ref={labelRef}
            className="font-mono text-[11px] uppercase tracking-widest mt-1"
            style={{ color: "rgba(22, 36, 28, 0.35)" }}
          >
            / {CIRCUITS_TOTAL}
          </span>
        </div>
      </div>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════
//  CompletionMessage — calm devotional overlay
// ═══════════════════════════════════════════════════════════

function CompletionMessage({ mode, onContinue }) {
  const { t } = useTranslation();

  const isTawaf = mode === "tawaf";

  return (
    <div className="text-center max-w-sm mx-auto mt-2">
      {/* Gold separator line */}
      <div className="w-16 h-px bg-gold/40 mx-auto mb-6" />

      {/* Affirming message */}
      <RevealText
        as="p"
        mode="words"
        stagger={0.05}
        duration={0.6}
        threshold={0.5}
        className="font-display text-xl lg:text-2xl font-semibold text-ink leading-snug"
      >
        {isTawaf
          ? t("tawaf.completeTawaf", "Tawaf complete. May Allah accept your worship.")
          : t("tawaf.completeSai", "Sa'i complete. May Allah accept your worship.")}
      </RevealText>

      <RevealText
        as="p"
        mode="words"
        stagger={0.04}
        duration={0.5}
        threshold={0.5}
        className="text-sm text-ink/50 mt-3 font-mono"
      >
        {isTawaf
          ? t("tawaf.tawafHint", "Two rak'ahs at Maqam Ibrahim await you.")
          : t("tawaf.saiHint", "Your Sa'i is complete. You may now proceed.")}
      </RevealText>

      {/* Continue to guide button */}
      <button
        onClick={onContinue}
        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald text-paper text-sm font-semibold hover:bg-emerald/90 transition-colors shadow-sm"
      >
        {t("tawaf.continueGuide", "Continue to Guide")}
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  ConfirmReset — GSAP-animated confirm state
// ═══════════════════════════════════════════════════════════

function ConfirmReset({ mode, onConfirm, onCancel, visible }) {
  const panelRef = useRef(null);
  const prefersReduced = useReducedMotion();


  useEffect(() => {
    if (!panelRef.current) return;

    const ctx = gsap.context(() => {
      if (visible) {
        if (prefersReduced) {
          gsap.set(panelRef.current, { opacity: 1, scale: 1 });
          return;
        }
        gsap.fromTo(
          panelRef.current,
          { opacity: 0, scale: 0.92 },
          { opacity: 1, scale: 1, duration: 0.3, ease: "power3.out" }
        );
      } else {
        gsap.set(panelRef.current, { opacity: 0, scale: 0.92 });
      }
    });

    return () => ctx.revert();
  }, [visible, prefersReduced]);

  if (!visible) return null;

  return (
    <div
      ref={panelRef}
      className="rounded-xl border border-clay-alert/20 bg-clay-alert/5 px-5 py-4 text-center"
      style={{ willChange: "transform, opacity" }}
    >
      <p className="text-sm font-medium text-clay-alert mb-3">
        Reset {mode === "tawaf" ? "Tawaf" : "Sa'i"} count to 0?
      </p>
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={onConfirm}
          className="px-4 py-2 rounded-lg bg-clay-alert text-paper text-sm font-semibold hover:bg-clay-alert/90 transition-colors"
          aria-label="Confirm reset"
        >
          Reset
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg bg-ink/5 text-ink/60 text-sm font-medium hover:bg-ink/10 transition-colors"
          aria-label="Cancel reset"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  ProgressDots — 7 small dots showing circuit progress
// ═══════════════════════════════════════════════════════════

function ProgressDots({ count, completed }) {
  return (
    <div className="flex items-center justify-center gap-2" aria-hidden="true">
      {Array.from({ length: CIRCUITS_TOTAL }, (_, i) => (
        <div
          key={i}
          className={`rounded-full transition-all duration-300 ${
            i < count
              ? completed
                ? "bg-gold w-3 h-3"
                : "bg-emerald w-3 h-3"
              : "bg-ink/8 w-2.5 h-2.5"
          }`}
        />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  Main TawafCounter
// ═══════════════════════════════════════════════════════════

export default function TawafCounter() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { addAlert } = useAlert();
  const navigate = useNavigate();
  const prefersReduced = useReducedMotion();
  const userId = user?._id || user?.id;

  // ── State ──
  const [mode, setMode] = useState("tawaf");
  const [count, setCount] = useState(0);
  const [prevCount, setPrevCount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const completed = count >= CIRCUITS_TOTAL;

  // Mode label for display
  const modeLabel = mode === "tawaf" ? "Tawaf" : "Sa'i";

  // ── Load count ──
  const loadCount = useCallback(
    async (modeOverride) => {
      if (!userId) return;
      const m = modeOverride || mode;
      try {
        const res = await api.get(`/api/tawaf/${userId}?type=${m}`);
        setCount(res.data.count);
        setPrevCount(null);
      } catch (err) {
        console.error("Failed to load count:", err);
        setCount(0);
      } finally {
        setInitialLoading(false);
      }
    },
    [userId, mode]
  );

  useEffect(() => {
    loadCount();
  }, [loadCount]);

  // ── Mode change ──
  const handleModeChange = useCallback(
    (newMode) => {
      if (newMode === mode) return;
      setMode(newMode);
      setShowResetConfirm(false);
      setError("");
      // Load count for the new mode
      setInitialLoading(true);
      // We pass newMode directly to avoid stale closure
      const m = newMode;
      (async () => {
        if (!userId) return;
        try {
          const res = await api.get(`/api/tawaf/${userId}?type=${m}`);
          // Count-up animation happens via the effect watching count
          setCount(res.data.count);
        } catch {
          setCount(0);
        } finally {
          setInitialLoading(false);
        }
      })();
    },
    [mode, userId]
  );

  // ── Tap handler ──
  const handleTap = useCallback(async () => {
    if (loading || !userId || completed) return;

    const newCount = count + 1;
    setPrevCount(count);
    setCount(newCount);
    setLoading(true);
    setError("");

    try {
      const res = await api.post(`/api/tawaf/${userId}/increment?type=${mode}`);
      setCount(res.data.count);

      if (res.data.count >= CIRCUITS_TOTAL) {
        addAlert(`${modeLabel} complete!`, "success");
      }
    } catch (err) {
      setCount(prevCount);
      setPrevCount(null);
      setError("Failed to save count. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [loading, userId, completed, count, mode, prevCount, modeLabel, addAlert]);

  // ── Undo handler ──
  const handleUndo = useCallback(() => {
    if (count <= 0 || completed) return;
    setCount((c) => Math.max(c - 1, 0));
  }, [count, completed]);

  // ── Reset handlers ──
  const handleResetRequest = useCallback(() => {
    if (loading) return;
    setShowResetConfirm(true);
  }, [loading]);

  const handleConfirmReset = useCallback(async () => {
    if (!userId) return;
    setShowResetConfirm(false);
    setPrevCount(count);
    setCount(0);
    setLoading(true);
    setError("");

    try {
      const res = await api.patch(`/api/tawaf/${userId}/reset?type=${mode}`);
      setCount(res.data.count);
      setPrevCount(null);
      addAlert("Counter reset.", "info");
    } catch (err) {
      setCount(prevCount);
      setPrevCount(null);
      setError("Failed to reset. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [userId, mode, count, prevCount, addAlert]);

  const handleCancelReset = useCallback(() => {
    setShowResetConfirm(false);
  }, []);

  // ── Continue to guide ──
  const handleContinueGuide = useCallback(() => {
    navigate(`/guide/${mode === "tawaf" ? "hajj" : "umrah"}`);
  }, [mode, navigate]);

  // ── Loading state ──
  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <svg width="48" height="48" viewBox="0 0 48 48" className="animate-spin" aria-hidden="true">
          <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(47, 82, 51, 0.12)" strokeWidth="3" />
          <circle
            cx="24" cy="24" r="20"
            fill="none"
            stroke="var(--emerald)"
            strokeWidth="3"
            strokeDasharray="126"
            strokeDashoffset="90"
            strokeLinecap="round"
          />
        </svg>
        <span className="sr-only">Loading counter…</span>
      </div>
    );
  }

  const canTap = !loading && !completed;
  const canUndo = count > 0 && !completed;

  return (
    <div className="max-w-md mx-auto py-8 lg:py-12">
      {/* ── Header ── */}
      <div className="text-center mb-8">
        <RevealText
          as="h1"
          mode="words"
          stagger={0.04}
          duration={0.6}
          threshold={0.1}
          className="font-display text-3xl lg:text-4xl font-semibold text-ink leading-tight"
        >
          {t("tawaf.title", "Counter")}
        </RevealText>
        <RevealText
          as="p"
          mode="words"
          stagger={0.03}
          duration={0.5}
          threshold={0.1}
          className="text-sm text-ink/50 mt-2 font-mono"
        >
          {mode === "tawaf"
            ? t("tawaf.tawafSubtitle", "Tap each circuit around the Kaaba")
            : t("tawaf.saiSubtitle", "Tap each round between Safa and Marwah")}
        </RevealText>
      </div>

      {/* ── Mode selector ── */}
      <div className="mb-8">
        <SlidingPill
          options={[
            { key: "tawaf", label: "Tawaf" },
            { key: "sai", label: "Sa'i" },
          ]}
          value={mode}
          onChange={handleModeChange}
          className="w-full max-w-xs mx-auto"
        />
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="mb-6 rounded-xl border border-clay-alert/20 bg-clay-alert/5 px-5 py-3 text-sm text-clay-alert text-center flex items-center justify-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* ── Main ring ── */}
      <div className="flex flex-col items-center mb-8">
        <TactileRing
          count={count}
          onTap={handleTap}
          loading={loading}
          completed={completed}
        />

        {/* Hint text below ring */}
        {!completed && (
          <p className="text-xs font-mono text-ink/30 mt-4 text-center">
            {canTap
              ? t("tawaf.tapHint", "Tap the ring to count")
              : t("tawaf.loadingHint", "Saving…")}
          </p>
        )}
      </div>

      {/* ── Progress dots ── */}
      <div className="mb-8">
        <ProgressDots count={count} completed={completed} />
      </div>

      {/* ── Completion message ── */}
      {completed && (
        <div className="mb-8">
          <CompletionMessage mode={mode} onContinue={handleContinueGuide} />
        </div>
      )}

      {/* ── Action buttons ── */}
      <div className="flex items-center justify-center gap-4 mt-2">
        {/* Undo */}
        <button
          onClick={handleUndo}
          disabled={!canUndo}
          className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-paper px-4 py-2 text-sm font-medium text-ink/50 hover:text-ink hover:border-ink/30 hover:bg-ink/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
          aria-label="Undo last count"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
          </svg>
          {t("tawaf.undo", "Undo")}
        </button>

        {/* Reset */}
        <button
          onClick={handleResetRequest}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-full border border-clay-alert/20 bg-paper px-4 py-2 text-sm font-medium text-clay-alert/70 hover:text-clay-alert hover:border-clay-alert/40 hover:bg-clay-alert/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
          aria-label="Reset counter"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
          </svg>
          {t("tawaf.reset", "Reset")}
        </button>
      </div>

      {/* ── Confirm reset (GSAP-animated, not browser confirm) ── */}
      <div className="mt-4 max-w-xs mx-auto">
        <ConfirmReset
          mode={mode}
          visible={showResetConfirm}
          onConfirm={handleConfirmReset}
          onCancel={handleCancelReset}
        />
      </div>

      {/* ── Info ── */}
      <p className="mt-10 text-xs text-ink/30 text-center leading-relaxed font-mono max-w-xs mx-auto">
        {mode === "tawaf"
          ? t("tawaf.tawafInfo", "Tawaf consists of 7 circuits around the Kaaba.")
          : t("tawaf.saiInfo", "Sa'i consists of 7 rounds between Safa and Marwah.")}
      </p>
    </div>
  );
}
