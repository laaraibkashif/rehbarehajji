"use client";

import { useState, useEffect } from "react";

/**
 * useReducedMotion — returns `true` when the user prefers reduced motion.
 *
 * Uses `window.matchMedia` under the hood and listens for changes.
 * Falls back to `false` during SSR / non-browser environments.
 */
export default function useReducedMotion() {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(mq.matches);

    const handler = (e) => setPrefersReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return prefersReduced;
}
