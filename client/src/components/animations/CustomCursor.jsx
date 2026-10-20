"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import useIsTouchDevice from "../../hooks/useIsTouchDevice";

/**
 * CustomCursor — a global custom cursor composed of a small dot and a
 * larger trailing ring, driven by GSAP's quickTo for low-lag following.
 *
 * Changes state on hover over interactive elements (links, buttons,
 * inputs) by reading CSS-driven custom properties.
 *
 * Disabled entirely on touch devices.
 *
 * Usage: Render once at the root of your app, typically inside
 *        SmoothScrollProvider.
 *   <CustomCursor />
 */
export default function CustomCursor() {
  const isTouch = useIsTouchDevice();
  const cursorRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    if (isTouch) return;

    const cursor = cursorRef.current;
    const ring = ringRef.current;
    if (!cursor || !ring) return;

    // Hide the default cursor on the body
    document.body.style.cursor = "none";

    // Create quickTo functions for dot and ring
    const dotX = gsap.quickTo(cursor, "x", {
      duration: 0.12,
      ease: "power3.out",
    });
    const dotY = gsap.quickTo(cursor, "y", {
      duration: 0.12,
      ease: "power3.out",
    });

    const ringX = gsap.quickTo(ring, "x", {
      duration: 0.4,
      ease: "power3.out",
    });
    const ringY = gsap.quickTo(ring, "y", {
      duration: 0.4,
      ease: "power3.out",
    });

    const handleMouseMove = (e) => {
      dotX(e.clientX);
      dotY(e.clientY);
      ringX(e.clientX);
      ringY(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);

    // ── Hover state management ──
    // Use a mouseover delegation on the document
    const handleMouseOver = (e) => {
      const target = e.target;

      // Determine if the element (or its ancestor) is interactive
      const isInteractive =
        target.closest("a") ||
        target.closest("button") ||
        target.closest("input") ||
        target.closest("select") ||
        target.closest("textarea") ||
        target.closest("[data-cursor-interactive]");

      if (isInteractive) {
        gsap.to(cursor, {
          scale: 0,
          duration: 0.25,
          ease: "power3.out",
        });
        gsap.to(ring, {
          scale: 1.8,
          borderColor: "var(--gold, #B8863E)",
          duration: 0.35,
          ease: "power3.out",
        });
      }
    };

    const handleMouseOut = (e) => {
      const target = e.target;
      const isInteractive =
        target.closest("a") ||
        target.closest("button") ||
        target.closest("input") ||
        target.closest("select") ||
        target.closest("textarea") ||
        target.closest("[data-cursor-interactive]");

      if (isInteractive) {
        gsap.to(cursor, {
          scale: 1,
          duration: 0.25,
          ease: "power3.out",
        });
        gsap.to(ring, {
          scale: 1,
          borderColor: "var(--emerald, #2F5233)",
          duration: 0.35,
          ease: "power3.out",
        });
      }
    };

    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseout", handleMouseOut);

    // ── Cleanup ──
    return () => {
      document.body.style.cursor = "";
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseout", handleMouseOut);
    };
  }, [isTouch]);

  if (isTouch) return null;

  return (
    <>
      {/* Dot */}
      <div
        ref={cursorRef}
        className="custom-cursor"
        style={{
          position: "fixed",
          top: -4,
          left: -4,
          width: 8,
          height: 8,
          borderRadius: "50%",
          backgroundColor: "var(--ink, #16241C)",
          pointerEvents: "none",
          zIndex: 99999,
          transform: "translate(0, 0)",
          willChange: "transform",
        }}
      />
      {/* Ring */}
      <div
        ref={ringRef}
        className="custom-cursor"
        style={{
          position: "fixed",
          top: -16,
          left: -16,
          width: 32,
          height: 32,
          borderRadius: "50%",
          border: "1.5px solid var(--emerald, #2F5233)",
          pointerEvents: "none",
          zIndex: 99998,
          transform: "translate(0, 0)",
          willChange: "transform",
          transition: "border-color 0.35s ease",
        }}
      />
    </>
  );
}
