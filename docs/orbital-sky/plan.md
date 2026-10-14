# Orbital sky background — phased plan (2026-10-10)

Authority: `CLAUDE_CODE_PROMPT.md` from the owner's `files (1).zip`. A local copy is at `.superpowers/sdd/2026-10-10-orbital-sky/src/`.
Branch: `feat/orbital-sky-bg`, created from `main` (a3e6c1e, the live site). This was the owner's choice on 2026-10-10: "Live site + my additions".
Push and PR only after the owner gives a go-ahead.

## Codebase facts (prompt §0 pre-edit plan)
- **Framework:** React 18 + Vite 5, react-router-dom 7 (BrowserRouter, client routes `/` and `/projects/:id`), framer-motion 12. The window is the scroll container: there is no Lenis or Locomotive, and `body` only sets overflow-x hidden.
- **Current background:**
  - `src/components/HeroScene.jsx`: r3f constellation, distorted core, postprocessing. It is the tan blob, the wireframe mesh and the square particles.
  - `src/components/HeroHUD.jsx`: the four corner labels.
  - Both are mounted in `src/components/Hero.jsx`.
  - Their CSS is in `src/styles.css`, in the "EDITORIAL-FUTURISM: 3D hero substrate" block, the "HUD telemetry overlay" block, and `.hero-poster` / `.hero-scene canvas.hero-canvas`.
- **Packages used only by the old scene:** `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`. `three` stays, because react-globe.gl in the Globe section needs it.
- **Section ids, in order:** hero, (trust strip, no id), about, experience, journey*, projects, highlights*, globe*, research, skills, leadership*, contact. Ids marked * exist in Explorer mode only. They match `SKY_PHASES` exactly, so no selector edits are needed.
- **Canvas mount:** a `<SkyBackground/>` client component is rendered first in `App.jsx`, outside a new `<div className="sky-page">` that wraps the masthead, nav, routes, footer and scroll-top. `#root` has no transform, filter or overflow, so `position: fixed` holds.
- **Page and section backgrounds made transparent:**
  - `body` (sky.css now owns it), `.hero-editorial`, `.section-alt`, `.ecg-section`, `.footer`, `.project-detail`.
  - Cards, chips, buttons, the masthead bar and the nav keep their own backgrounds.

## Phases
1. **P1 Owner content carry-over.** This is outside the sky scope and is kept in separate, labelled commits.
   - (a) About "By the numbers": add `3 US hackathons on the judging panel` after "1 hackathon award".
   - (b) MSIG Experience bullet: "Worked on downstream mapping, reducing mapping time from 24 hours to under 30 minutes".
   - (c) The "Ask AP AI" Ghibli launcher replaces the Chatbase bubble. It is restyled with the live site's own tokens, with no new palette.
   - Selected impact does not exist on main, so it is NOT carried over (adding it would be a new section). Reported to the owner.
2. **P2 Remove the old scene.**
   - Delete HeroScene.jsx and HeroHUD.jsx.
   - Delete their CSS, including the hero scrim, the schematic grid `::before`, `.hero-poster` and the portrait "oat rim" that existed only for the 3D space.
   - Remove the three @react-three packages from package.json and the lockfile.
   - Grep for leftovers.
3. **P3 Add the sky.**
   - `src/lib/sky.js`: byte-for-byte copy.
   - `src/sky.css`: verbatim, with only the url changed to `/sky-poster.jpg`. Imported after styles.css.
   - `public/sky-poster.jpg`.
   - `src/components/SkyBackground.jsx`.
   - The `sky-page` wrapper.
   - `sky-scrim` on about…contact. Not on the hero or the trust strip.
   - The transparent backgrounds listed above.
4. **P4 Wire controls.**
   - `EFFECTS` maps to `sky.setEnabled()`. The initial state is read from localStorage, and the toggle event is listened to.
   - The mode toggle and route change call `sky.relayout()` after the AnimatePresence swap.
   - There is no separate motion control. The OS reduced-motion setting is already handled inside sky.js.
5. **P5 Acceptance checks 1–13.** Run with Playwright at 1440×900 and 390×844, with screenshots in `.lh/sky/`. Check 9 measures contrast; raise the scrim factor 0.55→≤0.7 only if it fails. Also: no console errors, the hidden-tab frame counter (temporary), WebGL disabled, reduced motion, Effects off, a single canvas after remounts, and `git diff --stat` hygiene.
6. **P6 Review.**
   - One batched Codex read-only review over main..HEAD, plus one fresh whole-branch code review (most capable model).
   - Fix every Critical and Important finding, re-verify, and run a scoped Codex re-check of the fixes if needed.
7. **P7 Handoff.** Screenshots and a report to the owner. Ask before pushing or opening the PR, and never merge.
