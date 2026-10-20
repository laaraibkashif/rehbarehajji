"use client";

import { useState, useRef, useEffect, useContext } from "react";
import gsap from "gsap";
import useReducedMotion from "../../hooks/useReducedMotion";
import { LenisContext } from "./LenisContext";

// ────────────────────────────────────────────
// Asset-loading helpers
// ────────────────────────────────────────────

/**
 * Load a font family with one or more variation descriptors.
 * Uses allSettled so a single failed face never blocks progress.
 */
function loadFont(family, ...descriptors) {
  return Promise.allSettled(
    descriptors.map((d) => document.fonts.load(d).catch(() => {})),
  );
}

/**
 * Load an image by URL.  Always resolves so a missing asset never
 * blocks the preloader indefinitely.
 */
function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = resolve;
    img.onerror = resolve;
    img.src = src;
  });
}

// ────────────────────────────────────────────
// Tracked assets with weightings (% of total)
// ────────────────────────────────────────────

const ASSETS = [
  {
    id: "Fraunces",
    weight: 30,
    load: () =>
      loadFont(
        "Fraunces",
        "400 1em Fraunces",
        "600 1em Fraunces",
        "700 1em Fraunces",
      ),
  },
  {
    id: "Inter",
    weight: 30,
    load: () =>
      loadFont(
        "Inter",
        "400 1em Inter",
        "500 1em Inter",
        "600 1em Inter",
        "700 1em Inter",
      ),
  },
  {
    id: "IBM Plex Mono",
    weight: 25,
    load: () =>
      loadFont(
        "IBM Plex Mono",
        "400 1em IBM Plex Mono",
        "600 1em IBM Plex Mono",
      ),
  },
  {
    id: "favicon",
    weight: 15,
    load: () => loadImage("/favicon.svg"),
  },
];

const TOTAL_WEIGHT = ASSETS.reduce((s, a) => s + a.weight, 0);
const MIN_DISPLAY_MS = 2500;

// ────────────────────────────────────────────
// Component
// ────────────────────────────────────────────

/**
 * SitePreloader
 *
 * Full-viewport loading screen shown on the user's first visit per session.
 * Displays a large Fraunces percentage counter (0 % → 100 %) driven by
 * real asset-loading progress, paired with a thin emerald progress bar.
 *
 * Once assets are loaded and a minimum 800 ms have elapsed, runs a dramatic
 * exit sequence: counter/bar fade out, then the preloader panel splits into
 * two halves that slide apart, revealing the hero page underneath.
 *
 * Skip rules (no delay, renders children immediately):
 *   – prefers-reduced-motion
 *   – repeat visit within the same session (sessionStorage flag)
 *
 * Scroll is locked (CSS `overflow: hidden`) while the preloader is active.
 * Lenis is paused and resumed automatically.
 */
