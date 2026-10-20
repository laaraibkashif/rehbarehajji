"use client";

import { useRef, useCallback, useEffect } from "react";
import gsap from "gsap";
import useReducedMotion from "../../hooks/useReducedMotion";

const DIGIT_COUNT = 6;

/**
 * CodeInput — 6 auto-advancing digit boxes for verification codes.
 *
 * Each digit animates in with a snappy scale-bounce via GSAP as the
 * user types. Supports pasting a full code and backspace navigation.
 *
 * Props:
 *  - value   — the full code string (max 6 chars)
 *  - onChange — called with the new code string
 *  - disabled — boolean
 *  - autoFocus — boolean
 */
export default function CodeInput({ value = "", onChange, disabled, autoFocus }) {
  const inputRefs = useRef([]);
  const prefersReduced = useReducedMotion();

  const focusBox = useCallback((index) => {
    if (index >= 0 && index < DIGIT_COUNT) {
      inputRefs.current[index]?.focus();
    }
  }, []);

  // ── Handle change ──
  const handleChange = useCallback(
    (e, index) => {
      const char = e.target.value.slice(-1); // only last char
      if (char && /^[0-9]$/.test(char)) {
        const newVal = (value + char).slice(0, DIGIT_COUNT);
        onChange?.(newVal);

        // Scale-bounce animation on the filled box
        if (!prefersReduced) {
          const ctx = gsap.context(() => {
            gsap.fromTo(
              inputRefs.current[index],
              { scale: 0.85 },
              { scale: 1, duration: 0.25, ease: "back.out(2)", clearProps: "scale" },
            );
          });
          // Auto-clean after animation completes
          setTimeout(() => ctx.revert(), 300);
        }

        // Auto-advance
        if (index < DIGIT_COUNT - 1) {
          focusBox(index + 1);
        }
      }
    },
    [value, onChange, prefersReduced, focusBox],
  );

  // ── Handle keydown (backspace) ──
  const handleKeyDown = useCallback(
    (e, index) => {
      if (e.key === "Backspace" && !value[index] && index > 0) {
        // Clear previous and focus it
        const newVal = value.slice(0, index - 1);
        onChange?.(newVal);
        focusBox(index - 1);
      } else if (e.key === "Backspace") {
        const newVal = value.slice(0, index);
        onChange?.(newVal);
      }
    },
    [value, onChange, focusBox],
  );

  // ── Handle paste ──
  const handlePaste = useCallback(
    (e) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, DIGIT_COUNT);
      if (pasted) {
        onChange?.(pasted);
        const nextIndex = Math.min(pasted.length, DIGIT_COUNT - 1);
        focusBox(nextIndex);
      }
    },
    [onChange, focusBox],
  );

  // ── Auto-focus first box on mount ──
  useEffect(() => {
    if (autoFocus) {
      focusBox(0);
    }
  }, [autoFocus, focusBox]);

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3" role="group" aria-label="Verification code">
      {Array.from({ length: DIGIT_COUNT }, (_, i) => {
        const digit = value[i] || "";
        return (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(e, i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            onPaste={i === 0 ? handlePaste : undefined}
            disabled={disabled}
            autoComplete="one-time-code"
            aria-label={`Digit ${i + 1}`}
            className="w-11 h-12 sm:w-12 sm:h-14 rounded-lg text-center text-xl font-mono font-bold text-ink bg-white border-2 transition-colors outline-none"
            style={{
              borderColor: digit
                ? "var(--emerald, #2F5233)"
                : "rgba(22, 36, 28, 0.12)",
              willChange: "transform",
            }}
            onFocus={(e) => {
              e.target.select();
            }}
          />
        );
      })}
    </div>
  );
}
