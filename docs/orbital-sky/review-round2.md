# Round-2 review: feat/orbital-sky-bg (719937e..62dd2b0)

Reviewer: independent code reviewer (read-only). Inputs: progress.md (Round 2 and its Ruling), review-round2.diff (719937e..39fad8f), final-review.md, and commit **62dd2b0 "fix: round-2 Codex review"**. That commit landed while this review was running, so it is reviewed here as part of HEAD. All probes ran against the production preview on :4173, which was rebuilt mid-review to include 62dd2b0, with headless Chromium using the d3d11 GPU args and `ap-mode=explorer` unless noted. Screenshots are in `.lh/sky/review2/`. I edited nothing in the repo apart from this file and the screenshots.

## Per-item verdicts

| # | Item | Verdict |
|---|---|---|
| 1 | Feathered section panes | **Done, with issues** |
| 2 | One frosted top bar | **Done, with issues** |
| 3 | Nav highlight follows mid-screen | **Done properly** |
| 4 | Phone buttons and footer clearance | **Done, with issues** |
| 5 | Lift text that failed AA | **Done properly** (one new element misses AA) |
| 6 | Drop cap, single "Active", "Ask AP AI" CTA | **Done properly** |
| 7 | Sky tokens scoped for low-end phones | **Done properly** |
| 8 | Selected Impact, globe on request | **Done, with issues** |

### Evidence by item

**1. Feathered panes (sky-panels.css:42-62, 73-84).**
- **Desktop:** a two-axis linear mask with `mask-composite: intersect` (and the `-webkit-` `source-in` form) feathers 56 px beyond the column on every side. Type sits on full tint because the mask is fully opaque from −8 px.
- **Phones (≤720):** only the top and bottom feather.
- **Project pages:** `.project-detail > .pd-container` is in the list, so the previous review's fix #1 is kept.
- **Gaps:**
  - The phone hero pane (sky-panels.css:89-95) is still a bordered, 16 px-radius box. See phone-hero.png.
  - On phones the footer pane has hard vertical edges, with the type flush against them (finding 5).
  - The trust strip and figcaption pills stay as pills. That reads as intentional.

**2. Top bar (styles.css:60, 161-171, 355-358).**
- Masthead and `.nav.scrolled` share `--topbar-glass` and the same blur.
- The measured rects abut: masthead 0–44, nav 44–107 on desktop and 44–115 on phone. Both computed backgrounds are identical, e.g. `rgba(12,9,7,0.94)` at the morning peak.
- **Gaps:**
  - It is only one bar once `scrollY > 50`. Over the hero the nav is transparent (desktop-hero.png).
  - A 1 px hairline still separates the two halves.
  - Only the nav transitions its background (finding 9).

**3. Nav highlight (App.jsx:52-60).**
- `rootMargin: '-49.5% 0px'` with `threshold: 0` turns the observer into a 1 %-tall band at the viewport midline.
- **Probe, at both widths:** the active link matched the section under the midline for Experience, Highlights, Globe and Leadership. At the page bottom it stays on Contact. Over the hero and Impact nothing is highlighted, which is correct because neither is a nav link.

**4. Phones (ask-ai.css:47-66, AskAI.jsx:20-57).**
- **Launcher over the hero:** `.ask-ai.is-over-hero` gives `visibility:hidden; opacity:0` at 390. That also takes it out of the tab order.
- **Launcher after the hero:** visible from Impact onward.
- **Reduced motion:** hidden over the hero with no transition and `transform:none`, so the 62dd2b0 fix works.
- **Desktop:** the launcher stays visible and no longer subscribes to scroll.
- **Back to top:** `.scroll-top-btn` is `display:none` at ≤820. On desktop it is unchanged (`flex`).
- **Footer clearance:** at the page bottom on phone, no footer text rect intersects the launcher rect. Footer padding is `76px 28px 104px`.
- **Gaps:** recruiter mode hides the only chat entry (finding 2), and the phone menu breaks once scrolled (finding 1).

**5. Contrast (styles.css:504, 801, 808, 1487, 1701, 2560, 2605).** Text against the 95th-percentile pixel behind it, with the text hidden:

| Element | Contrast |
|---|---|
| `.hero-byline-by` | 8.2 desktop, 8.05 phone |
| `.exp-location` | 7.33 |
| `.exp-company-name` (MSIG, the darkest brand) | 6.05 desktop, 5.82 phone |
| `.impact-card-label` | 4.8 |
| `.impact-card-title` | 4.87 |
| `.nav-link` | 8.06 |
| **New:** `.globe-launch-cta` | **4.13** (finding 7) |

The remaining `--ink-dim` uses are decorative separators and rules only.

