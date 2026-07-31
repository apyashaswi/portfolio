# Animation Timing Rework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the site's uniform fixed-duration cubic-bezier reveal (used identically in 40+ places) with split spring/ease transitions and capped stagger, per `docs/superpowers/specs/2026-07-31-animation-timing-design.md`, so scroll-reveals feel organic and settle faster instead of mechanical and slow.

**Architecture:** Six independent, sequentially-ordered tasks against the existing React 18 + Vite + Framer Motion (`^12.38.0`) portfolio. No new dependencies. Each task touches one small, focused surface (a shared helper, or one component's own transition block) and is committable/testable on its own.

**Tech Stack:** React 18, Framer Motion (`motion`/`AnimatePresence`/`MotionConfig`), Vite 5.

## Global Constraints

- No new dependencies — Framer Motion's `type: 'spring', duration, bounce` shorthand and per-property transition objects (`transition={{ y: {...}, opacity: {...} }}`) are already supported by the installed version.
- `<MotionConfig reducedMotion="user">` in `src/main.jsx:12` already globally neutralizes every framer-motion transition (any shape, including springs) for OS-level reduced-motion users — do not add per-component reduced-motion branches to any of the transitions this plan touches; that global mechanism already covers it. Verify it still holds in Task 6, don't reimplement it.
- Every task ends with `npm run build` passing clean (no new errors/warnings beyond the pre-existing >500kB chunk-size warning).
- Dev server: `npm run dev` (Vite; picks an open port — check terminal output).
- Don't touch `Hero.jsx`'s `useHeroReveal` 2600ms safety-net `setTimeout` (line 17) — it's an unrelated fallback for a stuck/failed intro, not part of this rework.
- Don't touch `JourneyECG.jsx`'s milestone-card `AnimatePresence` transition (`duration: 0.22, ease: 'easeOut'`, ~line 459) — it's already quick and simple, out of scope.

---

### Task 1: Rework `fadeUp()` — the shared reveal primitive

**Files:**
- Modify: `src/utils.js`
- Test: temp Playwright script (scratchpad, not committed)

**Interfaces:**
- Produces: `fadeUp(delay = 0)` keeps its exact existing call signature and return shape (an object spreadable onto a `motion.*` element via `{...fadeUp(x)}`) — every one of its 40+ existing call sites across `src/components/*.jsx` and `src/pages/ProjectDetail.jsx` needs zero changes. Only the internal `transition` value changes.

**Context:** `fadeUp()` currently returns a single `transition: { duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }` applied uniformly to both `opacity` and `y`. This task splits that into a spring on `y` (physics-based settle) and a quick simple ease on `opacity` (so content becomes legible before the motion finishes), and clamps whatever `delay` a caller passes so no reveal is ever delayed more than 0.3s — this protects every variable-length list (Highlights, Projects, Skills, Experience) from compounding into a slow full-section settle, without needing to touch each call site's own delay math.

- [ ] **Step 1: Write a Playwright script capturing the current transition shape**

```python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    page.goto("http://localhost:5173", wait_until="networkidle", timeout=30000)
    page.wait_for_timeout(1500)  # let the intro overlay auto-dismiss
    page.click("text=Skills")
    page.wait_for_timeout(300)
    header = page.locator("#skills .section-header")
    box = header.bounding_box()
    print("SKILLS_HEADER_VISIBLE:", header.is_visible(), box is not None)
    browser.close()
```

- [ ] **Step 2: Run it to confirm the Skills section header (which uses `fadeUp()`) is reachable and visible before the change**

```bash
python "C:\Users\Yashaswi A P\.claude\skills\webapp-testing\scripts\with_server.py" --server "npm run dev" --port 5173 -- python scratchpad/test_fadeup.py
```
Expected: `SKILLS_HEADER_VISIBLE: True True`

- [ ] **Step 3: Implement the split spring/ease transition with a delay cap**

In `src/utils.js`, replace:
```js
export const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] },
})
```
with:
```js
export const fadeUp = (delay = 0) => {
  const d = Math.min(delay, 0.3)
  return {
    initial: { opacity: 0, y: 32 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-60px' },
    transition: {
      y: { type: 'spring', duration: 0.45, bounce: 0.16, delay: d },
      opacity: { duration: 0.28, ease: 'easeOut', delay: d },
    },
  }
}
```

- [ ] **Step 4: Re-run the script to verify nothing broke**

Same command as Step 2.
Expected: `SKILLS_HEADER_VISIBLE: True True` (unchanged — this step is a regression check, not a timing check; timing is verified visually in Step 5).

- [ ] **Step 5: Visual sanity check**

```python
# append to the same script, before browser.close()
    page.screenshot(path="scratchpad/skills_after.png")
```
Take one screenshot of the Skills section post-reveal. Confirm by eye that the header and skill groups are fully visible and not mid-animation or clipped (a spring with `bounce: 0.16` should settle cleanly, not oscillate visibly).

- [ ] **Step 6: `npm run build` and commit**

```bash
npm run build
git add src/utils.js
git commit -m "refactor: split fadeUp into spring(y)+ease(opacity) with delay cap"
```

---

### Task 2: `Hero.jsx` — tighten the first-load reveal

**Files:**
- Modify: `src/components/Hero.jsx:23-31`

**Interfaces:** None — `makeReveal(reduced)` keeps its exact signature and its consumers (`anim(i)` at line 40, used by `hero-kicker` i=0, `hero-name` i=1, `hero-byline`/`hero-portrait` i=2, `hero-lead` i=3, `hero-ctas` i=4) are unchanged.

**Context:** `makeReveal`'s non-reduced path staggers 5 elements at `i * 0.12` over a `duration: 0.85` tween applied uniformly to `opacity`, `y`, and `filter`. The last element (hero CTAs, i=4) doesn't finish settling until `4*0.12 + 0.85 = 1.33s` after the hero becomes visible — the very first thing every visitor sees. Reduce the stagger multiplier to `0.06` (max delay 0.24s) and split the transition the same way as `fadeUp`: `y`+`filter` on a spring, `opacity` on a quick ease.

- [ ] **Step 1: Write a Playwright script measuring hero settle time**

```python
from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    page.goto("http://localhost:5173", wait_until="networkidle", timeout=30000)
    page.wait_for_timeout(1500)  # let intro overlay dismiss, hero reveal begins
    cta = page.locator(".hero-ctas").first
    for _ in range(20):
        opacity = float(page.eval_on_selector(".hero-ctas", "el => getComputedStyle(el).opacity"))
        if opacity >= 0.99:
            break
        page.wait_for_timeout(50)
    print("HERO_CTAS_OPACITY_AFTER_SETTLE_WINDOW:", opacity)
    browser.close()
```

- [ ] **Step 2: Run it to confirm current behavior**

```bash
python "C:\Users\Yashaswi A P\.claude\skills\webapp-testing\scripts\with_server.py" --server "npm run dev" --port 5173 -- python scratchpad/test_hero.py
```
Expected: `HERO_CTAS_OPACITY_AFTER_SETTLE_WINDOW: 1.0` (confirms the polling loop and selector work before you change anything — this is a smoke test, not a before/after timing comparison, since exact opacity-transition timing is brittle to assert on precisely).

- [ ] **Step 3: Implement the tightened, split reveal**

In `src/components/Hero.jsx`, replace:
```js
const makeReveal = (reduced) => ({
  hidden: reduced ? { opacity: 0 } : { opacity: 0, y: 26, filter: 'blur(7px)' },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: reduced ? 0.4 : 0.85, delay: reduced ? 0 : i * 0.12, ease: [0.22, 1, 0.36, 1] },
  }),
})
```
with:
```js
const makeReveal = (reduced) => ({
  hidden: reduced ? { opacity: 0 } : { opacity: 0, y: 26, filter: 'blur(7px)' },
  show: (i = 0) => {
    if (reduced) {
      return { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.4, delay: 0, ease: [0.22, 1, 0.36, 1] } }
    }
    const delay = i * 0.06
    return {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        y: { type: 'spring', duration: 0.45, bounce: 0.14, delay },
        filter: { type: 'spring', duration: 0.45, bounce: 0.14, delay },
        opacity: { duration: 0.28, ease: 'easeOut', delay },
      },
    }
  },
})
```

- [ ] **Step 4: Re-run the script to confirm it still passes**

Same command as Step 2. Expected: `HERO_CTAS_OPACITY_AFTER_SETTLE_WINDOW: 1.0`

- [ ] **Step 5: Visual check**

Screenshot the hero ~1.5s after load (same wait as the test script) and confirm the kicker/name/byline/lead/CTAs are all fully settled, not mid-motion.

- [ ] **Step 6: `npm run build` and commit**

```bash
npm run build
git add src/components/Hero.jsx
git commit -m "refactor: tighten Hero reveal stagger and split into spring+ease"
```

---

### Task 3: `Nav.jsx` + `ScrollTop.jsx` — bring in line

**Files:**
- Modify: `src/components/Nav.jsx:51-56`
- Modify: `src/components/ScrollTop.jsx:15-23`

**Interfaces:** None — both are self-contained `motion.*` elements; no props or exports change.

**Context:** Both have their own one-off transitions using the old fixed-duration shape. `Nav.jsx`'s mount reveal (`y: -80→0`, `opacity`) is a flat `duration: 0.7` tween. `ScrollTop.jsx`'s appear/disappear (`opacity`+`scale`+`y`) is a flat `duration: 0.25` tween — already fairly quick, but split for consistency with everything else in this plan.

- [ ] **Step 1: Write a Playwright script confirming both elements currently animate in**

```python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    page.goto("http://localhost:5173", wait_until="networkidle", timeout=30000)
    page.wait_for_timeout(1500)
    nav_opacity = page.eval_on_selector(".nav", "el => getComputedStyle(el).opacity")
    print("NAV_OPACITY:", nav_opacity)

    page.evaluate("window.scrollTo(0, 800)")
    page.wait_for_timeout(500)
    btn = page.locator(".scroll-top-btn")
    print("SCROLL_TOP_VISIBLE:", btn.count() > 0 and btn.first.is_visible())
    browser.close()
```

- [ ] **Step 2: Run it to confirm current behavior**

```bash
python "C:\Users\Yashaswi A P\.claude\skills\webapp-testing\scripts\with_server.py" --server "npm run dev" --port 5173 -- python scratchpad/test_nav_scrolltop.py
```
Expected: `NAV_OPACITY: 1`, `SCROLL_TOP_VISIBLE: True`

- [ ] **Step 3: Update `Nav.jsx`**

Replace:
```jsx
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
```
with:
```jsx
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        y: { type: 'spring', duration: 0.4, bounce: 0.14 },
        opacity: { duration: 0.25, ease: 'easeOut' },
      }}
```

- [ ] **Step 4: Update `ScrollTop.jsx`**

Replace:
```jsx
          initial={{ opacity: 0, scale: 0.6, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 20 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
```
with:
```jsx
          initial={{ opacity: 0, scale: 0.6, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 20 }}
          transition={{
            scale: { type: 'spring', duration: 0.3, bounce: 0.2 },
            y: { type: 'spring', duration: 0.3, bounce: 0.2 },
            opacity: { duration: 0.2, ease: 'easeOut' },
          }}
```

- [ ] **Step 5: Re-run the script to confirm it still passes**

Same command as Step 2. Expected: `NAV_OPACITY: 1`, `SCROLL_TOP_VISIBLE: True`

- [ ] **Step 6: `npm run build` and commit**

```bash
npm run build
git add src/components/Nav.jsx src/components/ScrollTop.jsx
git commit -m "refactor: split Nav/ScrollTop transitions into spring+ease"
```

---

### Task 4: `Skills.jsx` — cap the inner tag-list stagger

**Files:**
- Modify: `src/components/Skills.jsx:44-56`

**Interfaces:** None — internal to the `.map()` render, no signature changes.

**Context:** Each skill category's tag list staggers per-tag at `delay: 0.04 * j` with no ceiling (`src/components/Skills.jsx:51`). A category with many tags (e.g. a 9-10 item group) can take over 0.35s of pure stagger before the last tag even starts its own 0.35s fade — compounding into a slow full-list settle. Cap it the same way `fadeUp` caps its delay.

- [ ] **Step 1: Write a Playwright script confirming the tag list renders**

```python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    page.goto("http://localhost:5173", wait_until="networkidle", timeout=30000)
    page.click("text=Skills")
    page.wait_for_timeout(500)
    tags = page.locator(".skill-item")
    print("SKILL_TAG_COUNT:", tags.count())
    print("LAST_TAG_VISIBLE:", tags.last.is_visible())
    browser.close()
```

- [ ] **Step 2: Run it to confirm current behavior**

```bash
python "C:\Users\Yashaswi A P\.claude\skills\webapp-testing\scripts\with_server.py" --server "npm run dev" --port 5173 -- python scratchpad/test_skills_tags.py
```
Expected: `SKILL_TAG_COUNT:` some number > 0, `LAST_TAG_VISIBLE: True`

- [ ] **Step 3: Cap the stagger**

In `src/components/Skills.jsx`, replace:
```jsx
                    <motion.li
                      key={s}
                      className="skill-item"
                      initial={{ opacity: 0, x: -6 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.35, delay: 0.04 * j }}
                    >
```
with:
```jsx
                    <motion.li
                      key={s}
                      className="skill-item"
                      initial={{ opacity: 0, x: -6 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: Math.min(0.04 * j, 0.25), ease: 'easeOut' }}
                    >
```

- [ ] **Step 4: Re-run the script to confirm it still passes**

Same command as Step 2. Expected: unchanged counts, `LAST_TAG_VISIBLE: True`.

- [ ] **Step 5: `npm run build` and commit**

```bash
npm run build
git add src/components/Skills.jsx
git commit -m "fix: cap Skills tag-list stagger so long lists don't settle slowly"
```

---

### Task 5: `JourneyECG.jsx` — convert the section-header reveal

**Files:**
- Modify: `src/components/JourneyECG.jsx:396-407`

**Interfaces:** None.

**Context:** The section header (`"My Journey"` title + subtitle) uses the same fixed-duration shape `fadeUp()` used before Task 1 — `duration: 0.65, ease: [0.22, 1, 0.36, 1]` applied to both `opacity` and `y`. Bring it in line with the same split-spring philosophy. (The milestone-card `AnimatePresence` transition elsewhere in this file, `duration: 0.22, ease: 'easeOut'`, is already quick/simple and is explicitly out of scope — do not touch it.)

- [ ] **Step 1: Write a Playwright script confirming the header renders**

```python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    page.goto("http://localhost:5173", wait_until="networkidle", timeout=30000)
    page.click("text=Journey")
    page.wait_for_timeout(500)
    header = page.locator("#journey .section-header")
    print("JOURNEY_HEADER_VISIBLE:", header.is_visible())
    browser.close()
```

- [ ] **Step 2: Run it to confirm current behavior**

```bash
python "C:\Users\Yashaswi A P\.claude\skills\webapp-testing\scripts\with_server.py" --server "npm run dev" --port 5173 -- python scratchpad/test_journey_header.py
```
Expected: `JOURNEY_HEADER_VISIBLE: True`

- [ ] **Step 3: Convert the transition**

In `src/components/JourneyECG.jsx`, replace:
```jsx
        <motion.div
          className="section-header"
          data-num="02"
          initial={{ opacity:0, y:32 }}
          whileInView={{ opacity:1, y:0 }}
          viewport={{ once:true, margin:'-60px' }}
          transition={{ duration:0.65, ease:[0.22,1,0.36,1] }}
        >
```
with:
```jsx
        <motion.div
          className="section-header"
          data-num="02"
          initial={{ opacity:0, y:32 }}
          whileInView={{ opacity:1, y:0 }}
          viewport={{ once:true, margin:'-60px' }}
          transition={{
            y: { type: 'spring', duration: 0.45, bounce: 0.16 },
            opacity: { duration: 0.28, ease: 'easeOut' },
          }}
        >
```

- [ ] **Step 4: Re-run the script to confirm it still passes**

Same command as Step 2. Expected: `JOURNEY_HEADER_VISIBLE: True`

- [ ] **Step 5: `npm run build` and commit**

```bash
npm run build
git add src/components/JourneyECG.jsx
git commit -m "refactor: convert JourneyECG section-header to split spring+ease"
```

---

### Task 6: `IntroOverlay.jsx` — trim the forced wait, verify reduced-motion still holds

**Files:**
- Modify: `src/components/IntroOverlay.jsx:19,54,61,68,69,78,84`
- Test: temp Playwright script (scratchpad, not committed)

**Interfaces:** None — `IntroOverlay` takes no props and its exports (`introWillShow`, `fireIntroDone` from `../intro`, consumed by `Hero.jsx`) are untouched.

**Context:** The auto-dismiss timer (line 19, currently `2000ms`) forces every fresh session to wait before the hero is reachable. Shrinking it to `1200ms` without also rescaling the internal sequence would cut two animations off mid-flight: the `.intro-flash` currently spans the *full* 2.0s (`duration: 2.0, times: [0, 0.8, 0.9, 1]` — it doesn't even reach its peak, at 1.6s, before a 1.2s dismiss would fire), and `.intro-monogram`'s own `exit` (line 68, `duration: 0.7`) is longer than the plan's new outer-overlay exit (`duration: 0.85` → `0.5`, line 54) that `AnimatePresence` actually awaits before unmounting the whole subtree — so if left at 0.7s the monogram's own exit would get truncated by the earlier unmount. All five timed elements need to be rescaled together so nothing is cut off:

| Element | Old | New | Finishes at |
|---|---|---|---|
| Auto-dismiss timer (line 19) | 2000ms | 1200ms | — |
| `.intro-flash` (line 61) | `duration:2.0, times:[0,0.8,0.9,1]` | `duration:1.0, times:[0,0.75,0.85,1]` | 1.0s |
| `.intro-monogram` enter (line 69) | `duration:1.0` | `duration:0.6` | 0.6s |
| `.intro-rule` (line 78) | `delay:0.4, duration:1.1` | `delay:0.25, duration:0.65` | 0.9s |
| `.intro-tagline` (line 84) | `delay:0.6, duration:0.6` | `delay:0.4, duration:0.4` | 0.8s |
| `.intro-overlay` exit (line 54) | `duration:0.85` | `duration:0.5` | dismiss+0.5s |
| `.intro-monogram` exit (line 68) | `duration:0.7` | `duration:0.45` | dismiss+0.45s (≤ overlay's exit, so it completes before unmount) |

Every row above finishes before the 1200ms dismiss fires (or, for the two exit rows, before the overlay's own exit completes) — nothing gets visually cut off.

- [ ] **Step 1: Write a Playwright script confirming the intro currently shows and auto-dismisses**

```python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    page.goto("http://localhost:5173", wait_until="domcontentloaded", timeout=30000)
    overlay = page.locator(".intro-overlay")
    print("INTRO_VISIBLE_IMMEDIATELY:", overlay.count() > 0 and overlay.first.is_visible())
    page.wait_for_timeout(2600)  # old timer (2000ms) + old exit (850ms) with margin
    print("INTRO_GONE_AFTER_2600MS:", overlay.count() == 0)
    browser.close()
```

- [ ] **Step 2: Run it to confirm current behavior**

```bash
python "C:\Users\Yashaswi A P\.claude\skills\webapp-testing\scripts\with_server.py" --server "npm run dev" --port 5173 -- python scratchpad/test_intro_timing.py
```
Expected: `INTRO_VISIBLE_IMMEDIATELY: True`, `INTRO_GONE_AFTER_2600MS: True`

- [ ] **Step 3: Apply all six timing changes from the table above**

In `src/components/IntroOverlay.jsx`, replace:
```jsx
    const t = setTimeout(() => dismiss(), 2000)
```
with:
```jsx
    const t = setTimeout(() => dismiss(), 1200)
```

Replace:
```jsx
          exit={{ opacity: 0, scale: 1.08, filter: 'blur(6px)', transition: { duration: 0.85, ease: [0.7, 0, 0.2, 1] } }}
```
with:
```jsx
          exit={{ opacity: 0, scale: 1.08, filter: 'blur(6px)', transition: { duration: 0.5, ease: [0.7, 0, 0.2, 1] } }}
```

Replace:
```jsx
            animate={{ opacity: [0, 0, 0.9, 0], scale: [0.2, 0.2, 1.6, 2.2] }}
            transition={{ duration: 2.0, times: [0, 0.8, 0.9, 1], ease: 'easeOut' }}
```
with:
```jsx
            animate={{ opacity: [0, 0, 0.9, 0], scale: [0.2, 0.2, 1.6, 2.2] }}
            transition={{ duration: 1.0, times: [0, 0.75, 0.85, 1], ease: 'easeOut' }}
```

Replace:
```jsx
            exit={{ scale: 1.35, opacity: 0, transition: { duration: 0.7, ease: [0.7, 0, 0.2, 1] } }}
            transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
```
with:
```jsx
            exit={{ scale: 1.35, opacity: 0, transition: { duration: 0.45, ease: [0.7, 0, 0.2, 1] } }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
```

Replace:
```jsx
            transition={{ delay: 0.4, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
```
with:
```jsx
            transition={{ delay: 0.25, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
```

Replace:
```jsx
            transition={{ delay: 0.6, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
```
with:
```jsx
            transition={{ delay: 0.4, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
```

- [ ] **Step 4: Re-run the timing script with updated expectations**

Update the script's wait from `2600` to `1800` (new timer 1200ms + new overlay exit 500ms, with margin) and its print label accordingly, then re-run:
```bash
python "C:\Users\Yashaswi A P\.claude\skills\webapp-testing\scripts\with_server.py" --server "npm run dev" --port 5173 -- python scratchpad/test_intro_timing.py
```
Expected: `INTRO_VISIBLE_IMMEDIATELY: True`, `INTRO_GONE_AFTER_1800MS: True`

- [ ] **Step 5: Verify reduced-motion still fully bypasses the intro (regression check for the whole plan, not just this task)**

```python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    page.emulate_media(reduced_motion="reduce")
    page.goto("http://localhost:5173", wait_until="networkidle", timeout=30000)
    overlay_count = page.locator(".intro-overlay").count()
    print("INTRO_OVERLAY_COUNT_UNDER_REDUCED_MOTION:", overlay_count)
    hero_cta = page.locator(".hero-ctas")
    print("HERO_CTAS_VISIBLE_IMMEDIATELY_UNDER_REDUCED_MOTION:", hero_cta.count() > 0 and hero_cta.first.is_visible())
    browser.close()
```
Run the same way (via `with_server.py`). Expected: `INTRO_OVERLAY_COUNT_UNDER_REDUCED_MOTION: 0` (the intro should never mount at all under reduced motion — this is existing `introWillShow` behavior, unrelated to the timing changes, but confirms nothing in this plan accidentally broke that gate), `HERO_CTAS_VISIBLE_IMMEDIATELY_UNDER_REDUCED_MOTION: True`.

- [ ] **Step 6: `npm run build` and commit**

```bash
npm run build
git add src/components/IntroOverlay.jsx
git commit -m "fix: trim intro overlay timing from ~2850ms to ~1700ms end-to-end"
```

---

## Explicitly out of scope for this plan

- The WebGL hero's GPU-stall console warning (post-processing pipeline) — a raw performance issue, not a timing/easing one. Worth a follow-up pass if the site still feels slow after this plan lands.
- `Hero.jsx`'s `useHeroReveal` 2600ms safety-net timeout — an unrelated fallback, not part of the reveal timing being reworked.
- `JourneyECG.jsx`'s milestone-card `AnimatePresence` transition — already quick and simple.
- Any CSS-only hover/focus transitions (buttons, nav links, etc.) — surveyed during design and found to already be short (0.15-0.3s) and using sane easing; not a contributor to the reported "mechanical/slow" feel.
