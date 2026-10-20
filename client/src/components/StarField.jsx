/**
 * StarField — a slow-drifting, twinkling star field used as the hero
 * background motif on the landing page. Replaces stock hero imagery.
 *
 * Respects prefers-reduced-motion (hidden entirely).
 */

import { useMemo } from "react";

const STAR_COUNT = 60;

function generateStars(count) {
  const stars = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      id: i,
      cx: Math.random() * 100,
      cy: Math.random() * 100,
      r: 0.5 + Math.random() * 1.5,
      delay: Math.random() * 5,
      duration: 3 + Math.random() * 3,
      driftX: (Math.random() - 0.5) * 20,
      driftY: (Math.random() - 0.5) * 20,
      driftDuration: 15 + Math.random() * 15,
    });
  }
  return stars;
}

export default function StarField({ className = "" }) {
  const stars = useMemo(() => generateStars(STAR_COUNT), []);

  return (
    <div
      className={`star-field absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      aria-hidden="true"
    >
      <svg
        className="w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Compass-rose subtle ring */}
          <radialGradient id="compass-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(184, 134, 62, 0.06)" />
            <stop offset="60%" stopColor="rgba(184, 134, 62, 0.03)" />
            <stop offset="100%" stopColor="rgba(184, 134, 62, 0)" />
          </radialGradient>
        </defs>

        {/* Subtle compass-rose glow */}
        <circle cx="50" cy="50" r="40" fill="url(#compass-glow)" />

        {/* Compass-rose lines */}
        <g className="animate-drift" opacity={0.15}>
          <line x1="50" y1="10" x2="50" y2="90" stroke="#B8863E" strokeWidth="0.3" />
          <line x1="10" y1="50" x2="90" y2="50" stroke="#B8863E" strokeWidth="0.3" />
          <line x1="22" y1="22" x2="78" y2="78" stroke="#B8863E" strokeWidth="0.2" />
          <line x1="78" y1="22" x2="22" y2="78" stroke="#B8863E" strokeWidth="0.2" />
          {/* Outer ring */}
          <circle cx="50" cy="50" r="35" fill="none" stroke="#B8863E" strokeWidth="0.2" />
          <circle cx="50" cy="50" r="38" fill="none" stroke="#B8863E" strokeWidth="0.1" />
        </g>

        {/* Stars */}
        {stars.map((star) => (
          <circle
            key={star.id}
            cx={star.cx}
            cy={star.cy}
            r={star.r}
            fill="#B8863E"
            className="animate-twinkle"
            style={{
              animationDelay: `${star.delay}s`,
              animationDuration: `${star.duration}s`,
              transformOrigin: `${star.cx}% ${star.cy}%`,
            }}
          />
        ))}
      </svg>
    </div>
  );
}
