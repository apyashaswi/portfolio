# Final whole-branch review: feat/orbital-sky-bg (main..011582e)

Reviewer: final code reviewer (read-only). Range: `main..HEAD` (10 commits, 33 files). Inputs read: the brief (§0, §3–§7), plan.md, progress.md (all Rulings), the review diff, and the Codex output.

Single pass over the full diff, plus live probes against the dev server on :5173 (Strict Mode) using a Playwright script kept in my scratchpad. Nothing in the repo was edited apart from this file.

## What I verified (evidence)

- **sky.js is verbatim.** `git show HEAD:src/lib/sky.js | cmp - src/sky.js` reports identical, and the working copy is byte-identical too. `git status` shows `M src/lib/sky.js` only as a stat artifact: `core.autocrlf=true`, `--eol` reports i/lf w/lf, and `git diff` is empty.
- **sky.css is verbatim.** It differs from the supplied copy in one line, the poster `url("./sky-poster.jpg")` → `url("/sky-poster.jpg")`, which §4.1 allows. `SKY_PHASES` and the 0.55 scrim factor are untouched.
- **Build.** `npx vite build` (output sent to the scratchpad) is green. `sky-poster.jpg` ships, and `sky-reference.html` is not in dist. The minified CSS keeps `rgba(12,9,7,min(.92,calc(.58 + var(--sky-scrim, 0) * 1.5)))` intact. The bundle order is styles.css → sky.css → sky-panels.css → ask-ai.css, so the `.scroll-top-btn` overrides in ask-ai.css win, as intended.
- **Dependencies.** `npm ls` shows react-globe.gl 2.37.1 → globe.gl → three-globe, all on three 0.183.2 deduped. Nothing is missing or invalid. No `@react-three/*` remains in the lockfile or node_modules. A grep finds no leftovers: no HeroScene/HeroHUD, `hero-scene`, `hero-hud`, `hero-poster`, `webglAvailable` or `saveDataOn`.
- **Lifecycle probe (dev, Strict Mode, 1440×900):**

  | Step | Result |
  |---|---|
  | After load | One `canvas.sky-canvas`, first child of body, with `.on` set and `window.__sky` present |
  | 7 rapid EFFECTS clicks | Off, no `.on`, one canvas |
  | 8th click | On |
  | `WEBGL_lose_context` forced | 0 canvases during the 500 ms rebuild window |
  | EFFECTS turned off during the rebuild window | Rebuilt canvas stays hidden |
  | EFFECTS on again | `.on` set, one canvas |
  | Client route to `/projects/spidey` and back | One canvas throughout |
  | Console | No errors or warnings |

- **Horizontal scroll.** At 320, 390 and 420 px, `scrollWidth === innerWidth`.
- **Mobile menu (390).** It opens, and `elementFromPoint` hits `.nav-link`.

## Strengths

- **SkyBackground.jsx** is a careful wrapper around an untouchable file.
  - Each mount creates a fresh imperative canvas, which correctly works around a lost context being unreusable after a Strict Mode remount.
  - `teardown()` removes the `webglcontextlost` listener *before* `destroy()` calls `loseContext()`, so a deliberate teardown never triggers a rebuild.
  - The rebuild timer is cleared on unmount, and rebuilds are capped at 3.
- **getContext/drawArrays wrapping is safe.**
  - sky.js calls `getContext` exactly once (sky.js:277), and the wrapper is an own property on that one element.
  - When `gl` is null, the program check is skipped and sky.js's own no-WebGL path runs. `enableRef` then calls a no-op `setEnabled` plus a harmless `classList.remove`.
  - A context that is lost at creation is treated like a link failure: it is torn down and the poster stays.
  - The `drawn` flag is reset on each build. A stale wrapper from a destroyed sky can't set it, because sky.js's `destroyed` guard stops its loop.
