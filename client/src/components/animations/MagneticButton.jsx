"use client";

import { useRef, useCallback, useEffect } from "react";
import gsap from "gsap";
import useIsTouchDevice from "../../hooks/useIsTouchDevice";

/**
 * MagneticButton — a button that subtly follows the cursor within a
 * defined radius using GSAP's quickTo, snapping back on mouse leave.
 *
 * Disabled on touch devices via feature detection (useIsTouchDevice).
 *
 * Props:
 *  - children    — button content
 *  - radius      {number}  magnetic radius in px (default 200)
 *  - strength    {number}  follow strength 0-1 (default 0.4)
 *  - as          {string}  HTML tag (default "button")
 *  - className   {string}
 *  - onClick     {function}
 *  - disabled    {boolean}
 *  - ...rest     — spread onto the element
 */
export default function MagneticButton({
  children,
  radius = 200,
  strength = 0.4,
  as: Tag = "button",
  className = "",
  onClick,
  disabled = false,
  ...rest
}) {
  const elRef = useRef(null);
  const ctxRef = useRef(null);
  const isTouch = useIsTouchDevice();

  // Memoised quickTo functions
  const xTo = useRef(null);
  const yTo = useRef(null);

  const handleMouseMove = useCallback(
    (e) => {
      if (isTouch || !elRef.current || disabled) return;

      const rect = elRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;
      const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (dist > radius) {
        // Outside radius — snap back
        if (xTo.current) {
          xTo.current(0);
          yTo.current(0);
        }
        return;
      }

      // Normalise distance and apply strength
      const norm = 1 - dist / radius;
      const moveX = deltaX * strength * norm;
      const moveY = deltaY * strength * norm;

      // Initialise quickTo on first move
      if (!xTo.current) {
        xTo.current = gsap.quickTo(elRef.current, "x", {
          duration: 0.4,
          ease: "power3.out",
        });
        yTo.current = gsap.quickTo(elRef.current, "y", {
          duration: 0.4,
          ease: "power3.out",
        });
      }

      xTo.current(moveX);
      yTo.current(moveY);
    },
    [isTouch, radius, strength, disabled]
  );

  const handleMouseLeave = useCallback(() => {
    if (isTouch || !elRef.current) return;
    // Revert any previous snap-back context before creating new one
    if (ctxRef.current) {
      ctxRef.current.revert();
    }
    // Snap back — wrap in context for safe cleanup
    ctxRef.current = gsap.context(() => {
      gsap.to(elRef.current, {
        x: 0,
        y: 0,
        duration: 0.5,
        ease: "elastic.out(1, 0.4)",
      });
    }, elRef);
    xTo.current = null;
    yTo.current = null;
  }, [isTouch]);

  // Cleanup any running GSAP context on unmount
  useEffect(() => {
    return () => {
      if (ctxRef.current) {
        ctxRef.current.revert();
        ctxRef.current = null;
      }
    };
  }, []);

  return (
    <Tag
      ref={elRef}
      className={className}
      onClick={onClick}
      disabled={disabled}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ willChange: "transform", position: "relative", zIndex: 1 }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
