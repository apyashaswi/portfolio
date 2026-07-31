# Animation Timing Rework — Design

## Problem

The site's motion reads as "mechanical and slow" even in a production build (ruled out dev-mode overhead by comparing `npm run dev` against `npm run build && npm run preview` — both felt the same). Root cause, by survey of every `transition:`/`duration:`/`ease:` in `src/`:

- **One identical fixed-duration tween everywhere.** `fadeUp()` (`src/utils.js`) is used by 11 components and 40+ call sites, all sharing the exact same `duration: 0.65, ease: [0.22, 1, 0.36, 1]`. Every scroll-reveal on the site plays the same precomputed curve — the uniformity itself is what reads as templated/robotic rather than alive.
- **Unbounded, compounding stagger.** Several call sites multiply delay by list index with no ceiling (`i * 0.08` in Highlights/Projects/Skills, `i * 0.1` in Experience, `0.04 * j` for Skills' inner tag lists). A section with 8-10 items can take over a second to finish settling. `ProjectDetail.jsx` chains nine static delays up to `0.45`, so its last section doesn't finish animating until ~1.1s after the page is visible.
- **Hero's own reveal** (`Hero.jsx`'s `makeReveal`) staggers 5 elements at `i * 0.12` over a 0.85s duration — the CTAs (last element) don't finish settling until ~1.33s after load. This is the first thing every visitor sees.
- **A fixed 2000ms forced wait** in the intro cold-open (`IntroOverlay.jsx`) before the hero is even reachable, on every fresh session.

Out of scope for this pass: a GPU-stall console warning noticed in the WebGL hero's post-processing pipeline. That's a raw performance issue, not a timing/easing one — worth a follow-up if tightening timing doesn't fully resolve "slow."

## Approach

Replace fixed-duration cubic-bezier tweens with **split spring/ease transitions**, and cap every stagger so more content never means a slower reveal.

### 1. `fadeUp()` (`src/utils.js`) — the shared primitive

```js
export const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: {
    y: { type: 'spring', duration: 0.45, bounce: 0.16, delay: Math.min(delay, 0.3) },
    opacity: { duration: 0.28, ease: 'easeOut', delay: Math.min(delay, 0.3) },
  },
})
```

- `y` (the transform) gets a spring — physics-based settle instead of a precomputed curve, with a small `bounce` for natural give.
- `opacity` gets its own quick, simple ease — springs on opacity look wrong (can overshoot past 1, causing a visible flash), and content should become *legible* faster than its motion finishes settling.
- The `Math.min(delay, 0.3)` clamp is the stagger cap. It lives in one place, so every one of the 40+ call sites is protected without touching their individual delay expressions — a list section can grow to any number of items and the reveal still finishes within ~0.3s (delay) + ~0.45s (settle) ≈ 0.75s worst case, instead of scaling unboundedly with content.

### 2. Components with their own one-off transitions

Same split-spring philosophy, tightened individually since each has a different shape:

- **`Hero.jsx`** (`makeReveal`): stagger multiplier `i * 0.12` → `i * 0.06` (capped implicitly — only 5 elements, max index 4, so max delay 0.24s instead of 0.48s). Split `y`+`filter(blur)` onto a spring (`duration: 0.45, bounce: 0.14`) and `opacity` onto `{ duration: 0.28, ease: 'easeOut' }`, matching `fadeUp`. Reduced-motion path (duration 0.4, delay 0) is untouched.
- **`Nav.jsx`**: mount reveal (`y: -80→0`, `opacity`) — same split, spring duration 0.4 (down from a flat 0.7s tween).
- **`ScrollTop.jsx`**: appear/disappear on scroll threshold — same split, spring duration 0.3 (was 0.25s flat tween; close enough already, mainly bringing it in line for consistency rather than fixing a real problem here).
- **`Skills.jsx`**: the inner per-tag list (`transition={{ duration: 0.35, delay: 0.04 * j }}`) gets the same `Math.min(0.04 * j, 0.25)` cap, since a skill category can have many tags.
- **`JourneyECG.jsx`**: the section-header block (currently `duration: 0.65`, matching the old `fadeUp` shape) converts the same way. The milestone-card `AnimatePresence` transition (`duration: 0.22, ease: 'easeOut'`) is already quick and simple — left as-is.

### 3. `IntroOverlay.jsx` — trim the forced wait

- Auto-dismiss timer: `2000ms` → `1200ms`.
- Internal sequence re-timed to fit inside that window with the full state briefly visible before dismissal, rather than getting cut off mid-animation:
  - Monogram enter: `duration: 1.0` → `0.6`
  - Rule draw: `delay: 0.4, duration: 1.1` → `delay: 0.25, duration: 0.65` (finishes at 0.9s)
  - Tagline: `delay: 0.6, duration: 0.6` → `delay: 0.4, duration: 0.4` (finishes at 0.8s)
  - Exit (flash/scale/blur): `duration: 0.85` → `0.5`
- Skip button, Escape-to-dismiss, and the reduced-motion/Effects-off bypass (`introWillShow`) are untouched — this only changes the timing of the sequence that already plays today.

## Testing

Animation *feel* is judged by eye (the user will inspect the built site directly, same as this whole conversation). What's automatable and worth checking:

- `prefers-reduced-motion` still fully disables all of this — springs included. A Playwright check with `page.emulate_media(reduced_motion="reduce")` confirming no `transform`/`opacity` mid-transition state lingers unexpectedly, and that the intro overlay is skipped entirely (`introWillShow` already gates on this — just confirming the spring changes didn't leak a new dependency on the old duration values).
- `npm run build` stays clean.
- A quick visual screenshot pass (before/after) of the hero and one long list section (e.g. Skills or Projects), for the implementer's own sanity check before handing back.

No new dependencies — Framer Motion (already `^12.38.0`) has supported the `duration`+`bounce` spring shorthand and per-property transition objects for several major versions.
