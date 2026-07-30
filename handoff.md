# Portfolio Design Review — Handoff

> Status as of **2026-07-30**. Branch: `design-review-fixes` (pushed, draft PR open against `main`). Nothing from this pass is merged yet — this branch currently contains review/setup artifacts only, no actual fixes.

---

## TL;DR — where we are

An end-to-end design/UX audit was just run against the live site (`/impeccable critique`, via two independent isolated assessments: an LLM design review + a deterministic detector/browser-evidence pass). Score: **31/40 ("Good")**. Full report is in `.impeccable/critique/2026-07-30T18-58-11Z__localhost-20-full-20site-20all-20sections.md`.

**Nothing has been fixed yet.** This session ran out of time / the user stepped away right after the critique + a scoping conversation. The next session should start by implementing the fixes below, in priority order.

---

## What was set up this session (new, committed)

- **`PRODUCT.md`** — strategic doc (register: brand/portfolio; audience: recruiters + broader professional network; goal: get visitors to reach out directly; personality: editorial, warm, credible). Read this before making any content/voice decisions.
- **`DESIGN.md`** — visual system doc ("The A·P Journal" — cardstock-dark palette, oat/sage/ink-blue accents, Fraunces/Newsreader/IBM Plex Mono/Caveat type system, named rules like "The One Voice Rule" and "The Flat-By-Default Rule"). Read this before touching any styling.
- **`.impeccable/design.json`** — machine-readable sidecar for the above (tonal ramps, component snippets).
- **`.impeccable/live/config.json`** — pre-configured for `/impeccable live` (in-browser visual iteration mode), Vite/SPA shell, no CSP blockers detected.
- **`.impeccable/critique/2026-07-30T18-58-11Z__localhost-20-full-20site-20all-20sections.md`** — the full critique snapshot (see below for the summary).

These four/five files are new to git this session — the repo had none of them before. `impeccable` (the design-audit skill) reads `PRODUCT.md`/`DESIGN.md` automatically on every future invocation, so don't delete them.

---

## Critique summary — score 31/40 ("Good")

Full detail in the snapshot file above; short version:

### Priority issues, in order (user confirmed: fix everything, in this order; nothing off-limits)

1. **[P0] Chatbase widget auto-opens and blocks content** — covers 35-40% of the mobile viewport across every section, and on mobile with the nav menu open it sits on top of 3 of 10 nav links (confirmed via `elementFromPoint()` + a synthetic click that produced no navigation — this is a functional bug, not just visual clutter). **Fix:** disable Chatbase's proactive/auto-open behavior in its dashboard config; keep the existing click-to-open `openChat()` hook in `Hero.jsx`.

2. **[P1] Broken/mojibake bullet glyph on every Experience bullet** — `src/styles.css:826`, `content: 'â†’'` (corrupted encoding — a known site-wide issue, see "Gotchas" below). **Fix:** `content: '\2192'` (or `'\2014'` to match `.pd-bullets` elsewhere in the same file) — one-line CSS fix.

3. **[P1] Journey (ECG monitor) and Globe sections abandon the site's One Voice palette.** User confirmed: **re-skin both into the oat/sage/ink-blue system** (not keep as intentional "insert" moments — that option was explicitly declined). This is a real design decision, not a token swap: `JourneyECG.jsx` is currently phosphor-green-on-near-black with gold/purple/teal/red badges; `GlobeViz.jsx` is navy-hologram with its own amber/teal accents. Consider a quick `/impeccable shape` pass on this specifically before diving into code, since "how does a heart-monitor or hologram read in cardstock-oat" isn't obvious.

4. **[P1] Mobile accessibility: 92% of tap targets under 44×44px** (36 of 39 audited elements — hero CTAs are 28px tall, footer social links 28px tall, ECG waypoint dots as small as 8×8px), **plus a reproducible keyboard bug**: the "Skip to content" link is never the first Tab stop on page load. Root cause traced to `src/components/IntroOverlay.jsx` — its auto-dismiss restores focus to `document.body` in a way that makes Chromium continue tabbing from the overlay's DOM position instead of resetting to document start, so the skip-link (earlier in the DOM) gets bypassed. **Fix:** raise tap targets to 44×44px (padding is enough, doesn't need to change visual size); have the dismiss handler explicitly `.focus()` the skip-link or reset focus properly.

5. **[P2] "Unvetted AI-authored content" cluster — needs YOUR input before anyone can implement it:**
   - Hero photo (`APY_with_Paws.jpg`) is a mascot photo, dominates the entire first mobile viewport. Need either a clean headshot to swap in, or a decision to demote the mascot photo to a lower "personality" section instead of the hero.
   - Hero byline restates your full name a second time directly under a headline that already says it — redundant, should probably just cut.
   - About's pull-quote (`src/components/About.jsx`) is confirmed **near-verbatim** from `data.js`'s `EXPERIENCE[0].description` — same sentence, lightly trimmed, dressed as a personal reflection with a figcaption implying it was extracted for that purpose. Needs an actual first-person line from you.
   - Testimonials section is still not built — CSS exists in `styles.css`, no component, not imported into `Home.jsx`. Still waiting on real quotes from professors (this was already known before this session).