**6. Copy fixes.**
- About.jsx:15 renders the drop cap as `<span class="about-dropcap">I</span>'m`. Probe: the cap text is "I" and no `::first-letter` rule remains.
- Leadership: the first entry's period reads "Active" alone (finding 12 is about how that's achieved).
- The Explorer hero CTA reads "Ask AP AI →".
- The Skills chips are untouched, per the Ruling.

**7. Low-end performance (SkyBackground.jsx:25-103).**
- Probe: `<html>` carries no `--sky-*` inline style, and exactly one `style[data-sky=tokens]` exists.
- `--sky-scrim` lives on one rule scoped to its readers. I checked every `var(--sky-scrim)` reader in sky.css, sky-panels.css and styles.css, and each is matched by SCRIM_SCOPE.
- `--sky-glow` sits on `body` and is applied only after scrolling stops.
- In 62dd2b0, `dispose()` now always removes the sheet and the scroll listener, which covers sky.js's no-WebGL `destroy()` (it never clears tokens).
- **4× CPU-throttled phone scroll:** p50 33 ms, p90 50 ms, max 83 ms over 84 frames. That matches the owner-side "33 ms" claim.
- **Caveat:** `--sky-glow` on `body` still restyles the whole document. It does so once per scroll stop, which is the right trade-off.

**8. Selected Impact and the globe.**
- **Order (probe, both modes):**
  1. MSIG <30 min, a button that jumps to #experience
  2. Spidey <50ms, linking to /projects/spidey
  3. Warehouse 25%
  4. UAV 95%
  5. PCT 29
  6. Thesis 100%, a button that jumps to #research
- That matches the spec exactly. The four projects are the only ones with `caseStudy.metrics`.
- **Globe:** no GlobeViz request goes out before the click. After clicking, `GlobeViz-*.js` loads and one canvas appears.
- **Gaps:** findings 3 (print shows zeros), 4 (a chunk failure blanks the app), 6 (focus is lost) and 10–11.

## Strengths

- **The token scoping is careful.**
  - SCRIM_SCOPE matches every reader of the token.
  - Unchanged writes are skipped.
  - The glow is deferred until scrolling stops, using `lastScroll` (not just the last change).
  - 62dd2b0 closes the leak in sky.js's no-WebGL `destroy()` without touching the verbatim sky.js.
- **The feather mask is done right.**
  - It uses both the prefixed and standard composite syntaxes.
  - The phone path drops the horizontal axis instead of fighting the viewport edge.
  - The print rule still hides every pane.
- **The midline IntersectionObserver** is the correct fix for tall sections, and its comment explains why.
- **The AskAI hide is correct.** It uses `visibility` (so it leaves the tab order), respects reduced motion, and since 62dd2b0 desktop never subscribes to scroll.
- **Impact derives its numbers from `caseStudy.metrics[0]`**, so it cannot drift from the case studies. The owner-supplied extras sit in data.js with a `placement` field.
- **No regressions** against the previous review's fixes:
  - project-page panes are kept;
  - the tooltip portal is kept (GlobeViz.jsx:203);
  - `.gitattributes` still pins sky.js;
  - the print stylesheet is intact.
- **No horizontal scroll** at 320, 360, 390, 768, 1024 or 1440.

## Issues

### Critical

1. **On phones, the menu is unusable once the page is scrolled.**
   - **Where:** styles.css:355-357 (`.nav.scrolled` backdrop-filter) and styles.css:1498-1506 (`.nav-links` `position: fixed; inset: 0`).
   - **What:**
     - `backdrop-filter` makes `.nav.scrolled` the containing block for fixed descendants. So the "full-screen" menu opens as a 70 px-tall box inside the nav (rect top 44, height 70).
     - The links spill over the page with no overlay behind them, and About through Projects sit under the masthead.
     - `elementFromPoint(195,420)` hits `.container`, not the menu.
     - Screenshot: `.lh/sky/review2/phone-menu-scrolled.png`.
     - Removing the nav's backdrop-filter restores a 0–844 overlay, which confirms the cause.
   - **Status:** not a round-2 regression. Main already had `blur(20px)` there, and the previous review tested the menu unscrolled only. But round 2 rewrote these exact lines for R2. It also removed the phone back-to-top button on the grounds that "the nav is one tap away" (ask-ai.css:63-64), and that rationale only holds if the menu works.
   - **Fix (either):**
     - Render `.nav-links` for phones through a portal outside `.nav`.
     - Move the glass onto a `.nav::before` layer, so the nav itself carries no backdrop-filter.

### Important