- **offRef/enableRef state handling is correct.** offRef is the single source of truth that `build()` reads, so a toggle during the rebuild timer, or before the first frame, lands correctly. The probe confirmed both.
- **Stacking was reasoned out properly.**
  - IntroOverlay stays in the root context, above the grain.
  - The skip link (2000) still beats the masthead (1100) inside `.sky-page`.
  - The mobile menu, skip link and tooltip were already below the body::before grain (9990) on main, so wrapping them in `.sky-page` (z 1) changes nothing against the only outside layers: the canvas (0), the grain (9989/9990), the intro (9999) and Chatbase.
  - No negative z-index exists in styles.css that the new context could re-parent.
- **Pane ::before selectors don't collide** with anything in styles.css. The only nearby pseudo-elements are `.footer::before`, which sits on `.footer`, not `.footer-inner`, `.section-header::before`, and the asterism, now on `::after`. Horizontal insets are ≥ 0, except the two figcaption pills and the phone hero pane (−16 px). Those land inside the 28 px container or figure padding, so nothing overflows even without `overflow-x: clip`.
- **`--sky-scrim` unset** (EFFECTS off from load, the rebuild window, after a link failure, after unmount) falls back to `var(..., 0)`, giving the base tint 0.58. Math functions in rgba alpha are supported in every evergreen engine (Chrome 79+, Firefox 75+, Safari 11.1+). sky.css itself relies on the same `calc(var())`-in-alpha pattern.
- **Diff hygiene.** Content and deviations sit in separate, labelled commits. The print stylesheet handles the cream-on-white case.

## Issues

### Critical
None.

### Important

1. **The project case-study pages (`/projects/:id`) are now unreadable in places. They got the sky but no reading panes.**
   - **Where:** src/sky-panels.css:14-19 (selector list), with src/styles.css:2197, where `.project-detail` lost `background: var(--bg)`.
   - **What:** The panes target only `.sky-scrim > .container | .container-prose`, the footer, the trust strip and the two captions. ProjectDetail renders `<main class="project-detail"><div class="container pd-container">` with no `sky-scrim`, so its long-form copy sits directly on the sky. Its phases are just `start`→`end`: the limb rises from 7% to 28% of the screen with crest glow, then a crimson afterglow. Because each project page is a short document, that whole sweep happens across a single page.
   - **Evidence:** I ran a readability sweep like the one in the ledger: each visible text run against the 95th-percentile pixel behind it with text hidden, every half viewport, on `/projects/spidey`. **35 text runs fall below 4.5:1**, including body paragraphs:
     - desktop: "Streamed depth data from Meta Quest 3…" at 2.09:1;
     - phone: "Hardware hackathons live and die by scope…" at 1.50:1, "Wired an ESP32…" at 1.95:1, and "Organizational Change Methodology" at 1.24:1;
     - the "Patent / Filed" stats on the crest glow at 2.6–3.0:1.

     On main these sat on #2c2620 at about 10:1. The owner's "Frosted panels" decision was made against the home-page sweep, and the sweep never covered this route (the rd-ex, rd-ph and rd-rc files are all home).
   - **Why it matters:** Every project card links here, so it's the main deep-read page. It fails the same AA bar the owner chose panes to meet.
   - **Fix:** Add `.project-detail > .pd-container` to both selector lists in sky-panels.css, including the phone inset rule and the print rule. Then re-run qa/readability on one or two project routes at both viewports. `sky-scrim` doesn't need to go on the `<main>`. A pane on the container is enough, and it matches how the home sections are handled.

### Minor

2. **The globe's hover tooltip now renders under the masthead, the nav and the Ask AP AI / back-to-top buttons.**
   - **Where:** src/sky-panels.css:77 and src/GlobeViz.jsx:202.
   - **What:** `.globe-tooltip` is `position: fixed; z-index: 9000`. On main it sat in the root stacking context, above the masthead (1100) and nav (1000). It now lives inside `#globe` (sky-scrim isolation, z 2) inside `.sky-page`, so its effective level is 2 in the page context. The ruling fixed one case, the trap under *later sections*. But when you hover a point near the top of the viewport, the card slides under the nav bar. Near the bottom-right corner it slides under AskAI (95) and scroll-top (90).
   - **Fix (optional):** Render the tooltip through `createPortal` into `.sky-page`, so it keeps z 9000 in that context. Alternatively, clamp its y below about 110 px. Low impact, since it only matters with a pointer near the chrome.

