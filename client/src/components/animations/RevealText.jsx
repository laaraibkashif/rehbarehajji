"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import useReducedMotion from "../../hooks/useReducedMotion";
import { splitWords, detectLines } from "../../utils/textSplitter";

gsap.registerPlugin(ScrollTrigger);

/**
 * RevealText — splits children text into words or lines and reveals them
 * with a staggered ScrollTrigger animation.
 *
 * Modes:
 *  - "words"  : each word fades+slides up individually
 *  - "lines"  : words are grouped into visual lines, lines animate as blocks
 *
 * Props:
 *  - as        {string}   HTML tag (default "div")
 *  - mode      {"words" | "lines"} (default "words")
 *  - stagger   {number}   stagger delay in seconds (default 0.04)
 *  - duration  {number}   each element's animation duration (default 0.6)
 *  - distance  {number}   translateY distance in px (default 24)
 *  - threshold {number}   IntersectionObserver threshold (default 0.15)
 *  - once      {boolean}  animate only once (default true)
 *  - className {string}
 *  - children  {string | ReactNode}
 *
 * When `prefers-reduced-motion: reduce` is set, the component renders
 * the text fully visible with no animation.
 */
export default function RevealText({
  as: Tag = "div",
  mode = "words",
  stagger = 0.04,
  duration = 0.6,
  distance = 24,
  threshold = 0.15,
  once = true,
  className = "",
  children,
  ...rest
}) {
  const containerRef = useRef(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !children) return;

    // Extract plain text from children prop
    const text = typeof children === "string" ? children : "";
    if (!text) return;

    // Split text into words and create word spans
    const words = splitWords(text);
    container.innerHTML = "";

    const wordEls = [];
    words.forEach(({ word, isSpace, key }) => {
      const span = document.createElement("span");
      span.setAttribute("data-word", key);
      if (isSpace) {
        span.innerHTML = "&nbsp;";
        span.style.display = "inline";
      } else {
        span.textContent = word;
      }
      span.style.display = "inline-block";
      span.style.willChange = "transform, opacity";
      container.appendChild(span);
      wordEls.push(span);
    });

    // If reduced motion, make everything visible immediately
    if (prefersReduced) {
      gsap.set(wordEls, { opacity: 1, y: 0, filter: "blur(0px)" });
      return;
    }

    // Determine animation targets based on mode
    let targets;
    if (mode === "lines") {
      const lines = detectLines(container, "[data-word]");
      // Create line wrappers
      const lineEls = lines.map((wordsInLine) => {
        const lineSpan = document.createElement("span");
        lineSpan.className = "reveal-line";
        lineSpan.style.display = "block";
        lineSpan.style.overflow = "hidden";
        wordsInLine.forEach((w) => lineSpan.appendChild(w.cloneNode(true)));
        return lineSpan;
      });
      container.innerHTML = "";
      lineEls.forEach((el) => container.appendChild(el));
      targets = lineEls;
    } else {
      targets = wordEls;
    }

    // Set initial state
    gsap.set(targets, {
      opacity: 0,
      y: distance,
      filter: "blur(4px)",
    });

    // Create ScrollTrigger animation
    const ctx = gsap.context(() => {
      gsap.to(targets, {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration,
        stagger,
        ease: "power3.out",
        scrollTrigger: {
          trigger: container,
          start: `0% ${(1 - threshold) * 100}%`,
          toggleActions: once ? "play none none none" : "play none none reset",
        },
      });
    }, container);

    return () => {
      ctx.revert();
    };
  }, [children, mode, stagger, duration, distance, threshold, once, prefersReduced]);

  if (typeof children !== "string") {
    // Non-text children — render as-is
    return (
      <Tag ref={containerRef} className={className} {...rest}>
        {children}
      </Tag>
    );
  }

  return (
    <Tag
      ref={containerRef}
      className={className}
      {...rest}
      style={{ position: "relative" }}
    />
  );
}