2. **In recruiter mode (the default for new visitors), the phone launcher hides the only way into chat.**
   - **Where:** AskAI.jsx:37-57 and Hero.jsx:77-84.
   - **What:**
     - The hide is justified as "the hero has its own Ask AP AI button".
     - The recruiter hero's CTAs are Résumé and View experience, with no chat button.
     - App.jsx:17 defaults `mode` to `'recruiter'`.
     - So a recruiter landing on a phone sees no AI entry until they scroll past the hero.
   - **Fix:** only apply `is-over-hero` when `mode !== 'recruiter'`. The `mode` prop is already passed in. Alternatively, add the chat CTA to the recruiter hero.

3. **Selected Impact prints, and is read by screen readers, as zeros.**
   - **Where:** StatCounter.jsx:10-29 via Impact.jsx:24-28.
   - **What:**
     - The count starts at 0 and only runs once the element is in view.
     - Print-emulated without scrolling, the six values read `<0 min, <0ms, 0%, 0%, 0, 0%`, and the globe tagline reads `0+ cities, 0 countries, 0 US states`.
     - Tab focus exposed accessible names like `"Spidey Sense"<0msFeedback latency` before the cards had been scrolled into view.
     - The print stylesheet's comment promises "no blank sections". This is the headline-results section printing wrong numbers.
     - 62dd2b0 fixed only the reduced-motion and EFFECTS-off paths.
   - **Fix:**
     - Render the final value in the DOM, with an `aria-label` or visually hidden text, and animate a separate `aria-hidden` copy.
     - Or start the count from the target under `matchMedia('print')` with a `beforeprint` handler.

4. **If the on-request globe chunk fails to load, the whole page goes blank.**
   - **Where:** GlobeSection.jsx:22-25 (no error boundary anywhere in src).
   - **What:**
     - With `GlobeViz-*.js` aborted, clicking "Explore the interactive globe" unmounted the entire React root (`#root` innerHTML length 0).
     - This happened for real mid-review: dist was rebuilt between page load and the click, the old chunk 404'd, and that run's page went blank. That is the normal stale-tab-after-deploy case.
     - The previous IntersectionObserver trigger had the same exposure. Round 2 makes this button the only path to the chunk, so the failure now follows a deliberate user action.
   - **Fix:** wrap the `Suspense` in a small error boundary that falls back to the launcher with "Couldn't load the globe — try again", and retry the `import()`.

### Minor

5. **On phones, the footer pane has hard side edges, and the type touches them.**
   - **Where:** sky-panels.css:79-81 with styles.css:1389-1406.
   - **What:**
     - `.footer` carries the 28 px gutter as its own padding, and `.footer-inner` has none.
     - So `inset: … 0` ends the pane at x=28 and x=362, a visible vertical edge with sky on both sides (phone-footer.png).
     - "COLOPHON" and the copyright line sit flush against that edge.
     - The comment above the rule ("the pane runs edge to edge") holds for `.container`, but not for the footer.
   - **Fix:** at ≤720, give `.footer > .footer-inner::before` an inset of `… -28px`.

6. **Opening the globe loses keyboard focus.**
   - **Where:** GlobeSection.jsx:22-31.
   - **What:** the launcher button unmounts on click, and `document.activeElement` becomes `BODY`. The next Tab restarts from the top of the page.
   - **Fix:** move focus to the `role="status"` fallback, or to the globe wrapper once mounted (`tabIndex={-1}` plus `focus()`).

7. **The new "Open globe →" CTA is below AA.**
   - **Where:** styles.css:1769.
   - **What:** 11 px mono `--accent` on the launcher's radial highlight measures 4.13:1, under the 4.5:1 bar this round set for itself. The `aria-hidden` doesn't change the visual requirement.
   - **Fix:** use `--ink` or a lighter accent mix, or drop the radial highlight under it.

8. **Impact values don't line up across a row on phones.**
   - **Where:** impact.css:43, the comment "numbers share one baseline even when titles wrap".
   - **What:**
     - `margin-top: auto` aligns the value to the label, not across cards.
     - When labels wrap differently, the values sit at different heights: at 320 the value tops are 79/101/117 px into the cards, and at 360 they are 79/123.
     - See phone-impact.png, where "<30 min" sits above "<50ms".
   - **Fix:** use a CSS subgrid (`grid-template-rows: subgrid` over three rows), or give the label a fixed `min-height`.

9. **The two halves of the top bar animate out of step, and a hairline seam remains.**
   - **Where:** styles.css:351 (`.nav` has `transition: background 0.4s`; `.masthead` has none) and styles.css:166 (the masthead `border-bottom`).
   - **What:** each `--sky-scrim` step repaints the masthead at once, while the nav eases over 0.4 s. In the sunrise and sunset phases this briefly shows two tints. This is from reading the code, not from a recording.
   - **Fix:** drop `background` from the nav transition, or add the same transition to the masthead. Remove the masthead bottom border while the nav is `.scrolled`, so it truly reads as one bar.

