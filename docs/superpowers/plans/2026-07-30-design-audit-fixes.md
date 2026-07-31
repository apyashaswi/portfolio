# Design Audit Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the priority-ordered fix list from `handoff.md` (the 2026-07-30 `/impeccable critique` audit, score 31/40) on branch `design-review-fixes` — the user has already confirmed "fix everything, in this order; nothing off-limits."

**Architecture:** Six independent, sequentially-ordered tasks against the existing React 18 + Vite portfolio. No new dependencies, no new files except where a component/CSS block becomes fully dead and is deleted. Each task is committable and testable on its own via a headless Playwright script (dev server on `localhost:5173`, per `webapp-testing` skill conventions) plus `npm run build`.

**Tech Stack:** React 18, Vite 5, plain CSS (`src/styles.css`), Framer Motion, react-globe.gl/Three.js (Globe), Canvas 2D (JourneyECG).

## Global Constraints

- Every color used must come from `DESIGN.md`'s named tokens: `--accent` (oat `#bca47a`), `--accent2` (sage, text-safe, `#8a9d84`), `--accent3` (ink-blue `#6b8aa8`), decorative sage literal `rgba(125,144,121,*)`, `--bg`/`--bg-alt`/`--bg-card`, `--ink`/`--ink-soft`/`--ink-muted`/`--ink-dim`. No new hex colors.
- The One Voice Rule: oat is the only color allowed to signal "pay attention here"; sage and ink-blue stay rare, calm seconds (`DESIGN.md` §2).
- No gradient-clipped text anywhere (`DESIGN.md` §6 Don't).
- No emoji as structural icons (not touched by this plan, but don't introduce any).
- Dev server: `npm run dev` (Vite; picks an open port — check terminal output, default 5173).
- Reduced-motion and Effects-toggle handling already exist project-wide; don't remove or bypass them while editing nearby code.
- Every task ends with `npm run build` passing clean (no new errors/warnings beyond the pre-existing chunk-size warning).

---

### Task 1: P0 — Suppress Chatbase's unsolicited auto-open

**Files:**
- Modify: `index.html:92-94`
- Test: temp Playwright script (scratchpad, not committed)

**Interfaces:**
- Consumes: `window.chatbase(...)` proxy API already established by the existing embed snippet; `window.chatbase('open')` already called by `Hero.jsx`'s `openChat()` (do not touch `Hero.jsx` in this task).
- Produces: nothing new is exposed to other files — this is a self-contained `index.html` change.

**Context:** The Chatbase dashboard is configured to proactively pop the widget open on load (confirmed via Playwright screenshot: two speech bubbles auto-appear over the hero, and on a 390×844 mobile viewport they cover ~40% of the screen and sit on top of the hamburger nav). The dashboard toggle that actually controls this ("proactive message" / auto-open) is on chatbase.co, outside this repo — nobody can flip it from code.

**Verified DOM structure** (inspected live via Playwright on the running dev server — do not re-guess this, it's confirmed): Chatbase's embed script injects three separate top-level nodes into `<body>`, not one: `#chatbase-message-bubbles` (the proactive greeting/nudge — this is what's visible and blocking content), `#chatbase-bubble-button` (the small round toggle button, always wanted), and `#chatbase-bubble-window` (the actual chat panel, opened by `Hero.jsx`'s `openChat()` via `window.chatbase('open')`). An earlier attempt at this task tried calling `window.chatbase('close')` via `setTimeout` after the embed script's `onload` — **verified via Playwright that this does not work**: the bubble is still visible at 4 seconds post-load, and `window.chatbase('getState')` never returns `"initialized"` in that window, meaning `close` never reaches the real widget in time (if `close()` even targets `#chatbase-message-bubbles` at all — it likely only targets `#chatbase-bubble-window`, a different node). The fix below is CSS-only instead: hide `#chatbase-message-bubbles` by ID, permanently. This has no timing dependency (CSS applies to a matching element the instant it exists in the DOM, regardless of when the third-party script inserts it) and doesn't touch `#chatbase-bubble-button`/`#chatbase-bubble-window`, so the deliberate "Chat with my AI" CTA keeps working normally.

- [ ] **Step 1: Write a Playwright script that demonstrates the current bug**

Save as `scratchpad/test_chatbase.py` (adjust the scratchpad path to your session's temp dir):
```python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 390, "height": 844})
    page.goto("http://localhost:5173", wait_until="networkidle", timeout=30000)
    page.wait_for_timeout(3500)  # give Chatbase's own auto-open time to fire
    bubble_text = page.get_by_text("Hey! I'm AP", exact=False)
    visible = bubble_text.count() > 0 and bubble_text.first.is_visible()
    print("AUTO_OPEN_BUBBLE_VISIBLE:", visible)
    browser.close()
```

- [ ] **Step 2: Run it against the current code to confirm the bug reproduces**

Run (from the portfolio directory, with a second terminal running `npm run dev` first, or via `with_server.py` per the `webapp-testing` skill):
```bash
python "C:\Users\Yashaswi A P\.claude\skills\webapp-testing\scripts\with_server.py" --server "npm run dev" --port 5173 -- python scratchpad/test_chatbase.py
```
Expected: `AUTO_OPEN_BUBBLE_VISIBLE: True`

- [ ] **Step 3: Implement the suppression in `index.html`**

Leave the existing `<script>` embed snippet at `index.html:92-94` completely untouched (it's already correct — the earlier `setTimeout`/`chatbase('close')` approach was tried and verified not to work, so don't reintroduce it). Instead, add a small `<style>` block to the `<head>`, right before the closing `</head>` tag (after the Google Fonts `<link>` tags):
```html
    <style>
      /* Chatbase's dashboard "proactive message" setting auto-shows a greeting
         bubble on load, blocking hero content and the mobile hamburger nav
         (audit P0). That toggle lives on chatbase.co, outside this repo. The
         greeting bubble is a separate DOM node (#chatbase-message-bubbles)
         from the actual chat panel (#chatbase-bubble-window) and toggle
         button (#chatbase-bubble-button) — hiding it here doesn't touch
         either of those, so Hero.jsx's openChat() CTA keeps working. */
      #chatbase-message-bubbles { display: none !important; }
    </style>
```

- [ ] **Step 4: Re-run the Playwright script to verify the bubble no longer shows**

Same command as Step 2, but bump the script's wait to 4000ms (after the 2500ms close call) — edit `scratchpad/test_chatbase.py`'s `wait_for_timeout(3500)` to `wait_for_timeout(4000)`.
Expected: `AUTO_OPEN_BUBBLE_VISIBLE: False`

- [ ] **Step 5: Manually confirm `openChat()` still works**

Add to the same script before `browser.close()`:
```python
    page.set_viewport_size({"width": 1440, "height": 900})
    page.goto("http://localhost:5173", wait_until="networkidle", timeout=30000)
    page.wait_for_timeout(4000)
    page.get_by_role("button", name="Chat with my AI").click()
    page.wait_for_timeout(800)
    reopened = bubble_text.count() > 0 and bubble_text.first.is_visible()
    print("MANUAL_OPEN_STILL_WORKS:", reopened)
```
Expected: `MANUAL_OPEN_STILL_WORKS: True`

- [ ] **Step 6: `npm run build` and commit**

```bash
npm run build
git add index.html
git commit -m "fix: suppress Chatbase's unsolicited auto-open (P0)"
```

**Note:** unlike the first attempt at this task, the CSS-only approach above is durable against *timing* (the original failure mode) — it doesn't depend on Chatbase's undocumented JS API or any timing window. It is, however, still coupled to Chatbase's private DOM contract: it hides `#chatbase-message-bubbles` by ID, so if a future `embed.min.js` update renames that element, the P0 (mobile nav blocked) returns silently, with nothing in this repo to catch it. The actual root cause — the "proactive message" toggle on chatbase.co — is still un-flipped. Flipping it remains an outstanding manual step outside this repo; keep the CSS as defence-in-depth either way.

---

### Task 2: P1 — Fix the mojibake arrow glyph in Experience bullets

**Files:**
- Modify: `src/styles.css:826`

**Interfaces:** None — single CSS property value, no consumers to update.

**Context:** `src/styles.css:825-828` currently reads:
```css
.exp-bullets li::before {
  content: 'â†’'; position: absolute; left: 0;
  color: var(--accent2); font-size: 12px; top: 2px;
}
```
`'â†’'` is UTF-8 mis-decoded — it should be the arrow glyph `→` (U+2192). This is a known recurring corruption pattern in this file (see `handoff.md` "Gotchas" — re-read with a UTF-8-aware tool, don't trust a typed dash/arrow to match).

- [ ] **Step 1: Write a Playwright script that reads the computed `content` value**

```python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("http://localhost:5173", wait_until="networkidle", timeout=30000)
    page.click("text=Experience")
    page.wait_for_timeout(500)
    content = page.eval_on_selector(".exp-bullets li", "el => getComputedStyle(el, '::before').content")
    print("BULLET_CONTENT:", repr(content))
    browser.close()
```

- [ ] **Step 2: Run it to confirm the corrupted value**

Expected: `BULLET_CONTENT: '"â†’"'` (or the mojibake bytes rendered some other mangled way — anything that is not `'"→"'`).

- [ ] **Step 3: Fix the CSS**

In `src/styles.css`, replace:
```css
  content: 'â†’'; position: absolute; left: 0;
```
with:
```css
  content: '\2192'; position: absolute; left: 0;
```
(Use the escaped codepoint, not a literal typed arrow character, so the fix can't itself become mis-encoded on save.)

- [ ] **Step 4: Re-run the script to verify**

Expected: `BULLET_CONTENT: '"→"'`

- [ ] **Step 5: `npm run build` and commit**

```bash
npm run build
git add src/styles.css
git commit -m "fix: repair mojibake arrow glyph in Experience bullets (P1)"
```

---

### Task 3: P1 — Mobile tap targets (44×44px) + skip-link keyboard bug

**Files:**
- Modify: `src/styles.css:2778-2779` (hero-link / project-cta touch-target floor)
- Modify: `src/styles.css:2083-2119` (`.ecg-pip` hit area)
- Modify: `src/components/IntroOverlay.jsx:24-30` (focus restore on dismiss)

**Interfaces:** None new — pure CSS + one internal effect-cleanup change, no signature changes.

**Context — tap targets:** `handoff.md` flags 92% of tap targets under 44×44px; the two concretely reproducible in this repo are `.hero-link` (hero/RecruiterHero CTAs, currently 28px min-height) and `.project-cta` (currently 24px min-height) via the existing override block at `src/styles.css:2777-2779`:
```css
/* Touch-target floor (WCAG 2.5.8) for the inline hero/project CTAs */
.hero-link { display: inline-flex; align-items: center; min-height: 28px; }
.project-cta { display: inline-flex; align-items: center; min-height: 24px; }
```
Plus the ECG progress pips (`.ecg-pip`, `src/styles.css:2083-2119`), which are real `<button>` elements (`JourneyECG.jsx:479-489`) visually 8×8px (11×11px featured) — enlarging them visually would wreck the monitor's proportions, so give them an invisible hit-slop via an absolutely-positioned `::before` instead of resizing the visible dot (a standard WCAG 2.5.8 technique — target size can stay visually small if the actual hit area meets the floor).

**Correction (found by a task reviewer during execution, verified live before being folded back into this plan):** a first attempt at this step used a flat 44×44 hit-slop (`inset: -18px`), copying the 44px figure from the hero-link/project-cta fix without checking the pips' actual spacing. `.ecg-pips` (`src/styles.css:2074-2081`) lays 12 pips out with `gap: 8px`, giving a real center-to-center pitch of only ~16px between two adjacent 8px pips — far less than the ~44px a non-overlapping 44×44 target would need. A 44×44 hit-slop on every pip overlaps its neighbors by a wide margin, and because later DOM siblings paint over earlier ones in the overlap region, this was confirmed live (Playwright, clicking each pip's own visible-dot coordinates) to make every pip but the last activate the *next* milestone instead of its own — a real, reproducible regression, worse than the original under-sized-target issue.

The corrected design instead targets the actual WCAG 2.5.8 **Level AA** minimum (24×24px — 44×44 is the stricter *AAA* "Target Size (Enhanced)" criterion, 2.5.5, not the AA floor `handoff.md` was gesturing at) and widens `.ecg-pips`' `gap` from 8px to 20px to make room for it without any overlap, verified against the geometry below:
- Regular-regular pitch at `gap: 20px`: `4 + 20 + 4 = 28px` (half-pitch 14px). With `inset: -8px`, hit-box half-width is `4 + 8 = 12px` — 2px clearance on each side from a neighboring regular pip's identical hit-box.
- Regular-featured pitch at `gap: 20px`: `4 + 20 + 5.5 = 29.5px` (half-pitch 14.75px). With `inset: -6.5px` on `.featured`, its hit-box half-width is `5.5 + 6.5 = 12px` — clears the regular pip's 12px half-width with 5.5px to spare (`29.5 - 12 - 12 = 5.5`).
- Both hit-boxes land at exactly 24×24px (`8 + 2×8` and `11 + 2×6.5`), meeting the real WCAG AA floor with zero overlap.

**Context — skip-link bug:** `IntroOverlay.jsx`'s cleanup effect (lines 24-30) restores focus via `prevFocus.current.focus()`. `prevFocus.current` is captured at mount (`document.activeElement`), which — since the intro only ever shows once, at initial page load, before any user interaction — is always `document.body`. Calling `.focus()` on `<body>` (not natively focusable) doesn't reset Chromium's *sequential focus navigation* starting point, so the next Tab keypress continues from the overlay's former DOM position instead of the top of the document, skipping over `.skip-link` (`App.jsx:37`, first in the DOM). Fix: explicitly reset focus to `<body>` via a temporary `tabindex`, which *does* reset the sequential-navigation pointer, without leaving any visible focus ring (body has no focus styling) — so mouse users see no change, and the very next Tab now correctly lands on `.skip-link`.

- [ ] **Step 1: Write a Playwright script covering both bugs**

```python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 390, "height": 844})
    page.goto("http://localhost:5173", wait_until="networkidle", timeout=30000)

    # Tap targets
    for sel in [".hero-link", ".project-cta"]:
        el = page.locator(sel).first
        if el.count():
            box = el.bounding_box()
            print(sel, "height:", box["height"] if box else None)

    # Skip-link tab order after intro dismiss
    page.wait_for_timeout(2600)  # let the intro auto-dismiss (2s timer + buffer)
    page.keyboard.press("Tab")
    active = page.evaluate("document.activeElement.className")
    print("FIRST_TAB_STOP_CLASS:", active)
    browser.close()
```

- [ ] **Step 2: Run it to confirm current (broken) state**

Expected: `.hero-link height: 28`, `.project-cta height: 24`, `FIRST_TAB_STOP_CLASS:` something other than `skip-link`.

- [ ] **Step 3: Fix the tap-target floor**

In `src/styles.css`, replace:
```css
/* Touch-target floor (WCAG 2.5.8) for the inline hero/project CTAs */
.hero-link { display: inline-flex; align-items: center; min-height: 28px; }
.project-cta { display: inline-flex; align-items: center; min-height: 24px; }
```
with:
```css
/* Touch-target floor (WCAG 2.5.8) for the inline hero/project CTAs */
.hero-link { display: inline-flex; align-items: center; min-height: 44px; }
.project-cta { display: inline-flex; align-items: center; min-height: 44px; }
```

- [ ] **Step 4: Give `.ecg-pip` a 24×24 (WCAG AA) hit-slop, geometrically verified not to overlap neighbors**

In `src/styles.css`, widen the pip row's spacing first — replace:
```css
.ecg-pips {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 20px;
  flex-wrap: wrap;
}
```
with:
```css
.ecg-pips {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-top: 20px;
  flex-wrap: wrap;
}
```

Then, in the existing `.ecg-pip` rule (around line 2083):
```css
.ecg-pip {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  cursor: pointer;
```
add `position: relative;` to that declaration block (needed as the `::before` positioning context), then immediately after the whole `.ecg-pip { ... }` rule's closing brace (before `.ecg-pip:hover`), insert:
```css
.ecg-pip::before {
  content: '';
  position: absolute;
  inset: -8px; /* 8 + 2*8 = 24px hit-box — meets WCAG 2.5.8 AA's 24x24 floor.
                  Verified non-overlapping at gap:20px: regular-regular pitch
                  is 28px (half-pitch 14px) vs this hit-box's 12px half-width —
                  2px clearance. Do not copy the 44px figure from the hero-link
                  fix here; the pips are packed too tightly for a 44px target
                  to fit without overlapping (see Task 3's Context section). */
}
.ecg-pip.featured::before {
  inset: -6.5px; /* 11 + 2*6.5 = 24px hit-box for the 11px featured dot.
                    Verified vs an adjacent regular pip: pitch 29.5px
                    (half-pitch 14.75px) vs 12px + 12px combined half-widths —
                    5.5px clearance. */
}
```

After this step, verify by eye (screenshot) that the wider 20px gap still reads as a compact dot row, not an awkwardly sparse one — if it looks too spread out at common viewport widths, that's a signal to revisit before committing, not after.

- [ ] **Step 5: Fix the skip-link focus bug**

In `src/components/IntroOverlay.jsx`, replace the cleanup return block (lines 24-30):
```jsx
    return () => {
      clearTimeout(t)
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      // Return focus to wherever it was, so keyboard users aren't dumped at the top.
      if (prevFocus.current && prevFocus.current.focus) prevFocus.current.focus()
    }
```
with:
```jsx
    return () => {
      clearTimeout(t)
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      // prevFocus is always <body> here (the intro only ever shows once, at
      // initial load, before anything is interactively focused), and <body>
      // isn't natively focusable — calling .focus() on it doesn't reset
      // Chromium's sequential-navigation pointer, so the next Tab continues
      // from the overlay's former DOM position and skips .skip-link. A
      // temporary tabindex resets that pointer to the top of the document
      // instead, with no visible focus ring for mouse users.
      document.body.setAttribute('tabindex', '-1')
      document.body.focus({ preventScroll: true })
      document.body.removeAttribute('tabindex')
    }
```
Also remove the now-unused `prevFocus` ref declaration and its assignment (lines 14 and 18):
```jsx
  const prevFocus = useRef(null)
```
and
```jsx
    prevFocus.current = document.activeElement
```
(delete both lines; nothing else references `prevFocus`).

- [ ] **Step 6: Re-run the script to verify**

Expected: `.hero-link height: 44`, `.project-cta height: 44`, `FIRST_TAB_STOP_CLASS: skip-link`.

- [ ] **Step 7: `npm run build` and commit**

```bash
npm run build
git add src/styles.css src/components/IntroOverlay.jsx
git commit -m "fix: 44px tap targets + skip-link tab-order bug (P1)"
```

---

### Task 4: P1 — Re-skin JourneyECG into oat/sage

**Files:**
- Modify: `src/components/JourneyECG.jsx`
- Modify: `src/styles.css:1842-2126` (the `ECG JOURNEY` block)

**Interfaces:** None — internal color constants only, component's props/exports are unchanged.

**Context:** The ECG monitor is currently phosphor-green-on-near-black with a gold/purple/teal/red `BADGE_STYLE` map and an amber `#EF9F27` "featured" accent — a second and third saturated palette competing with the site's oat voice (`DESIGN.md` One Voice Rule). Re-skin into the existing `--bg-card`/oat/sage tokens: oat carries "look here" (Origin, Startup, Award, Current, Achievement), sage is the calm second (Education, Research, Travel, Milestone), and "Future" (still uncertain) drops to `--ink-muted`. The waveform trace goes from green phosphor to an oat-on-cardstock glow, with the head dot in warm cream (`--ink`) as the one "hot" highlight — no fourth hue introduced.

- [ ] **Step 1: Write a Playwright script asserting the current green/amber colors**

```python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    page.goto("http://localhost:5173", wait_until="networkidle", timeout=30000)
    page.click("text=Journey")
    page.wait_for_timeout(1500)
    page.screenshot(path="scratchpad/journey_before.png")
    ecg_pip_bg = page.eval_on_selector(".ecg-pip.active", "el => getComputedStyle(el).backgroundColor")
    print("ACTIVE_PIP_BG:", ecg_pip_bg)  # expect an rgb green, e.g. "rgb(0, 192, 85)"
    browser.close()
```

- [ ] **Step 2: Run it, confirm green, and eyeball `journey_before.png`**

Expected: `ACTIVE_PIP_BG: rgb(0, 192, 85)` (or similar green) — confirms pre-change state.

- [ ] **Step 3: Recolor the canvas constants in `src/components/JourneyECG.jsx`**

Replace:
```js
const BG         = '#010d04'          // near-black with faint green tint
const GRID_MINOR = 'rgba(0,140,50,0.10)'
const GRID_MAJOR = 'rgba(0,140,50,0.20)'
const LINE_DIM   = '#01300a'          // very dark green — old phosphor
const LINE_AURA  = 'rgba(0,230,80,0.14)'
const LINE_MID   = 'rgba(0,210,75,0.50)'
const LINE_CORE  = '#00d060'          // bright phosphor green
const HEAD_CLR   = '#00ff88'
```
with:
```js
const BG         = '#3a342c'          // --bg-card: monitor reads as a raised well, not near-black
const GRID_MINOR = 'rgba(188,164,122,0.07)'
const GRID_MAJOR = 'rgba(188,164,122,0.16)'
const LINE_DIM   = '#5e5345'          // --ink-dim: old trail, decorative-only tone
const LINE_AURA  = 'rgba(188,164,122,0.16)'
const LINE_MID   = 'rgba(188,164,122,0.55)'
const LINE_CORE  = '#bca47a'          // --accent (oat)
const HEAD_CLR   = '#f0e2c5'          // --ink: warm-cream "hot" highlight, not a new hue
```

- [ ] **Step 4: Recolor `BADGE_STYLE` in the same file**

Replace:
```js
const BADGE_STYLE = {
  Origin:      { bg:'rgba(201,168,76,0.18)',   color:'#c9a84c' },
  Education:   { bg:'rgba(127,119,221,0.18)',  color:'#9F97F0' },
  Research:    { bg:'rgba(127,119,221,0.18)',  color:'#9F97F0' },
  Startup:     { bg:'rgba(201,168,76,0.18)',   color:'#c9a84c' },
  Travel:      { bg:'rgba(29,158,117,0.18)',   color:'#2DB88A' },
  Award:       { bg:'rgba(204,34,34,0.22)',    color:'#ff5555' },
  Current:     { bg:'rgba(29,158,117,0.22)',   color:'#2DB88A' },
  Achievement: { bg:'rgba(201,168,76,0.18)',   color:'#c9a84c' },
  Milestone:   { bg:'rgba(127,119,221,0.18)',  color:'#9F97F0' },
  Future:      { bg:'rgba(80,80,120,0.14)',    color:'#7070a8' },
}
```
with:
```js
const BADGE_STYLE = {
  Origin:      { bg:'rgba(188,164,122,0.18)',  color:'#bca47a' },  // oat
  Education:   { bg:'rgba(125,144,121,0.16)',  color:'#8a9d84' },  // sage
  Research:    { bg:'rgba(125,144,121,0.16)',  color:'#8a9d84' },  // sage
  Startup:     { bg:'rgba(188,164,122,0.18)',  color:'#bca47a' },  // oat
  Travel:      { bg:'rgba(125,144,121,0.16)',  color:'#8a9d84' },  // sage
  Award:       { bg:'rgba(188,164,122,0.22)',  color:'#bca47a' },  // oat
  Current:     { bg:'rgba(188,164,122,0.22)',  color:'#bca47a' },  // oat
  Achievement: { bg:'rgba(188,164,122,0.18)',  color:'#bca47a' },  // oat
  Milestone:   { bg:'rgba(125,144,121,0.16)',  color:'#8a9d84' },  // sage
  Future:      { bg:'rgba(179,164,140,0.14)',  color:'#b3a48c' },  // ink-muted (quieter than sage)
}
```

- [ ] **Step 5: Recolor the hardcoded `'#EF9F27'` featured-milestone accents**

In the same file's render loop (inside the main animation `render()` function), replace both occurrences of the featured-dot color:
```js
        ctx.fillStyle   = ms.featured ? '#EF9F27' : LINE_CORE
        ctx.shadowColor = ms.featured ? '#EF9F27' : LINE_CORE
```
(appears twice — once in the milestone-dots loop, once in `drawStaticTrace`) with:
```js
        ctx.fillStyle   = ms.featured ? '#bca47a' : LINE_CORE
        ctx.shadowColor = ms.featured ? '#bca47a' : LINE_CORE
```
And the featured year-label color:
```js
        ctx.fillStyle   = ms.featured ? '#EF9F27' : 'rgba(0,210,80,0.9)'
        ctx.shadowColor = ms.featured ? '#EF9F27' : LINE_CORE
```
(also appears twice) with:
```js
        ctx.fillStyle   = ms.featured ? '#bca47a' : 'rgba(188,164,122,0.9)'
        ctx.shadowColor = ms.featured ? '#bca47a' : LINE_CORE
```

- [ ] **Step 6: Recolor the ECG chrome CSS — `src/styles.css` (the `ECG JOURNEY` block, originally lines ~1846-2126, before Task 3's insertions shifted some line numbers down — search by rule name, not line number)**

Apply each of the following exact replacements. These target only the color-bearing declarations, so they remain valid text matches even after Task 3 added `position: relative;` and new `::before` rules inside `.ecg-pip` — none of Task 3's additions touch these lines.

Replace:
```css
.ecg-monitor {
  background: #010d04;
  border: 1px solid rgba(0, 180, 70, 0.28);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 0 48px rgba(0, 210, 80, 0.07), 0 2px 28px rgba(0,0,0,0.55);
  margin-top: 36px;
}
```
with:
```css
.ecg-monitor {
  background: #3a342c;
  border: 1px solid rgba(188, 164, 122, 0.28);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 0 48px rgba(188, 164, 122, 0.07), 0 2px 28px rgba(0,0,0,0.55);
  margin-top: 36px;
}
```

Replace:
```css
.ecg-monitor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 18px;
  border-bottom: 1px solid rgba(0, 180, 70, 0.18);
  background: rgba(0, 12, 4, 0.85);
}
```
with:
```css
.ecg-monitor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 18px;
  border-bottom: 1px solid rgba(188, 164, 122, 0.18);
  background: rgba(44, 38, 32, 0.85); /* --bg */
}
```

Replace:
```css
  color: rgba(0, 200, 75, 0.75);
  text-transform: uppercase;
}
```
(the `.ecg-vitals-label` color line) with:
```css
  color: rgba(188, 164, 122, 0.75);
  text-transform: uppercase;
}
```

Replace:
```css
.ecg-bpm-num {
  font-size: 22px;
  font-weight: 700;
  color: #00d060;
  line-height: 1;
  text-shadow: 0 0 14px rgba(0,210,80,0.55);
}
.ecg-bpm-label {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: rgba(0, 180, 65, 0.65);
}
```
with:
```css
.ecg-bpm-num {
  font-size: 22px;
  font-weight: 700;
  color: #bca47a;
  line-height: 1;
  text-shadow: 0 0 14px rgba(188,164,122,0.55);
}
.ecg-bpm-label {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: rgba(188, 164, 122, 0.65);
}
```
(this pair isn't currently rendered by `JourneyECG.jsx` — recolor it anyway for consistency in case it's wired up later.)

Replace:
```css
  font-weight: 700;
  letter-spacing: 0.1em;
  color: rgba(0, 200, 75, 0.7);
}

.ecg-blink-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #00e070;
  box-shadow: 0 0 8px #00e070;
```
(the `.ecg-live-badge` color line plus `.ecg-blink-dot`) with:
```css
  font-weight: 700;
  letter-spacing: 0.1em;
  color: rgba(188, 164, 122, 0.7);
}

.ecg-blink-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #bca47a;
  box-shadow: 0 0 8px #bca47a;
```

Replace:
```css
.ecg-ctrl-btn {
  background: rgba(0, 180, 70, 0.10);
  border: 1px solid rgba(0, 180, 70, 0.28);
  color: rgba(0, 200, 75, 0.8);
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  line-height: 1.4;
}
.ecg-ctrl-btn:hover {
  background: rgba(0, 180, 70, 0.22);
  color: #00e070;
}
```
with:
```css
.ecg-ctrl-btn {
  background: rgba(188, 164, 122, 0.10);
  border: 1px solid rgba(188, 164, 122, 0.28);
  color: rgba(188, 164, 122, 0.8);
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  line-height: 1.4;
}
.ecg-ctrl-btn:hover {
  background: rgba(188, 164, 122, 0.22);
  color: #bca47a;
}
```

Replace:
```css
.ecg-speed-btn {
  background: rgba(0, 180, 70, 0.07);
  border: 1px solid rgba(0, 180, 70, 0.20);
  color: rgba(0, 180, 70, 0.55);
  border-radius: 5px;
  padding: 3px 9px;
  font-size: 11px;
  font-family: 'Courier New', monospace;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.ecg-speed-btn:hover {
  background: rgba(0, 180, 70, 0.16);
  color: rgba(0, 210, 80, 0.85);
}
.ecg-speed-btn.active {
  background: rgba(0, 180, 70, 0.24);
  border-color: rgba(0, 200, 75, 0.55);
  color: #00d060;
  box-shadow: 0 0 6px rgba(0,200,75,0.2);
}
```
with:
```css
.ecg-speed-btn {
  background: rgba(188, 164, 122, 0.07);
  border: 1px solid rgba(188, 164, 122, 0.20);
  color: rgba(188, 164, 122, 0.55);
  border-radius: 5px;
  padding: 3px 9px;
  font-size: 11px;
  font-family: 'Courier New', monospace;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.ecg-speed-btn:hover {
  background: rgba(188, 164, 122, 0.16);
  color: rgba(188, 164, 122, 0.85);
}
.ecg-speed-btn.active {
  background: rgba(188, 164, 122, 0.24);
  border-color: rgba(188, 164, 122, 0.55);
  color: #bca47a;
  box-shadow: 0 0 6px rgba(188,164,122,0.2);
}
```

Replace:
```css
  letter-spacing: 0.08em;
  color: rgba(0, 160, 55, 0.45);
  text-transform: uppercase;
}
```
(the `.ecg-scale-label` color line) with:
```css
  letter-spacing: 0.08em;
  color: rgba(188, 164, 122, 0.45);
  text-transform: uppercase;
}
```

Replace:
```css
.ecg-card {
  background: rgba(1, 14, 5, 0.80);
  border: 1px solid rgba(0, 180, 70, 0.18);
  border-radius: 10px;
  padding: 16px 20px;
  max-width: 540px;
  width: 100%;
  backdrop-filter: blur(8px);
}
.ecg-card-featured {
  border-color: rgba(239, 159, 39, 0.45);
  background: rgba(18, 10, 0, 0.85);
  box-shadow: 0 0 30px rgba(239, 159, 39, 0.14);
}
```
with:
```css
.ecg-card {
  background: rgba(58, 52, 44, 0.85);
  border: 1px solid rgba(188, 164, 122, 0.18);
  border-radius: 10px;
  padding: 16px 20px;
  max-width: 540px;
  width: 100%;
  backdrop-filter: blur(8px);
}
.ecg-card-featured {
  border-color: rgba(188, 164, 122, 0.45);
  background: rgba(58, 52, 44, 0.9);
  box-shadow: 0 0 30px rgba(188, 164, 122, 0.14);
}
```

Replace:
```css
.ecg-card-year {
  font-size: 12px;
  color: rgba(0, 200, 75, 0.55);
  font-family: 'Courier New', monospace;
  font-weight: 600;
  margin-left: auto;
}
```
with:
```css
.ecg-card-year {
  font-size: 12px;
  color: rgba(188, 164, 122, 0.55);
  font-family: 'Courier New', monospace;
  font-weight: 600;
  margin-left: auto;
}
```

Finally, the `.ecg-pip` family (background/border/box-shadow colors only — leave Task 3's `position: relative;` and `::before` rules untouched). Replace:
```css
  background: rgba(0, 160, 55, 0.08);
  border: 1px solid rgba(0, 160, 55, 0.18);
```
with:
```css
  background: rgba(188, 164, 122, 0.08);
  border: 1px solid rgba(188, 164, 122, 0.18);
```
Replace:
```css
.ecg-pip:hover {
  transform: scale(1.35);
  background: rgba(0, 180, 65, 0.28);
}
.ecg-pip.past {
  background: rgba(0, 160, 55, 0.24);
  border-color: rgba(0, 180, 65, 0.38);
}
.ecg-pip.active {
  background: #00c055;
  border-color: #00e070;
  box-shadow: 0 0 10px rgba(0,200,80,0.6);
  transform: scale(1.28);
}
```
with:
```css
.ecg-pip:hover {
  transform: scale(1.35);
  background: rgba(188, 164, 122, 0.28);
}
.ecg-pip.past {
  background: rgba(188, 164, 122, 0.24);
  border-color: rgba(188, 164, 122, 0.38);
}
.ecg-pip.active {
  background: #bca47a;
  border-color: #bca47a;
  box-shadow: 0 0 10px rgba(188,164,122,0.6);
  transform: scale(1.28);
}
```
Replace:
```css
.ecg-pip.featured.active {
  background: #EF9F27;
  border-color: #ffbb44;
  box-shadow: 0 0 12px rgba(239,159,39,0.7);
}
.ecg-pip.featured.past {
  background: rgba(239, 159, 39, 0.32);
  border-color: rgba(239, 159, 39, 0.48);
}
```
with:
```css
.ecg-pip.featured.active {
  background: #bca47a;
  border-color: #bca47a;
  box-shadow: 0 0 12px rgba(188,164,122,0.7);
}
.ecg-pip.featured.past {
  background: rgba(188, 164, 122, 0.32);
  border-color: rgba(188, 164, 122, 0.48);
}
```

- [ ] **Step 7: Re-run the script to verify, and screenshot again**

Update the script's selector check to expect oat: `ACTIVE_PIP_BG` should now read as an oat rgb, e.g. `rgb(188, 164, 122)`. Take a second screenshot (`journey_after.png`) and visually compare against `journey_before.png` — confirm the monitor now reads as "cardstock-oat instrument," not a jarring recolor (if it looks wrong, this is the point to adjust an alpha/shade before committing, not after).

- [ ] **Step 8: `npm run build` and commit**

```bash
npm run build
git add src/components/JourneyECG.jsx src/styles.css
git commit -m "refactor: re-skin Journey ECG monitor into oat/sage palette (P1)"
```

---

### Task 5: P1 — Re-skin GlobeViz into oat/sage/ink-blue

**Files:**
- Modify: `src/GlobeViz.jsx`
- Modify: `src/styles.css` (`.globe-placeholder`, `.globe-tooltip`, `.globe-legend` — lines ~1747-1841)

**Interfaces:** None — internal constants/inline styles only.

**Context:** Unlike the ECG monitor, most of `GlobeViz.jsx`'s markers are already on-palette (`hexPolygonColor`, `atmosphereColor`, and `arcColor` are already oat/sage). The actual violation is the navy-hologram **ocean/background** material (`#0a0a1a`, `#04040e`, `#161630`, `#0b0b14`) and the amber `#EF9F27` "Award/Home" marker color, which is the one place a third saturated hue competes with oat. This naturally maps to the three-tier system the user asked for: **Professional → oat** (already correct), **Travel → decorative sage literal `#7d9079`** (already correct — `DESIGN.md` explicitly carves this out as a decorative fill, distinct from the text-safe `--accent2`), **Award/Home → ink-blue `#6b8aa8`** (currently amber) — this is exactly the "rare, special-status marker" use case `DESIGN.md` §2 reserves ink-blue for.

- [ ] **Step 1: Write a Playwright script asserting the current navy/amber colors**

```python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    page.goto("http://localhost:5173", wait_until="networkidle", timeout=30000)
    page.click("text=Globe")
    page.wait_for_timeout(1500)
    page.screenshot(path="scratchpad/globe_before.png")
    legend_dots = page.eval_on_selector_all(".gl-dot", "els => els.map(e => getComputedStyle(e).backgroundColor)")
    print("LEGEND_DOT_COLORS:", legend_dots)  # 3rd entry (Award/Home) expected amber, e.g. "rgb(239, 159, 39)"
    browser.close()
```

- [ ] **Step 2: Run it, confirm amber, and eyeball `globe_before.png`**

Expected: `LEGEND_DOT_COLORS: ['rgb(188, 164, 122)', 'rgb(125, 144, 121)', 'rgb(239, 159, 39)']`.

- [ ] **Step 3: Recolor the ocean/background material in `src/GlobeViz.jsx`**

Replace:
```js
  const globeMaterial = useMemo(() => new THREE.MeshPhongMaterial({
    color: '#0a0a1a',
    emissive: '#04040e',
    specular: '#161630',
    shininess: 5,
  }), [])
```
with:
```js
  const globeMaterial = useMemo(() => new THREE.MeshPhongMaterial({
    color: '#2c2620',      // --bg: warm cardstock ocean, not navy
    emissive: '#2c2620',    // --bg (reused rather than inventing a darker shade)
    specular: '#3a342c',   // --bg-card
    shininess: 5,
  }), [])
```

- [ ] **Step 4: Recolor the `backgroundColor` prop**

Replace:
```js
          backgroundColor="#0b0b14"
```
with:
```js
          backgroundColor="#2c2620"
```

- [ ] **Step 5: Recolor the Award/Home pins from amber to ink-blue**

In the `PINS` array, find the two entries with `type: 'award'` (the MIT and Mysuru rows — both currently have `color: '#EF9F27'`). On each of those two lines only, change:
```js
color: '#EF9F27'
```
to:
```js
color: '#6b8aa8'
```
Leave everything else on those two lines untouched — including the `Â·` mojibake in their `label`/`detail` strings. That's the same pre-existing corruption pattern as Task 2's bullet glyph, but it's out of scope here: don't retype or "fix" those strings by hand, since a typed `·` can itself re-encode incorrectly (see `handoff.md`'s "Gotchas"). Change only the `color` value via an editor find-on-this-line operation, not a full-line copy/paste.

- [ ] **Step 6: Recolor the legend's Award/Home dot**

Replace:
```jsx
          <div className="gl-item">
            <span className="gl-dot" style={{ background: '#EF9F27', boxShadow: '0 0 9px #EF9F27bb' }} />
            Award / Home
          </div>
```
with:
```jsx
          <div className="gl-item">
            <span className="gl-dot" style={{ background: '#6b8aa8', boxShadow: '0 0 9px #6b8aa8bb' }} />
            Award / Home
          </div>
```

- [ ] **Step 7: Recolor the surrounding CSS in `src/styles.css`**

Replace `.globe-placeholder`'s background:
```css
  background: #0b0b14;
```
with:
```css
  background: var(--bg);
```
Replace `.globe-tooltip`'s background:
```css
  background: rgba(10,10,22,0.96);
```
with:
```css
  background: rgba(44,38,32,0.96);
```
Replace `.globe-legend`'s background:
```css
  background: rgba(8,8,18,0.82);
```
with:
```css
  background: rgba(44, 38, 32, 0.82); /* --bg */
```
(Leave the oat-tinted borders/box-shadows on both — they're already `rgba(188,164,122,*)` and correct.)

- [ ] **Step 8: Re-run the script to verify, and screenshot again**

Expected: `LEGEND_DOT_COLORS: ['rgb(188, 164, 122)', 'rgb(125, 144, 121)', 'rgb(107, 138, 168)']`. Compare `globe_after.png` against `globe_before.png` — confirm the globe now reads as a warm cardstock hologram, and the tooltip/legend are still legible against the new warm background.

- [ ] **Step 9: `npm run build` and commit**

```bash
npm run build
git add src/GlobeViz.jsx src/styles.css
git commit -m "refactor: re-skin Globe ocean/background and award markers to oat/sage/ink-blue (P1)"
```

---

### Task 6: P3 — Remove gradient text, dead CSS, and TiltCard from Projects

**Files:**
- Modify: `src/styles.css` (delete `.grad-text`/`.grad-text-rev` at lines 231-243; fix `.intro-monogram` at lines 2178-2187; delete `.tilt-card` at lines 830-835 and `.tilt-card--glare` at lines 2535-2564 once Task's Step 4 removes the only consumer)
- Modify: `src/components/Projects.jsx` (remove `TiltCard` usage)
- Delete: `src/components/TiltCard.jsx`

**Interfaces:** `Projects.jsx` no longer imports `TiltCard`; nothing else in the codebase imports it (confirmed — `TiltCard.jsx` and `Projects.jsx` are the only two files referencing it).

**Context:** Three small, independent `DESIGN.md` self-violations: (1) `.intro-monogram` uses gradient-clipped text, directly contradicting the explicit "no gradient text" rule; (2) `.grad-text`/`.grad-text-rev` are dead utility classes (confirmed zero usages in any `.jsx` file) implementing that same forbidden pattern; (3) `TiltCard`'s pointer-tracked 3D tilt+glare is applied to every Projects entry, but `DESIGN.md` says "Projects and Research are articles, not cards, on purpose" — drop the interactive tilt, keep the flat `bg-card` well styling that's already on `.project-tilt`/`.project-tilt-featured`.

- [ ] **Step 1: Write a Playwright script asserting the current violations**

```python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    page.goto("http://localhost:5173", wait_until="networkidle", timeout=30000)

    # Gradient text check (only visible during the intro overlay, which shows once)
    intro_bg_clip = page.eval_on_selector(".intro-monogram", "el => getComputedStyle(el).webkitBackgroundClip || getComputedStyle(el).backgroundClip")
    print("INTRO_MONOGRAM_BG_CLIP:", intro_bg_clip)  # expect "text"

    # TiltCard hover transform check
    page.click("text=Projects")
    page.wait_for_timeout(500)
    card = page.locator(".tilt-card--glare").first
    exists_before = card.count()
    print("TILT_CARD_GLARE_COUNT:", exists_before)
    browser.close()
```

- [ ] **Step 2: Run it to confirm current state**

Expected: `INTRO_MONOGRAM_BG_CLIP: text`, `TILT_CARD_GLARE_COUNT:` 1 or more.

- [ ] **Step 3: Fix `.intro-monogram` — drop the gradient, keep a solid oat glow**

In `src/styles.css`, replace:
```css
.intro-monogram {
  font-family: 'Playfair Display', serif;
  font-size: clamp(72px, 14vw, 140px);
  font-weight: 700;
  background: linear-gradient(135deg, var(--accent), var(--accent2));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 0 0 60px rgba(188, 164, 122, 0.25);
}
```
with:
```css
.intro-monogram {
  font-family: 'Playfair Display', serif;
  font-size: clamp(72px, 14vw, 140px);
  font-weight: 700;
  color: var(--accent);
  text-shadow: 0 0 60px rgba(188, 164, 122, 0.25);
}
```

- [ ] **Step 4: Delete the dead gradient-text utility classes**

In `src/styles.css`, delete the entire block (lines 231-243):
```css
/* ─── GRADIENT TEXT UTILITY ────────────────────────────────────────────── */
.grad-text {
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.grad-text-rev {
  background: linear-gradient(135deg, var(--accent2) 0%, var(--accent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

- [ ] **Step 5: Remove `TiltCard` from `Projects.jsx`**

In `src/components/Projects.jsx`, remove the import:
```jsx
import TiltCard from './TiltCard'
```
Replace:
```jsx
        {featured && (
          <motion.div {...fadeUp(0.05)}>
            <TiltCard className="project-tilt project-tilt-featured">
              <ProjectEntry p={featured} featured />
            </TiltCard>
          </motion.div>
        )}
        <div className="projects-list projects-list-cards">
          {rest.map((p, i) => (
            <motion.div key={p.id} {...fadeUp(i * 0.08)}>
              <TiltCard className="project-tilt">
                <ProjectEntry p={p} />
              </TiltCard>
            </motion.div>
          ))}
        </div>
```
with:
```jsx
        {featured && (
          <motion.div {...fadeUp(0.05)}>
            <div className="project-tilt project-tilt-featured">
              <ProjectEntry p={featured} featured />
            </div>
          </motion.div>
        )}
        <div className="projects-list projects-list-cards">
          {rest.map((p, i) => (
            <motion.div key={p.id} {...fadeUp(i * 0.08)}>
              <div className="project-tilt">
                <ProjectEntry p={p} />
              </div>
            </motion.div>
          ))}
        </div>
```

- [ ] **Step 6: Delete the now-fully-unused `TiltCard.jsx` and its CSS**

Delete `src/components/TiltCard.jsx` entirely.

In `src/styles.css`, delete the `.tilt-card` rule (lines 830-835):
```css
/* ─── TILT CARD ──────────────────────────────────────────────────────── */
.tilt-card {
  transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.3s ease;
  will-change: transform; transform-style: preserve-3d;
  border-radius: var(--radius);
}
```
and the `.tilt-card--glare` block (lines 2535-2564):
```css
/* ─── Project card: pointer-tracked specular glare (experiment) ───────────── */
.tilt-card--glare {
  position: relative;
  isolation: isolate;
  transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.4s ease;
  will-change: transform;
}
.tilt-card--glare:hover {
  box-shadow: 0 28px 70px -30px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(188, 164, 122, 0.22);
}
.tilt-card--glare::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  z-index: 4;
  background: radial-gradient(
    circle at var(--mx, 50%) var(--my, 50%),
    rgba(188, 164, 122, 0.28),
    rgba(188, 164, 122, 0) 42%
  );
  opacity: var(--glare, 0);
  transition: opacity 0.3s ease;
  mix-blend-mode: screen;
}
@media (prefers-reduced-motion: reduce) {
  .tilt-card--glare { transition: none; }
  .tilt-card--glare::after { display: none; }
}
```
(`.project-tilt`/`.project-tilt-featured`/`.projects-list-cards` stay — they're the flat `bg-card` well styling, not the tilt/glare interaction, and `ProjectEntry`'s plain-div wrapper still needs those classes.)

- [ ] **Step 7: Re-run the script to verify**

Expected: `INTRO_MONOGRAM_BG_CLIP:` no longer `text` (browser-dependent exact value, e.g. `border-box`), `TILT_CARD_GLARE_COUNT: 0`.

- [ ] **Step 8: `npm run build` and commit**

```bash
npm run build
git add -A src/styles.css src/components/Projects.jsx
git rm src/components/TiltCard.jsx
git commit -m "refactor: drop gradient text + TiltCard per DESIGN.md self-violations (P3)"
```

---

## Explicitly out of scope for this plan

- **P2 content cluster** (hero photo, hero byline redundancy, About's near-verbatim pull-quote, missing testimonials) — needs material from the site owner (a headshot decision, a first-person line, real testimonial quotes) before any of it is implementable. Surface this to the user; don't guess content on their behalf.
- Re-running `/impeccable critique` to confirm the score moves off 31/40 — do this once the user confirms which tasks above they want landed, as a separate final step, not per-task.
- The `Â·`/`â€"`-style mojibake scattered through `GlobeViz.jsx`'s `PINS` label/detail strings and in various CSS comments — pre-existing, not part of the audit's named P1 item (which was specifically the Experience-bullet arrow), out of scope here unless the user asks for a dedicated encoding-cleanup pass.
