"use client";

import { createContext, useContext } from "react";

/**
 * LenisContext — provides the Lenis smooth-scroll instance to descendant
 * components so they can pause / resume scrolling programmatically.
 *
 * The value is `null` before Lenis has been initialised (during SSR or the
 * brief moment before the provider effect runs).
 */

export const LenisContext = createContext(null);

/**
 * useLenis — convenience hook for consuming LenisContext.
 * Returns the Lenis instance or `null`.
 */
export function useLenis() {
  return useContext(LenisContext);
}
