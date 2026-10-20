"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import useReducedMotion from "../../hooks/useReducedMotion";

/**
 * Marquee — infinite horizontal scrolling text/logo band.
 *
 * Props:
 *  - children    — content to duplicate and scroll
 *  - speed       {number} pixels-per-second (default 40)
 *  - direction   {"left" | "right"} (default "left")
 *  - pauseOnHover {boolean} (default true)
 *  - className   {string}
 *  - ariaLabel   {string}
 *
 * Reduced-motion: freezes at current position instead of stopping abruptly.
 */
export default function Marquee({
  children,
  speed = 40,
  direction = "left",
  pauseOnHover = true,
  className = "",
  ariaLabel = "Scrolling content",
}) {
  const trackRef = useRef(null);
  const animRef = useRef(null);
  const [isHovering, setIsHovering] = useState(false);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    // Duplicate children so the loop has seamless wrapping
    const children = Array.from(track.children);
    if (children.length === 0) return;

    // We assume children is a single row — clone each child once
    const clones = children.map((child) => child.cloneNode(true));
    clones.forEach((clone) => track.appendChild(clone));

    // Calculate total width of one set
    const totalWidth = Array.from(track.children).reduce(
      (sum, el) => sum + el.offsetWidth,
      0
    );
    const singleSetWidth = totalWidth / 2;

    // Start offset: if direction is right, start from negative half
    const startX = direction === "right" ? -singleSetWidth : 0;

    gsap.set(track, { x: startX });

    const duration = singleSetWidth / speed;

    // If reduced motion, just set initial position and stop
    if (prefersReduced) {
      gsap.set(track, { x: 0 });
      return;
    }

    const createAnimation = (paused = false) => {
      const xEnd = direction === "left" ? -singleSetWidth : 0;

      return gsap.to(track, {
        x: xEnd,
        duration,
        ease: "none",
        paused,
        onRepeat: () => {
          // Instantly reset to start position without visual jump
          gsap.set(track, {
            x: direction === "left" ? 0 : -singleSetWidth,
          });
        },
        repeat: -1,
      });
    };

    animRef.current = createAnimation(false);

    return () => {
      if (animRef.current) {
        animRef.current.kill();
        animRef.current = null;
      }
      // Remove clones we added
      clones.forEach((clone) => clone.remove());
    };
  }, [speed, direction, prefersReduced]);

  // Pause / resume on hover
  useEffect(() => {
    if (!animRef.current || prefersReduced) return;
    if (pauseOnHover) {
      if (isHovering) {
        animRef.current.pause();
      } else {
        animRef.current.play();
      }
    }
  }, [isHovering, pauseOnHover, prefersReduced]);

  return (
    <div
      className={`overflow-hidden ${className}`}
      aria-label={ariaLabel}
      role="marquee"
      onMouseEnter={() => pauseOnHover && setIsHovering(true)}
      onMouseLeave={() => pauseOnHover && setIsHovering(false)}
      onFocus={() => pauseOnHover && setIsHovering(true)}
      onBlur={() => pauseOnHover && setIsHovering(false)}
    >
      <div
        ref={trackRef}
        className="inline-flex gap-8 will-change-transform"
        style={{ whiteSpace: "nowrap" }}
      >
        {children}
      </div>
    </div>
  );
}
