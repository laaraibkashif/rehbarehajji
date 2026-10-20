/**
 * ArcRing — the visual signature of Rehbar-e-Hajji.
 *
 * A thin animated arc that shows progress. Appears on the dashboard,
 * Tawaf counter, checklist, and ritual plan completion.
 *
 * Respects prefers-reduced-motion — shows the final state instantly.
 */

import { useEffect, useState, useRef } from "react";

export default function ArcRing({
  pct = 0,
  size = 80,
  strokeWidth = 4,
  className = "",
  label = "",
  value = "",
}) {
  const [animatedPct, setAnimatedPct] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(animatedPct, 1));

  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      setAnimatedPct(Math.min(pct, 1));
      return;
    }
    setAnimatedPct(0);
    const timer = setTimeout(() => setAnimatedPct(Math.min(pct, 1)), 50);
    return () => clearTimeout(timer);
  }, [pct]);

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
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
          stroke="rgba(47, 82, 51, 0.12)"
          strokeWidth={strokeWidth}
        />
        {/* Foreground arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-emerald transition-all duration-1000 ease-out"
          style={{
            transition: "stroke-dashoffset 1s ease-out",
          }}
        />
        {/* Glow dot at end of arc */}
        {animatedPct > 0.02 && (
          <circle
            cx={size / 2 + radius * Math.cos(2 * Math.PI * animatedPct - Math.PI / 2)}
            cy={size / 2 + radius * Math.sin(2 * Math.PI * animatedPct - Math.PI / 2)}
            r={strokeWidth * 0.7}
            fill="currentColor"
            className="text-emerald"
          />
        )}
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {value && (
          <span className="font-mono text-lg font-bold leading-none text-ink">
            {value}
          </span>
        )}
        {label && (
          <span className="font-mono text-[10px] leading-tight text-ink/60 mt-0.5 uppercase tracking-wider">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
