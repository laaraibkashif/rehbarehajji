# Rehbar-e-Hajji — "Guided Light" Design System

> A warm, editorial light-theme design system for a Hajj/Umrah pilgrim companion app.  
> Inspired by Awwwards Site-of-the-Day aesthetics: purposeful motion, typographic hierarchy, and a serene, trustworthy palette.

---

## 1. Design Philosophy

**"Guided Light"** — every visual and interaction decision exists to guide the pilgrim without distraction. The interface is:

- **Warm & welcoming** — ivory paper backgrounds replace cold white; deep charcoal-green text is soft on the eyes.
- **Typographic-first** — oversized Fraunces display type pairs with clean Inter body text for editorial rhythm.
- **Motion with purpose** — every animation serves wayfinding (scroll reveals, counters, cursor feedback). Nothing moves for decoration.
- **Accessible by default** — respects `prefers-reduced-motion`, uses WCAG AA contrast ratios, and provides generous touch targets.

---

## 2. Colour Palette

| Token              | Hex       | Usage                                                        |
|--------------------|-----------|--------------------------------------------------------------|
| `--paper`          | `#FAF8F2` | Page background, surface                                     |
| `--ink`            | `#16241C` | Primary text, icons                                          |
| `--emerald`        | `#2F5233` | Primary accent — links, key UI, navigation                   |
| `--gold`           | `#B8863E` | Secondary accent — highlights, hover states, decorative marks |
| `--sand`           | `#EBE3CE` | Card backgrounds, secondary surfaces                         |
| `--clay-alert`     | `#A64B39` | Errors and urgent indicators only (sparingly)                |

### Tailwind CSS v4 Theme

Defined in `client/src/index.css` via the `@theme` block:

```
--color-paper:      #FAF8F2;
--color-ink:        #16241C;
--color-emerald:    #2F5233;
--color-gold:       #B8863E;
--color-sand:       #EBE3CE;
--color-clay-alert: #A64B39;
```

Use in JSX: `className="bg-paper text-ink"`, `className="text-emerald"`, etc.

---

## 3. Typography

| Role        | Font              | Weight / Style               | Usage                                    |
|-------------|-------------------|------------------------------|------------------------------------------|
| **Display** | Fraunces          | 600, italic axis available   | Hero lines, section headers (oversized)  |
| **Body**    | Inter             | 400 / 500 / 600 / 700        | UI text, paragraphs, labels              |
| **Mono**    | IBM Plex Mono     | 400 / 500 / 600              | Counters, timestamps, eyebrows, metadata |

### Utility classes

- `.typo-hero` — `clamp(3rem, 8vw, 7rem)`, Fraunces, tight leading
- `.typo-heading` — `clamp(2rem, 4vw, 3.5rem)`, Fraunces
- `.typo-eyebrow` — IBM Plex Mono, uppercase, gold
- `.typo-body` — Inter, normal weight
- `.typo-meta` — IBM Plex Mono, small

### Font loading

Fonts are preloaded from Google Fonts in `index.html`:
- Fraunces (opsz 9..144, wght 400..700, italic)
- Inter (wght 400..700)
- IBM Plex Mono (wght 400..600)

---

## 4. Animation Stack

| Library                    | Role                                  |
|----------------------------|---------------------------------------|
| **GSAP** (Tween / Timeline)| Core animation engine                 |
| **ScrollTrigger** (GSAP)   | Scroll-driven animations              |
| **Lenis**                  | Smooth scrolling (accelerated native) |

### Integration

`SmoothScrollProvider` (`client/src/components/animations/SmoothScrollProvider.jsx`) wires Lenis and GSAP together:

```js
// Sync Lenis scroll → ScrollTrigger.update()
lenis.on("scroll", ScrollTrigger.update);

// Drive Lenis from GSAP's shared rAF ticker
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
```

On route change, `AppLayout` calls `ScrollTrigger.refresh()` via a `useEffect` on `location.pathname` to avoid the standard SPA bug where ScrollTrigger doesn't know the layout changed.

---

## 5. Animation Components

All located in `client/src/components/animations/`. Export barrel: `import { SmoothScrollProvider, Marquee, RevealText, MagneticButton, Parallax, CustomCursor } from "./components/animations"`.

### 5.1 `<SmoothScrollProvider>`

Wraps the app to initialise Lenis + GSAP synchronisation.

- Respects `prefers-reduced-motion: reduce` by skipping Lenis entirely (native scroll).
- Cleans up Lenis instance and resets GSAP ticker on unmount.

**Usage:** Wrap around the app in `main.jsx`.

### 5.2 `<Marquee>`

Infinite horizontal scrolling band.

| Prop          | Type      | Default    | Description                              |
|---------------|-----------|------------|------------------------------------------|
| `speed`       | `number`  | `40`       | Pixels per second                        |
| `direction`   | `string`  | `"left"`   | `"left"` or `"right"`                    |
| `pauseOnHover`| `boolean` | `true`     | Pause animation on hover                 |
| `className`   | `string`  | `""`       | Additional CSS classes                   |

Reduced motion: freezes at current position.

### 5.3 `<RevealText>`

Splits text into words or lines and reveals them with staggered ScrollTrigger animation (translateY + opacity + blur-in).

