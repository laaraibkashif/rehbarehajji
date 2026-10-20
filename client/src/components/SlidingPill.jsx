"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import useReducedMotion from "../hooks/useReducedMotion";

/**
 * SlidingPill — a segmented control with a GSAP-animated sliding pill.
 *
 * Props:
 *  - options   {Array<{key:string, label:string}>}  — pill options
 *  - value     {string}                              — currently selected key
 *  - onChange  {(key:string) => void}                — called on selection
 *  - className {string}                              — wrapper classes
 *  - size      {"sm" | "md"}                         — control size
 */
export default function SlidingPill({
  options,
  value,
  onChange,
  className = "",
  size = "md",
}) {
  const sliderRef = useRef(null);
  const trackRef = useRef(null);
  const prefersReduced = useReducedMotion();

  const sizeClasses = size === "sm" ? "p-0.5" : "p-1";

  useEffect(() => {
    if (!sliderRef.current || !trackRef.current) return;
    const track = trackRef.current;
    const buttons = track.querySelectorAll("[data-pill-btn]");
    const activeIndex = options.findIndex((o) => o.key === value);

    if (buttons[activeIndex]) {
      const btn = buttons[activeIndex];
      const trackRect = track.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();

      if (prefersReduced) {
        gsap.set(sliderRef.current, {
          x: btnRect.left - trackRect.left,
          width: btnRect.width,
        });
        return;
      }

      gsap.to(sliderRef.current, {
        x: btnRect.left - trackRect.left,
        width: btnRect.width,
        duration: 0.35,
        ease: "power3.out",
      });
    }
  }, [value, options, prefersReduced]);

  return (
    <div
      ref={trackRef}
      className={`relative flex rounded-xl bg-sand/60 border border-ink/8 ${sizeClasses} ${className}`}
    >
      {/* Animated slider pill */}
      <div
        ref={sliderRef}
        className="absolute top-0.5 bottom-0.5 rounded-lg bg-paper shadow-sm border border-ink/5"
        style={{ willChange: "transform, width" }}
        aria-hidden="true"
      />

      {/* Option buttons */}
      {options.map((opt) => {
        const isActive = value === opt.key;
        return (
          <button
            key={opt.key}
            data-pill-btn
            onClick={() => onChange(opt.key)}
            className={`relative z-10 flex-1 py-2 text-sm font-semibold rounded-lg transition-colors duration-200 ${
              isActive
                ? "text-emerald"
                : "text-ink/40 hover:text-ink/60"
            }`}
            aria-pressed={isActive}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
