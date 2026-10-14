Replaces the old WebGL hero scene with the orbital sky background from the supplied brief (`sky.js`, `sky.css`, `sky-poster.jpg`). Do not merge until the owner signs off.

## What changed
- **Removed the old scene:**
  - Deleted `HeroScene.jsx` (r3f constellation, core and post-processing) and `HeroHUD.jsx` (the four corner labels).
  - Removed their CSS and the `@react-three/*` packages. `three` stays because react-globe.gl needs it.
- **Added the sky:**
  - `src/lib/sky.js` is a byte-for-byte copy of the supplied file, shader untouched. `.gitattributes` pins its bytes.
  - `src/sky.css` is the supplied file, with only the poster url changed.
  - Added `public/sky-poster.jpg`.
- **Integration (`SkyBackground.jsx`):**
  - The canvas is created as the first child of `<body>`, a fresh one per mount, so it survives a Strict Mode remount.
  - A shader that fails to link falls back to the poster.
  - The sky rebuilds if the WebGL context is lost.
  - The EFFECTS switch maps to `setEnabled`, and the canvas never appears before its first frame.
  - Mode toggles, route changes and viewport resizes call `relayout()`.
- **Sky shows through:**
  - Page and section backgrounds are now transparent, and content is wrapped in `.sky-page`.
  - Every section from About to Contact gets `.sky-scrim`.
- **Owner-approved deviations:**
  - Frosted reading panes (`src/sky-panels.css`) whose tint follows `--sky-scrim`. With the brief's helpers alone, 210 text runs measured below AA.
  - The section asterism moved to `::after`, so it no longer suppresses the scrim.
  - Readability tokens are written in 0.01 steps through the `root` option, so the whole document isn't restyled on every frame.
  - The globe has a transparent ground, and its tooltip is portalled to `<body>`.
  - Print styles were added.
- **Owner content (separate commits):** the "3 US hackathons on the judging panel" stat, the MSIG downstream-mapping bullet, and the "Ask AP AI" launcher.

## Verification
All runs were headless Chromium on the real GPU (Iris Xe, D3D11).
- **Brief §6 checks:**
  - Limb crest is at 9% on the hero (hero text clears it) and 30% from About onward.
  - The day timeline matches every keyframe.
  - The sun path is smooth: largest step per frame is 0.17°.
  - No (255,255,255) pixels.
  - Idle draw rate is 19/s, and a hidden tab draws nothing.
  - Phone sun is on screen with no sideways scroll.
  - Fallbacks work: no WebGL, reduced motion, EFFECTS off.
  - There is exactly one canvas, one context and the same set of listeners after a route round-trip.
  - The console is clean.
- **Readability sweep:** every visible text run was checked against the 95th-percentile sky pixel behind it.
  - Covered: home in Explorer and Recruiter, 390px phone, and all four project pages.
  - Everything passes AA except a brand monogram (a logotype, so exempt) and metadata lines that already fail on main's `#2c2620` ground. Text colours were not changed.
- **Scrolling with 4× CPU throttle:** p50 frame is 33 ms, down from 100 ms before the token fix. The p95 spikes also appear with the sky off.
- **Reviews:**
  - Codex read-only review, three passes. The first found 3 blockers, the second 1 (print); all were fixed. The final pass returned **NO BLOCKERS**.
  - An independent whole-branch review returned "Ready with fixes" (1 Important); all its findings are fixed.

## Known, accepted
- `sky.js` keeps one anonymous `load` listener alive if the component is destroyed before `load`. It is harmless (the destroyed guard stops it), and fixing it would mean editing the verbatim file.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