6. **[P3] Small self-violations of the site's own `DESIGN.md`:**
   - Gradient-clip text on `.intro-monogram` (`styles.css:2183`) — directly contradicts `DESIGN.md`'s explicit "no gradient text" rule. Two dead `.grad-text`/`.grad-text-rev` utility classes (`styles.css:234, 240`) sit unused — safe to delete outright.
   - `TiltCard.jsx`'s pointer-tilt-and-glare hover effect is applied to every Projects entry, including the featured one — `DESIGN.md` explicitly says "Projects and Research are articles, not cards, on purpose." Drop `TiltCard` from Projects or swap for the same restrained photo-frame-lift shadow already used for real photographs.

### What's already working well (don't break these while fixing the above)
- 3-layer reduced-motion handling (CSS media query + `MotionConfig reducedMotion="user"` + manual guards in every WebGL component)
- Focus-trapped, Escape-dismissible `IntroOverlay` dialog (just has the one Tab-order bug noted above)
- Accessible `<details>` fallback for the pointer-only 3D globe
- Evidence-forward writing style (specific numbers, not adjectives) in Projects/Research
- Explorer/Recruiter mode toggle (`localStorage`-persisted content-density lever) — genuinely good, just isn't the default

### Also noted (minor, lower priority than the above)
- Leadership's first entry renders "Active" twice adjacent (the `period` field is literally the string `'Active'`, plus a separate current-role badge also says "Active")
- About's `::first-letter` drop-cap grabs "I'" (apostrophe included) instead of just "I" — CSS spec quirk with contractions
- `JourneyECG.jsx` hardcodes different Cratel metrics than `data.js`'s canonical entry for the same role — the two have drifted
- `StatCounter` takes 1.8s to settle; a fast scroller can screenshot an incomplete number mid-animation
- `.btn-ghost` (Recruiter-mode "Résumé" nav link) is a bordered pill, at odds with the "no bordered buttons" component rule

---

## How to resume in the next session

1. Read this file, then skim the full critique snapshot (`.impeccable/critique/2026-07-30T*.md`) for complete detail on every issue above.
2. Read `PRODUCT.md` and `DESIGN.md` if you haven't already this session — they now exist and should ground any further design work.
3. Work top-down through the priority list. Suggested order:
   - Do the two trivial one-line fixes first (Chatbase config — may need the Chatbase dashboard, not just code; bullet glyph CSS fix).
   - Then the mobile tap-target + skip-link fixes (`/impeccable adapt`).
   - Then the Journey/Globe re-skin (`/impeccable shape` first, given it's a real design decision, then implement).
   - Then the P3 self-violation cleanup (`/impeccable polish`).
   - The P2 content cluster needs material from the site owner (headshot photo, a real pull-quote line, real testimonial quotes) before it can be implemented — surface this early so it's not the blocker at the end.
4. This work is on branch `design-review-fixes`, PR open (draft) against `main`. Commit incrementally as each issue is fixed; mark the PR ready for review once everything (or an agreed subset) lands. Re-run `/impeccable critique` afterward — the score should move meaningfully off 31/40.
5. Dev server: `npm run dev` (Vite; will pick an open port, check the output — port 5173 was occupied by something else during this session, landed on 5174).

---

## Gotchas from this session (and one still-open from the last one)

1. **Mojibake / UTF-8 corruption in `styles.css` is a recurring, ongoing issue** — the prior handoff (git history, see below) already flagged corrupted box-drawing characters and em-dashes in CSS *comments*. This session found the corruption has also reached actual rendered *content* now (the Experience bullet glyph, priority issue #2 above). If you edit near either spot, re-read the file with a proper UTF-8-aware tool first; don't trust that an `old_string` match on a dash/arrow character will work as typed.
2. **The impeccable skill lives globally, not in this project.** Its scripts are at `~/.claude/skills/impeccable/scripts/` (i.e. `C:\Users\Yashaswi A P\.claude\skills\impeccable\scripts\`), not under this repo's `.claude/`. Run them with the full global path.
3. **Two Chatbase-related things to keep separate:** the auto-open/greeting behavior (P0 fix, mostly a Chatbase dashboard setting) vs. the "Chat with my AI" CTA and its `openChat()` click handler in `Hero.jsx` (keep this — it's a good feature, just shouldn't fire itself).
4. Dev server was left running in the background this session (port 5174) for the audit's browser-based checks. Kill it before starting fresh next time if it's still alive: `netstat -ano | findstr :5174` (Windows) to find the PID.

---

## Reference: how this branch relates to the last one

The previous `handoff.md` (now superseded, but preserved in git history — see commit history for "Phase A" through "Phase E" of the earlier editorial-magazine redesign, all merged to `main` well before this session) covered the cardstock-dark editorial rebuild. That work is complete and live. This session's audit was a fresh top-to-bottom review of the *result* of that redesign plus the later 3D-hero merge (`9a84b36`), not a continuation of the Phase A-E work itself.
