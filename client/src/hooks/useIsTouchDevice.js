"use client";

import { useState, useEffect } from "react";

/**
 * useIsTouchDevice — returns `true` when the device has a coarse pointer
 * (touch). Uses the `matchMedia` pointer query for accurate detection,
 * not a simple viewport check.
 *
 * Falls back to checking `'ontouchstart' in window` as a secondary signal.
 */
export default function useIsTouchDevice() {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const hasCoarse = window.matchMedia("(pointer: coarse)").matches;
    const hasTouchEvent = "ontouchstart" in window;
    setIsTouch(hasCoarse || hasTouchEvent);
  }, []);

  return isTouch;
}
