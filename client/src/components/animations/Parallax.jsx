"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import useReducedMotion from "../../hooks/useReducedMotion";

gsap.registerPlugin(ScrollTrigger);

/**
 * Parallax — a wrapper that moves children at a configurable speed relative
 * to scroll using ScrollTrigger's `scrub`, for layered hero / section imagery.
 *
 * Props:
 *  - speed      {number}   parallax speed factor
 *                           0 = static, 0.5 = half speed, 1 = full scroll,
 *                           -0.3 = reverse direction (default 0.5)
 *  - direction  {"vertical" | "horizontal"} (default "vertical")
 *  - scrub      {boolean}  smooth scrub (default true)
 *  - as         {string}   HTML tag (default "div")
 *  - className  {string}
 *  - children   {ReactNode}
 *  - start      {string}   ScrollTrigger start (default "top bottom")
 *  - end        {string}   ScrollTrigger end (default "bottom top")
 *
 * When `prefers-reduced-motion: reduce` is set, no parallax transform
 * is applied.
 */
export default function Parallax({
  speed = 0.5,
  direction = "vertical",
  scrub = true,
  as: Tag = "div",
  className = "",
  children,
  start = "top bottom",
  end = "bottom top",
}) {
  const elRef = useRef(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    const el = elRef.current;
    if (!el || prefersReduced || speed === 0) return;

    const isHorizontal = direction === "horizontal";
    const movement = speed * 100; // e.g. 0.5 → 50px / 100vh scroll

    const prop = isHorizontal ? "x" : "y";

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { [prop]: movement },
        {
          [prop]: -movement,
          ease: "none",
          scrollTrigger: {
            trigger: el.parentElement || el,
            start,
            end,
            scrub: scrub ? 1 : false,
          },
        }
      );
    }, el);

    return () => ctx.revert();
  }, [speed, direction, scrub, start, end, prefersReduced]);

  return (
    <Tag ref={elRef} className={className} style={{ willChange: "transform" }}>
      {children}
    </Tag>
  );
}