3. **A stale comment contradicts the change.**
   - **Where:** src/GlobeViz.jsx:149-151.
   - **What:** "Use solid section-alt background color instead of transparent to avoid WebGL ghost-rendering artifacts on canvas edges" still sits above `backgroundColor="rgba(0,0,0,0)"`. The fixes/globe.png capture shows no edge ghosting, so the change looks fine. Update the comment so the next reader doesn't "fix" it back.

4. **"Byte-for-byte" for sky.js depends on the line-ending config.**
   - **What:** The blob is LF and `core.autocrlf=true` here, which is why `git status` reports it as modified even though `git diff` is empty. On other checkouts it could become CRLF in the working tree. That doesn't matter at runtime, but it defeats a `cmp` check on the working tree.
   - **Fix (optional):** Add `src/lib/sky.js -text` to `.gitattributes` to pin it.

5. **The cost of 12 `backdrop-filter: blur(20px)` panes is unmeasured.**
   - **Where:** src/sky-panels.css:37-38.
   - **What:** The panes sit over a canvas that repaints at 20 fps when idle (10 fps on low power) and every frame while scrolling, so each visible pane's backdrop is recomputed per canvas frame. Check 10 (smooth under 4× CPU throttle) and the idle-fps figure look like they were taken before the panes landed (2179b20/011582e), going by the ledger.
   - **Fix:** Before the PR, re-run the perf check with the panes on a phone profile. If it's heavy, drop the blur to about 12 px or disable it under `lowPower`-like media, for example `(pointer: coarse)`.

## Checked, no issue (for the executor's record)

- **Unmount during the rebuild timer:** the timer is cleared, and teardown is idempotent.
- **Context-loss cascade:** sky.js never calls `preventDefault`, so there's no restore race. A rebuilt context that the browser later blocks returns null, and sky.js's no-WebGL path keeps the poster.
- **EFFECTS off freezes `--sky-scrim` at its last value:** sky.js only writes the tokens in `draw()`. Harmless: the pane can only be darker than needed, over a static dark poster.
- **Link-failure path:** this goes through `destroy()`, so the tokens stop updating on scroll, unlike sky.js's no-WebGL fallback. Harmless for the same reason, and the base tint still applies.
- **Asterism clearance:** the previous pane ends 56 px above the next section on desktop and 52 px on phone, and the asterism spans 50→30 px above it. That leaves little room, but they don't overlap. The footer asterism (top 26 px) clears the footer-inner pane (top 36 px) in the desktop capture.
- **Ask AP AI order:** ask-ai.css comes after styles.css in the bundle, so its overrides at ≤820 px beat the base styles at ≤768 px.

## Declined to judge

- **Chatbase DOM placement:** whether `#chatbase-bubble-window` is a direct child of `<body>`. AskAI's `finder` observes only body `childList`. The embed is remote and I couldn't load it offline. If the window is nested deeper, the open/closed label won't sync when the panel's own close button is used, though clicking still works because it reads the state on click.
- **Visual and aesthetic judgement:** whether the panes read "heavier than the owner wants" is the owner's call, covered by the Ruling.
- **Brand monogram exemption and the 15 failures that already exist on main:** these are owner Rulings, so I didn't re-measure them.
- **Codex minor on the pre-load listener:** the 'pending load listener survives destroy' item is inside verbatim sky.js, and the Ruling is accepted.
- **Contexts with the globe:** whether a sky rebuild triggered by "too many contexts" could evict react-globe.gl's context, since the oldest context goes first. That needs a multi-context GPU stress test and is outside the plan.
- **Lighthouse and LCP impact:** the poster and the `createSky` compile run at mount before load. That is the brief's specified behaviour, so I didn't measure it.

## Assessment

**Ready to merge? With fixes.** Fix #1 first, then optionally #2–#5.

**Reasoning:** The sky integration is correct and robust. The lifecycle, the verbatim files, dependency removal and stacking all check out, both empirically and by reading the code. The one material gap is that the readability fix the owner chose was never applied to the `/projects/:id` route. It is a one-line selector addition plus a re-measure.