10. **The in-page Impact cards are buttons that scroll but don't move focus.**
    - **Where:** Impact.jsx:51-53.
    - **What:** the MSIG and thesis cards are navigation. As `<button>` + `scrollIntoView`, the keyboard focus stays in Impact while the viewport jumps to Experience or Research, so the next Tab jumps back.
    - **Fix:** use `<a href="#experience">`, or focus the target section (`tabIndex=-1`) after scrolling.

11. **The Impact cards' accessible names run together.**
    - **Where:** Impact.jsx:42-46.
    - **What:** the three inline spans have no separators, giving names like "…MSIG USA<30 minMapping time…".
    - **Fix:** add visually hidden separators, or use `aria-describedby`.

12. **The Leadership fix is a string comparison.**
    - **Where:** Leadership.jsx:26.
    - **What:** `l.period !== 'Active'` hides the badge only for that exact spelling.
    - **Fix (cleaner):** give the entry a real period, e.g. "2026 – present", in data.js:346, or drop `current` from the badge logic for that row.

13. **The globe launcher prints as a dead call-to-action card.**
    - **Where:** sky-panels.css:110-127.
    - **What:** "Explore the interactive globe / Open globe →" prints as a card that can't be used on paper.
    - **Fix:** add `.globe-launch` to the print `display:none` list.

## Design-quality verdict

- **At night the feathered panes work.** Over the dark sky they disappear, as in desktop-impact.png, and the type sits cleanly.
- **At the morning peak they still read as rectangles.** In desktop-highlights.png, desktop-leadership.png and desktop-footer.png they look like near-opaque dark slabs (tint up to 0.92) whose 56 px blurred falloff is short next to their size. They look like soft-shadowed boxes more than glass dissolving into the sky.
- **The overlap zones look muddy.** Between Contact and the footer, the overlapping falloffs leave a smeared brown band, and the limb line fades into a blur halo at the pane sides.
- **Overall, an improvement on hard boxes, but not yet "feathering into the sky".** A longer feather (around 120–160 px) or a lower peak tint would help, as would a radial instead of a rectangular mask.
- **Item 1 on phones is weaker still.** The hero pane is a bordered box, and the footer pane has hard side edges.
- **The top bar reads as one piece once scrolled.** Same tint, abutting rects, but a faint seam at 44 px.
- **Over the hero it reads as a masthead strip with a floating transparent nav.** That is a defensible editorial look, but it isn't "one bar".
- **The Selected Impact cards are clean and on-system.** The numbers have good display weight. The "29 Deliverables" card is the weakest of the six, but it follows the spec's own rule (first metric).
- **The globe launcher is tidy and well proportioned.**

## Declined to judge

- **Readability of /projects/:id after feathering.** The masks change the pane edges there too, and I did not re-run the full readability sweep on project routes. The owner's r2-suite output is truncated after "== spidey".
- **The owner suite's 6 home-explorer and 2 recruiter fails.** Only the CR monogram line is shown, and that is the Ruling's brand-monogram exemption. I didn't hunt down the rest.
- **The transient 20 px offset above the masthead in my first phone-footer capture.** I couldn't reproduce it: the masthead top was 0 and `visualViewport.offsetTop` was 0 on the re-probe. I treated it as a capture artifact.
- **The sampled 1.27:1 for `.exp-location` on phone.** That was a sampling artifact. The screenshot shows it on full pane tint, and desktop measured 7.33.
- **Whether "29 Deliverables" belongs in Selected Impact at all.** The spec fixes the rule as each case study's first metric.
- **The cost of mask-image plus backdrop-filter on very low-end GPUs.** I measured only CPU-throttled frame times, not GPU-bound devices.
- **Whether the top bar should be one bar over the hero too, or only once scrolled.** The owner brief doesn't say.
- **Skills paper chips.** Excluded by the Ruling.
- **Chatbase panel behaviour.** It is remote and outside this diff.

## Assessment

**Ready to merge? With fixes.**

1. Fix finding 1 first. It is a pre-existing bug, but round 2's own rationale depends on that menu.
2. Then fix 2–4.
3. The minors are polish.

**Reasoning:** every one of the eight requested changes is in place and verifiable, the code is clean, and 62dd2b0 tidied the token lifecycle. The remaining problems are edge behaviour:
- the menu breaks once scrolled;
- recruiter mode hides the only chat entry;
- the counters show zeros in print and to screen readers;
- a failed chunk blanks the page;
- the panes look boxy at the peak sky phase.
