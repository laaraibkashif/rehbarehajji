"use client";

import { useEffect, useRef, useState } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import useReducedMotion from "../../hooks/useReducedMotion";
import { LenisContext } from "./LenisContext";

gsap.registerPlugin(ScrollTrigger);

/**
 * SmoothScrollProvider
 *
 * Initialises Lenis (smooth scroll) and wires it to GSAP's ticker so that
 * ScrollTrigger animations stay perfectly in sync.  When the user prefers
 * reduced motion Lenis is disabled entirely and native scroll takes over.
 *
 * The Lenis instance is provided to descendants via LenisContext so that
 * the SitePreloader (or any other component) can pause/resume scroll.
 *
 * Usage:
 *   <SmoothScrollProvider>
 *     <SitePreloader>
 *       <App />
 *     </SitePreloader>
 *   </SmoothScrollProvider>
 */
export default function SmoothScrollProvider({ children }) {
  const prefersReduced = useReducedMotion();
  const lenisRef = useRef(null);
  const [lenisInstance, setLenisInstance] = useState(null);

  useEffect(() => {
    if (prefersReduced) {
      setLenisInstance(null);
      return;
    }

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
      infinite: false,
    });

    lenisRef.current = lenis;
    setLenisInstance(lenis);

    // Sync ScrollTrigger with Lenis scroll events
    lenis.on("scroll", ScrollTrigger.update);

    // Drive Lenis via GSAP's ticker (shared rAF loop)
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0); // disable GSAP's own lag smoothing

    // ── Cleanup ──
    return () => {
      lenis.destroy();
      gsap.ticker.lagSmoothing(1); // restore default
      lenisRef.current = null;
      setLenisInstance(null);
    };
  }, [prefersReduced]);

  return (
    <LenisContext.Provider value={lenisInstance}>
      {children}
    </LenisContext.Provider>
  );
}