export default function SitePreloader({ children }) {
  const prefersReduced = useReducedMotion();
  const lenis = useContext(LenisContext);
  const [visible, setVisible] = useState(true);

  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const counterRef = useRef(null);
  const progressFillRef = useRef(null);
  const panelLeftRef = useRef(null);
  const panelRightRef = useRef(null);

  // Keep a ref always in sync with the context value so promise callbacks
  // and the separate lenis-control effect can access the latest instance
  // without causing the main loading effect to re-run.
  const lenisRef = useRef(null);
  lenisRef.current = lenis;

  // Track whether the loading flow has started (prevents a double-start
  // if the component re-renders while loading is already in progress).
  const startedRef = useRef(false);

  // GSAP timeline ref — killed on unmount to prevent orphaned animations
  const tlRef = useRef(null);

  // ── Separate effect: stop Lenis once it becomes available ──
  // This runs independently of the loading effect so we don't restart
  // asset tracking when the Lenis instance transitions from null → real.
  useEffect(() => {
    if (lenis && startedRef.current) {
      lenis.stop();
    }
  }, [lenis]);

  // ── Main loading effect ──
  // NOTE: `lenis` is deliberately excluded from the dependency array.
  // Including it would re-run and reset loading progress when Lenis
  // becomes available after initial mount.
  useEffect(() => {
    // ── Skip checks ──
    if (prefersReduced) {
      setVisible(false);
      return;
    }

    let isRepeat = false;
    try {
      isRepeat = sessionStorage.getItem("rehbar-preloaded") === "true";
    } catch {
      /* sessionStorage unavailable — treat as first visit */
    }
    if (isRepeat) {
      setVisible(false);
      return;
    }

    // ── Guard: only start loading once (important for StrictMode) ──
    if (startedRef.current) return;
    startedRef.current = true;

    const container = containerRef.current;
    const contentEl = contentRef.current;
    const counterEl = counterRef.current;
    const progressFill = progressFillRef.current;
    const panelLeft = panelLeftRef.current;
    const panelRight = panelRightRef.current;

    if (
      !container ||
      !contentEl ||
      !counterEl ||
      !progressFill ||
      !panelLeft ||
      !panelRight
    )
      return;

    // Lock body scroll
    document.body.style.overflow = "hidden";

    // Pause Lenis (safe no-op if still null)
    lenisRef.current?.stop();

    // ── Loading state ──
    let loadedWeight = 0;
    const counterData = { val: 0 };

    /** Smoothly animate the counter text and progress bar to `target` percent. */
    function animateTo(target) {
      const clamped = Math.min(Math.max(target, 0), 100);

      gsap.to(counterData, {
        val: clamped,
        duration: 0.4,
        ease: "power2.out",
        overwrite: "auto",
        onUpdate: () => {
          if (counterEl) counterEl.textContent = `${Math.round(counterData.val)}%`;
        },
      });

      gsap.to(progressFill, {
        scaleX: clamped / 100,
        duration: 0.4,
        ease: "power2.out",
        overwrite: "auto",
      });
    }

    // Start all asset-loading promises; each resolve bumps the progress
    // Note: load helpers never reject, so no `.catch()` needed.
    const assetPromises = ASSETS.map((asset) =>
      asset.load().then(() => {
        loadedWeight += asset.weight;
        animateTo((loadedWeight / TOTAL_WEIGHT) * 100);
      }),
    );

    // Minimum-display-time timer
    const minTimer = new Promise((r) => setTimeout(r, MIN_DISPLAY_MS));

    // ── All assets loaded + min time elapsed → exit sequence ──
    Promise.all([...assetPromises, minTimer]).then(() => {
      // 1. Animate counter smoothly to 100 (slower, more visible)
      gsap.to(counterData, {
        val: 100,
        duration: 1.5,
        ease: "power3.out",
        overwrite: "auto",
        onUpdate: () => {
          if (counterEl) counterEl.textContent = `${Math.round(counterData.val)}%`;
        },
        onComplete: () => {
          // 2. Exit timeline — the single most polished moment on the site
          const tl = gsap.timeline({
            onComplete: () => {
              // Mark session
              try {
                sessionStorage.setItem("rehbar-preloaded", "true");
              } catch {
                /* ignore */
              }

              // Unlock scroll
              document.body.style.overflow = "";
              lenisRef.current?.start();

              // Unmount preloader
              setVisible(false);
            },
          });
          tlRef.current = tl;

          // Phase A — counter & bar fade, scale, blur out (0.5s)
          tl.to(contentEl, {
            opacity: 0,
            scale: 0.85,
            filter: "blur(6px)",
            duration: 0.5,
            ease: "power3.in",
          });

          // Phase B — panels split apart (overlapping, total ~1.4s)
          tl.to(
            panelLeft,
            { x: "-100%", duration: 1.4, ease: "power4.inOut" },
            "-=0.15",
          );
          tl.to(
            panelRight,
            { x: "100%", duration: 1.4, ease: "power4.inOut" },
            "-=1.4",
          );

          // Phase C — hide container after animation
          tl.set(container, { display: "none" });
        },
      });
    });

    // ── Cleanup ──
    return () => {
      tlRef.current?.kill();
      tlRef.current = null;
      document.body.style.overflow = "";
      startedRef.current = false; // reset so StrictMode re-mount can proceed
    };
  }, [prefersReduced]);

  // ── Skip / hidden → render children directly ──
  if (!visible) return <>{children}</>;

  // ── Preloader visible ──
  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] overflow-hidden"
      style={{ backgroundColor: "var(--paper, #FAF8F2)" }}
    >
      {/* ── Counter + progress bar (z-20, above panels) ── */}
      <div
        ref={contentRef}
        className="absolute inset-0 z-20 flex flex-col items-center justify-center"
      >
        {/* Large Fraunces percentage */}
        <div
          ref={counterRef}
          className="select-none"
          role="status"
          aria-live="polite"
          aria-label="Loading progress"
          style={{
            fontFamily: "var(--font-display, 'Fraunces', serif)",
            fontSize: "clamp(5rem, 20vw, 12rem)",
            fontWeight: 600,
            fontVariationSettings: "'opsz' 72",
            lineHeight: 0.9,
            letterSpacing: "-0.04em",
            color: "var(--ink, #16241C)",
            willChange: "filter, transform, opacity",
          }}
        >
          0%
        </div>

        {/* Thin emerald progress bar */}
        <div
          className="relative mt-8 overflow-hidden"
          role="progressbar"
          aria-valuenow={0}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Loading progress bar"
          style={{
            width: "clamp(120px, 30vw, 280px)",
            height: 2,
            borderRadius: 1,
            backgroundColor: "rgba(22, 36, 28, 0.08)",
          }}
        >
          <div
            ref={progressFillRef}
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

        {/* Subtle eyebrow label */}
        <span
          className="typo-eyebrow mt-16"
          aria-hidden="true"
          style={{
            color: "rgba(22, 36, 28, 0.25)",
            fontSize: "0.6875rem",
          }}
        >
          Loading pilgrimage…
        </span>
      </div>

      {/* ── Split panels (z-10 — behind content, above children) ── */}
      <div
        ref={panelLeftRef}
        className="absolute top-0 left-0 z-10 h-full"
        style={{
          width: "50vw",
          backgroundColor: "var(--paper, #FAF8F2)",
          willChange: "transform",
        }}
      />
      <div
        ref={panelRightRef}
        className="absolute top-0 right-0 z-10 h-full"
        style={{
          width: "50vw",
          backgroundColor: "var(--paper, #FAF8F2)",
          willChange: "transform",
        }}
      />

      {/* ── Child app (renders underneath — mounts early, hidden visually) ── */}
      <div className="relative z-0 min-h-screen">{children}</div>
    </div>
  );
}