| Prop        | Type                    | Default   | Description                          |
|-------------|-------------------------|-----------|--------------------------------------|
| `as`        | `string`                | `"div"`   | HTML tag                             |
| `mode`      | `"words"` \| `"lines"` | `"words"` | Animation granularity                |
| `stagger`   | `number`                | `0.04`    | Delay between items (seconds)        |
| `duration`  | `number`                | `0.6`     | Animation duration per item          |
| `once`      | `boolean`               | `true`    | Animate only once (no reset on re-enter) |
| `className` | `string`                | `""`      | Additional CSS classes               |

**Note:** Only works with string children. For complex children, pass as-is and use `RevealText` without splitting.

### 5.4 `<MagneticButton>`

Buttons that follow the cursor within a radius, snapping back with elastic ease on mouse leave.

| Prop        | Type      | Default | Description                          |
|-------------|-----------|---------|--------------------------------------|
| `radius`    | `number`  | `200`   | Magnetic radius in px                |
| `strength`  | `number`  | `0.4`   | Follow intensity (0–1)               |
| `as`        | `string`  | `"button"` | HTML tag                          |
| `className` | `string`  | `""`    | Additional CSS classes               |

Disabled on touch devices (feature-detected via `matchMedia("(pointer: coarse)")`).

### 5.5 `<Parallax>`

Moves children at a configurable speed relative to scroll.

| Prop        | Type      | Default         | Description                          |
|-------------|-----------|-----------------|--------------------------------------|
| `speed`     | `number`  | `0.5`           | Movement speed factor                |
| `direction` | `string`  | `"vertical"`    | `"vertical"` or `"horizontal"`       |
| `scrub`     | `boolean` | `true`          | Smooth scrubbing                     |
| `start`     | `string`  | `"top bottom"`  | ScrollTrigger start                  |
| `end`       | `string`  | `"bottom top"`  | ScrollTrigger end                    |
| `className` | `string`  | `""`            | Additional CSS classes               |

Reduced motion: no transform applied.

### 5.6 `<CustomCursor>`

Global custom cursor: a small dot (8px) + trailing ring (32px), driven by GSAP's `quickTo` for smooth lag.

- Dot follows instantly; ring follows with slight delay.
- On hover over interactive elements (a, button, input, select, textarea, `[data-cursor-interactive]`): dot disappears, ring scales up and changes to gold.
- Disabled on touch devices.

**Implementation:** Renders two fixed-position divs at `z-index: 99999`. Adds a global `mousemove` listener and delegates `mouseover`/`mouseout` for interactive detection.

---

## 6. Hooks & Utilities

### `useReducedMotion()` (`client/src/hooks/useReducedMotion.js`)

Returns `true` when `prefers-reduced-motion: reduce` is set. Listens for changes via the `change` event on the media query.

### `useIsTouchDevice()` (`client/src/hooks/useIsTouchDevice.js`)

Returns `true` when the device has a coarse pointer (touch). Uses `matchMedia("(pointer: coarse)")` with a fallback to `"ontouchstart" in window`.

### `textSplitter` (`client/src/utils/textSplitter.js`)

Manual text-splitting utilities (since GSAP's SplitText is a paid plugin):

- `splitChars(text)` — splits into character objects
- `splitWords(text)` — splits into word objects (preserving whitespace)
- `detectLines(container, wordSelector)` — post-render line detection by comparing `offsetTop`
- `wrapLines(container, wordSelector)` — wraps detected lines in `<span>` elements

---

## 7. Route Change Handling

In `App.jsx`, the `AppLayout` component calls `ScrollTrigger.refresh()` on every `location.pathname` change:

```jsx
const location = useLocation();

useEffect(() => {
  ScrollTrigger.refresh();
}, [location.pathname]);
```

This prevents the common SPA bug where ScrollTrigger instances created on the previous page continue to fire.

---

## 8. Cleanup Patterns

All animation components use `gsap.context()` for scoped cleanup:

```js
const ctx = gsap.context(() => {
  // GSAP animations here
}, containerRef);

return () => ctx.revert(); // kills all GSAP + ScrollTrigger within context
```

This ensures no orphaned listeners or tweens when components unmount.

---

## 9. Accessibility

- All animations respect `prefers-reduced-motion: reduce` — components render final state immediately or skip entirely.
- Custom cursor is hidden on touch devices.
- Focus rings use 2px solid emerald with 2px offset (WCAG AA compliant on the paper background).
- Touch targets are `min-height: 44px` per WCAG 2.2.
- Interactive elements use a delegated `mouseover`/`mouseout` pattern — no need for individual event handlers.

---

## 10. Quick Reference

| File | Purpose |
|------|---------|
| `client/src/index.css` | Tailwind theme, CSS variables, utility classes, base styles |
| `client/src/components/animations/SmoothScrollProvider.jsx` | Lenis + GSAP sync |
| `client/src/components/animations/Marquee.jsx` | Infinite scroll band |
| `client/src/components/animations/RevealText.jsx` | Staggered text reveals |
| `client/src/components/animations/MagneticButton.jsx` | Cursor-following buttons |
| `client/src/components/animations/Parallax.jsx` | Scroll parallax |
| `client/src/components/animations/CustomCursor.jsx` | Global custom cursor |
| `client/src/components/animations/index.js` | Barrel export |
| `client/src/hooks/useReducedMotion.js` | Motion preference hook |
| `client/src/hooks/useIsTouchDevice.js` | Touch detection hook |
| `client/src/utils/textSplitter.js` | Text splitting utilities |
