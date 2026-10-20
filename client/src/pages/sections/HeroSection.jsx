"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { RevealText, MagneticButton } from "../../components/animations";

/**
 * HeroSection
 *
 * Full-viewport hero with:
 * – Background image loaded from section-images.json
 * – Abstract SVG decorative layers
 * – RevealText word-by-word headline
 * – MagneticButton CTA
 */
export default function HeroSection() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sectionImages, setSectionImages] = useState(null);

  // ── Load section images from JSON ──
  useEffect(() => {
    fetch("/section-images.json")
      .then((r) => r.json())
      .then(setSectionImages)
      .catch(() => {});
  }, []);

  return (
    <section
      className="relative min-h-screen overflow-hidden"
      style={{ backgroundColor: "var(--sand, #EBE3CE)" }}
    >
      {/* ── Background image from section-images.json ── */}
      {sectionImages?.hero?.background && (
        <div
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('${sectionImages.hero.background}')`,
            opacity: 0.6,
            filter: "saturate(0.8)",
          }}
          aria-hidden="true"
        />
      )}
      {/* Overlay gradient */}
      <div className="absolute inset-0 z-[1]" style={{
        background: sectionImages?.hero?.overlay || "linear-gradient(180deg, rgba(250,248,242,0.92) 0%, rgba(250,248,242,0.7) 50%, rgba(235,227,206,0.9) 100%)"
      }} />

      {/* ── Layer 1: Abstract geometric wayfinding motif ── */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <AbstractBg />
      </div>

      {/* ── Layer 2: Abstract pilgrim / horizon illustration ── */}
      <div className="absolute inset-0 z-[1] pointer-events-none">
        <PilgrimSilhouette />
      </div>

      {/* ── Decorative emerald accent line at bottom transition ── */}
      <div className="absolute bottom-0 left-0 right-0 z-10 flex items-end justify-center">
        <div className="w-full max-w-6xl mx-auto px-4">
          <div className="h-px bg-emerald/20" />
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-paper via-paper/60 to-transparent pointer-events-none z-[2]" />

      {/* ── Layer 3 (foreground): Hero text content ── */}
      <div className="relative z-[3] flex min-h-screen flex-col items-center justify-center px-4 py-24 text-center">
        {/* Eyebrow badge */}
        <div className="mb-6">
          <span className="typo-eyebrow inline-block rounded-full border border-emerald/15 bg-emerald/5 px-4 py-1.5 text-emerald">
            {t("landing.badge", "Hajj & Umrah Companion")}
          </span>
        </div>

        {/* Main headline — oversized Fraunces, revealed word-by-word */}
        <div className="max-w-5xl">
          <RevealText
            as="h1"
            mode="words"
            stagger={0.035}
            duration={0.7}
            distance={30}
            threshold={0.01}
            className="typo-hero text-ink mb-6"
          >
            {t(
              "landing.heroHeadline",
              "From your first intention to your last step — a guide that walks with you",
            )}
          </RevealText>
        </div>

        {/* Subtitle */}
        <RevealText
          as="p"
          mode="words"
          stagger={0.03}
          duration={0.6}
          distance={20}
          threshold={0.3}
          className="typo-body max-w-2xl text-ink/60 mx-auto mb-10"
        >
          {t(
            "landing.heroSub",
            "A step-by-step ritual planner, Tawaf counter, AI-powered Q&A, and emergency contacts — built for pilgrims, tested by pilgrims.",
          )}
        </RevealText>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <MagneticButton
            onClick={() => navigate(user ? "/planner" : "/register")}
            className="btn-primary text-base sm:text-lg px-10 py-3.5 min-w-[200px]"
          >
            {t("landing.ctaStart", "Begin Your Guide")}
          </MagneticButton>
          <button
            onClick={() => navigate("/login")}
            className="text-sm text-ink/50 hover:text-ink transition-colors underline underline-offset-4 decoration-emerald/30 hover:decoration-emerald/60"
          >
            {t("landing.loginLink", "Already have an account? Log in")}
          </button>
        </div>

        {/* Scroll indicator */}
        <div className="mt-16 flex flex-col items-center gap-2 text-ink/25">
          <span className="text-[10px] tracking-widest uppercase font-mono">
            {t("landing.scroll", "Scroll")}
          </span>
          <div className="flex flex-col items-center gap-1">
            <svg
              width="16"
              height="24"
              viewBox="0 0 16 24"
              fill="none"
              className="animate-bounce"
            >
              <rect
                x="1"
                y="1"
                width="14"
                height="22"
                rx="7"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <circle cx="8" cy="8" r="2" fill="currentColor" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Abstract geometric background (compass-rose / star-chart motif) ──

function AbstractBg() {
  return (
    <svg
      className="w-full h-full"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="hero-glow" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="rgba(47, 82, 51, 0.04)" />
          <stop offset="60%" stopColor="rgba(47, 82, 51, 0.02)" />
          <stop offset="100%" stopColor="rgba(47, 82, 51, 0)" />
        </radialGradient>
      </defs>

      {/* Central glow */}
      <circle cx="720" cy="400" r="400" fill="url(#hero-glow)" />

      {/* Compass-rose rings */}
      <g opacity={0.08} stroke="#2F5233" fill="none">
        <circle cx="720" cy="400" r="280" strokeWidth="0.5" />
        <circle cx="720" cy="400" r="340" strokeWidth="0.3" strokeDasharray="4 8" />
        <circle cx="720" cy="400" r="400" strokeWidth="0.3" />
        <circle cx="720" cy="400" r="100" strokeWidth="0.4" />
      </g>

      {/* Radial lines */}
      <g opacity={0.05} stroke="#2F5233" strokeWidth="0.4">
        {Array.from({ length: 12 }, (_, i) => (
          <line
            key={i}
            x1={720}
            y1={400}
            x2={720 + 420 * Math.cos((i * 30 * Math.PI) / 180)}
            y2={400 + 420 * Math.sin((i * 30 * Math.PI) / 180)}
          />
        ))}
      </g>

      {/* Scattered dots */}
      <g fill="#2F5233" opacity={0.12}>
        {Array.from({ length: 80 }, (_, i) => (
          <circle
            key={i}
            cx={200 + Math.random() * 1040}
            cy={100 + Math.random() * 700}
            r={1 + Math.random() * 2}
          />
        ))}
      </g>

      {/* Crescent arc (subtle wayfinding symbol) */}
      <g opacity={0.06} stroke="#B8863E" fill="none" strokeWidth="1">
        <path d="M 520 280 Q 640 230 760 280 Q 640 260 520 280 Z" />
      </g>

      {/* Tiny guideline arcs */}
      <g opacity={0.04} stroke="#2F5233" strokeWidth="0.5" strokeDasharray="2 6">
        <path d="M 300 600 Q 720 450 1140 600" />
        <path d="M 400 650 Q 720 500 1040 650" />
      </g>
    </svg>
  );
}

// ── Abstract pilgrim silhouette against open horizon ──

function PilgrimSilhouette() {
  return (
    <svg
      className="w-full h-full"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="horizon-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(184, 134, 62, 0)" />
          <stop offset="70%" stopColor="rgba(184, 134, 62, 0.04)" />
          <stop offset="100%" stopColor="rgba(184, 134, 62, 0.08)" />
        </linearGradient>
      </defs>

      {/* Horizon line */}
      <line
        x1="0"
        y1="620"
        x2="1440"
        y2="620"
        stroke="#B8863E"
        strokeWidth="0.5"
        opacity={0.15}
      />

      {/* Distant land mass (abstract) */}
      <path
        d="M 0 620 Q 180 600 360 615 Q 540 625 720 610 Q 900 600 1080 618 Q 1260 625 1440 612 L 1440 900 L 0 900 Z"
        fill="url(#horizon-grad)"
        opacity={0.3}
      />

      {/* Stylized pilgrim figure (abstract silhouette) */}
      <g opacity={0.12} fill="#2F5233">
        {/* Body */}
        <path d="M 700 450 Q 720 430 740 450 L 745 560 Q 720 565 695 560 Z" />
        {/* Head */}
        <circle cx="720" cy="420" r="22" />
        {/* Ihram garment drapes */}
        <path d="M 695 480 Q 680 500 675 530 Q 690 535 695 510 Z" />
        <path d="M 745 480 Q 760 500 765 530 Q 750 535 745 510 Z" />
        {/* Walking staff */}
        <line x1="755" y1="440" x2="770" y2="570" strokeWidth="2" stroke="#2F5233" />
      </g>

      {/* Compass direction indicator (small, near bottom-right) */}
      <g
        opacity={0.08}
        stroke="#B8863E"
        fill="none"
        strokeWidth="0.8"
        transform="translate(1200, 700)"
      >
        <circle cx="0" cy="0" r="20" />
        <polygon points="0,-28 5,-8 -5,-8" fill="#B8863E" />
        <line x1="0" y1="20" x2="0" y2="8" />
        <line x1="20" y1="0" x2="8" y2="0" />
        <line x1="-20" y1="0" x2="-8" y2="0" />
      </g>
    </svg>
  );
}
