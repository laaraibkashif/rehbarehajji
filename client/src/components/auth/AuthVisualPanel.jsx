"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { AUTH_IMAGES } from "../../utils/ritualImages";

const COMPOSITIONS = {
  login: {
    glowColor: "rgba(47, 82, 51, 0.06)",
    accentColor: "#2F5233",
    ringCount: 4,
    label: "Welcome back",
  },
  register: {
    glowColor: "rgba(184, 134, 62, 0.06)",
    accentColor: "#B8863E",
    ringCount: 5,
    label: "Begin your journey",
  },
  verify: {
    glowColor: "rgba(47, 82, 51, 0.08)",
    accentColor: "#2F5233",
    ringCount: 3,
    label: "Confirm your identity",
  },
};

/**
 * AuthVisualPanel — the left 55 % full-height visual panel for the auth
 * split-screen layout. Displays an abstract wayfinding motif that varies
 * subtly per step.
 *
 * Reacts to focus events: when a parent calls `setActiveField(fieldName)`,
 * the panel gently tweens (e.g. a subtle pan or glow shift).
 *
 * Props:
 *  - step      — "login" | "register" | "verify"
 *  - activeField — string representing the currently focused field
 */
export default function AuthVisualPanel({ step = "login", activeField }) {
  const svgRef = useRef(null);
  const glowRef = useRef(null);
  const comp = COMPOSITIONS[step] || COMPOSITIONS.login;

  // ── React to focus changes with subtle glow shift ──
  useEffect(() => {
    if (!activeField || !glowRef.current) return;

    const ctx = gsap.context(() => {
      // Map field name to a small pan offset
      const offsets = {
        email: { x: 10, y: -5 },
        password: { x: -8, y: 5 },
        fullName: { x: 5, y: -10 },
        phone: { x: -5, y: 8 },
        country: { x: 8, y: 5 },
        confirmPassword: { x: -10, y: -3 },
      };
      const off = offsets[activeField] || { x: 0, y: 0 };
      gsap.to(glowRef.current, {
        x: off.x,
        y: off.y,
        duration: 0.6,
        ease: "power2.out",
      });
    });

    return () => ctx.revert();
  }, [activeField]);

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      aria-hidden="true"
    >
      <svg
        ref={svgRef}
        className="w-full h-full"
        viewBox="0 0 800 900"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id="auth-glow" cx="50%" cy="40%" r="65%">
            <stop offset="0%" stopColor={comp.glowColor} />
            <stop offset="60%" stopColor={comp.glowColor.replace("0.06", "0.02")} />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <linearGradient id="auth-line-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={comp.accentColor} stopOpacity="0.08" />
            <stop offset="50%" stopColor={comp.accentColor} stopOpacity="0.15" />
            <stop offset="100%" stopColor={comp.accentColor} stopOpacity="0.04" />
          </linearGradient>
        </defs>

        {/* Background */}
        <rect width="800" height="900" fill="var(--sand, #EBE3CE)" />
        <image
          href={AUTH_IMAGES[step] || AUTH_IMAGES.login}
          width="800"
          height="900"
          preserveAspectRatio="xMidYMid slice"
          opacity="0.45"
        />

        {/* Glow */}
        <g ref={glowRef} style={{ willChange: "transform" }}>
          <circle cx="400" cy="400" r="350" fill="url(#auth-glow)" />
        </g>

        {/* Concentric rings */}
        <g stroke={comp.accentColor} fill="none" opacity={0.08}>
          {Array.from({ length: comp.ringCount }, (_, i) => (
            <circle
              key={i}
              cx="400"
              cy="420"
              r={80 + i * 60}
              strokeWidth={0.5 + i * 0.2}
              strokeDasharray={i % 2 === 0 ? "none" : "4 8"}
            />
          ))}
        </g>

        {/* Angular lines */}
        <g stroke={comp.accentColor} strokeWidth="0.4" opacity={0.06}>
          {Array.from({ length: 8 }, (_, i) => (
            <line
              key={i}
              x1="400"
              y1="420"
              x2={400 + 350 * Math.cos((i * 45 * Math.PI) / 180)}
              y2={420 + 350 * Math.sin((i * 45 * Math.PI) / 180)}
            />
          ))}
        </g>

        {/* Subtle decorative arc (step-specific) */}
        <g opacity={0.1} stroke={comp.accentColor} fill="none" strokeWidth="1.5">
          {step === "login" && (
            <path d="M 250 550 Q 400 480 550 550" strokeLinecap="round" />
          )}
          {step === "register" && (
            <>
              <path d="M 250 550 Q 400 480 550 550" strokeLinecap="round" />
              <path
                d="M 300 580 Q 400 520 500 580"
                strokeWidth="1"
                opacity="0.6"
                strokeLinecap="round"
              />
            </>
          )}
          {step === "verify" && (
            <path d="M 200 560 Q 400 460 600 560" strokeLinecap="round" />
          )}
        </g>

        {/* Scattered dots */}
        <g fill={comp.accentColor} opacity={0.08}>
          {Array.from({ length: 40 }, (_, i) => (
            <circle
              key={i}
              cx={100 + Math.random() * 600}
              cy={100 + Math.random() * 650}
              r={1 + Math.random() * 2}
            />
          ))}
        </g>

        {/* Step label (small, bottom) */}
        <text
          x="400"
          y="800"
          textAnchor="middle"
          fill={comp.accentColor}
          opacity="0.2"
          fontFamily="IBM Plex Mono, monospace"
          fontSize="11"
          letterSpacing="4"
        >
          {comp.label.toUpperCase()}
        </text>
      </svg>
    </div>
  );
}
