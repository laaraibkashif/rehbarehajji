"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import gsap from "gsap";
import useReducedMotion from "../../hooks/useReducedMotion";

/**
 * FloatingInput — a text input with a floating label that animates
 * with GSAP on focus/blur (label shrinks and moves above the field).
 *
 * On error, triggers a subtle GSAP shake tween (2–3 px, fast) +
 * inline error message fade-in.
 *
 * Props:
 *  - label       — floating label text
 *  - type        — input type (default "text")
 *  - name        — input name
 *  - value       — controlled value
 *  - onChange    — change handler
 *  - error       — error string (falsy = no error)
 *  - autoFocus   — boolean
 *  - tabIndex    — number
 *  - onFocus     — focus callback (receives SyntheticEvent)
 *  - onBlur      — blur callback
 *  - required    — boolean
 */
export default function FloatingInput({
  label,
  type = "text",
  name,
  value = "",
  onChange,
  error,
  autoFocus,
  tabIndex,
  onFocus,
  onBlur,
  required,
}) {
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const labelRef = useRef(null);
  const errorRef = useRef(null);
  const [focused, setFocused] = useState(false);
  const prefersReduced = useReducedMotion();

  const isActive = focused || value.length > 0;

  // ── Animate label on focus/blur ──
  const handleFocus = useCallback(
    (e) => {
      setFocused(true);
      onFocus?.(e);

      if (prefersReduced || !labelRef.current) return;
      const ctx = gsap.context(() => {
        gsap.to(labelRef.current, {
          y: -28,
          scale: 0.78,
          color: "var(--emerald, #2F5233)",
          duration: 0.25,
          ease: "power2.out",
        });
      });
      // Clean up the context after the animation completes
      setTimeout(() => ctx.revert(), 300);
    },
    [prefersReduced, onFocus],
  );

  const handleBlur = useCallback(
    (e) => {
      setFocused(false);
      onBlur?.(e);

      if (prefersReduced || value.length > 0) return; // stay floated if filled
      if (!labelRef.current) return;
      const ctx = gsap.context(() => {
        gsap.to(labelRef.current, {
          y: 0,
          scale: 1,
          color: "rgba(22, 36, 28, 0.5)",
          duration: 0.25,
          ease: "power2.out",
        });
      });
      setTimeout(() => ctx.revert(), 300);
    },
    [prefersReduced, value, onBlur],
  );

  // ── Animate error ──
  useEffect(() => {
    if (prefersReduced) return;
    if (!error || !wrapperRef.current) return;

    const ctx = gsap.context(() => {
      // Shake the wrapper
      gsap.fromTo(
        wrapperRef.current,
        { x: -3 },
        { x: 3, duration: 0.08, repeat: 3, yoyo: true, ease: "power1.inOut", clearProps: "x" },
      );
      // Fade in error message
      if (errorRef.current) {
        gsap.fromTo(errorRef.current, { opacity: 0, y: -4 }, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" });
      }
    });

    return () => ctx.revert();
  }, [error, prefersReduced]);

  // ── Init label position ──
  useEffect(() => {
    if (prefersReduced) return;
    if (value.length > 0 && labelRef.current) {
      gsap.set(labelRef.current, { y: -28, scale: 0.78, color: "rgba(22, 36, 28, 0.5)" });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          autoFocus={autoFocus}
          tabIndex={tabIndex}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : undefined}
          id={name}
          className="input-base"
          style={{
            paddingTop: "2rem",
            paddingBottom: "0.625rem",
            willChange: "transform",
          }}
        />
        <label
          ref={labelRef}
          htmlFor={name}
          className="absolute left-4 origin-left pointer-events-none select-none"
          style={{
            top: "1rem",
            fontSize: "0.9375rem",
            fontFamily: "var(--font-body, Inter, sans-serif)",
            willChange: "transform, color",
            lineHeight: 1.4,
          }}

        >
          {label}
          {required && (
            <span className="text-clay-alert ml-0.5" aria-hidden="true">
              *
            </span>
          )}
        </label>
      </div>

      {/* Error message */}
      <div
        ref={errorRef}
        id={`${name}-error`}
        role="alert"
        className="text-xs text-clay-alert mt-1 min-h-[1em]"
        style={{ opacity: error ? 1 : 0 }}
      >
        {error || "\u00A0"}
      </div>
    </div>
  );
}
