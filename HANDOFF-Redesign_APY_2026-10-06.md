# Handoff — Redesign_APY_2026-10-06 ("cinematic glass" layer)

> Status as of **2026-10-07**. Branch `Redesign_APY_2026-10-06`, pushed, PR open against
> `redesign/journal-edition` (PR #5, itself still open against `main`). Nothing is merged.
> Branch naming for future redesign work: `Redesign_APY_<YYYY-MM-DD of the edit>`.

---

## TL;DR

The redesign brief in `../redesign-prompt.md` (one folder up, in `Website/`) is fully implemented:
a glass-and-light layer modelled on the *interaction design* of unrealdhanush.com, rebuilt
in the editorial-dark palette. All seven phases are done, Codex reviewed it twice, and every
finding is fixed and browser-verified.

**Hard rule that held throughout: no site information changed.** A text/link/image/label snapshot
of every route in both modes was taken before the first edit (`scripts/qa/content-baseline.json`)
and diffed after every phase. The final result is `CONTENT PRESERVED`. The only additions are a
"Scroll" cue (`#about`) and a "Selected impact" label.

---

## How to pick it up

```bash
git switch Redesign_APY_2026-10-06
npm install            # if node_modules is missing
npm run dev            # http://localhost:5173, hot reload
```

Verify nothing broke after any change (needs `pip install playwright && playwright install chromium`):

```bash
npm run build && npx vite preview --port 4173 &      # or point the scripts at :5173
python scripts/qa/snapshot.py http://localhost:5173 now.json
python scripts/qa/diffsnap.py scripts/qa/content-baseline.json now.json   # must print CONTENT PRESERVED
python scripts/qa/qa.py http://localhost:5173        # axe on all routes/modes, skip-link order, 360px overflow
```

`diffsnap.py` only fails on **removals**. Additions are listed but allowed.

---

## Where everything lives

All new styling is in five stylesheets imported **last** in `src/main.jsx`, so they override by
cascade and nothing in `styles.css` / `journal.css` was rewritten:

| File | Contents |
|---|---|
| `src/cinematic.css` | tokens (`--glass*`, `--grad-voice`, `--sage-text`, `--ease-out-expo`, `--maxw`), atmosphere, `.glass`, `.btn-pill*`, section scaffolding, `content-visibility` budget, print |
| `src/cinematic-chrome.css` | floating glass nav + mobile sheet, hero, scroll cue, intro ECG, `.btn-ghost` |
| `src/cinematic-showcase.css` | pinned "Selected impact" band + its static grid fallback, `.cine-tag` |
| `src/cinematic-sections.css` | trust marquee, About stat/education tiles, Experience timeline |
| `src/cinematic-work.css` | Projects, Highlights, Research, Skills, Leadership, Globe, Contact, Footer, project-detail pages, ECG contrast repairs, phone blur cut |

New/changed JS:

- `src/components/AmbientMesh.jsx` (new): drifting oat/honey/sage light on a fixed 2D canvas.
  It renders at 1/8 resolution, 30fps, and starts after load and idle. It's a **still frame** on phones,
  with reduced motion, or with Effects: off.
- `src/components/Showcase.jsx` + `src/showcaseScene.js` (new): 300vh pinned band. three.js is
  lazy-imported only near the band and renders only while it's on screen. Captions are each project's first
  `caseStudy.metrics` entry. It falls back to `ImpactGrid` (static glass cards) on phones, reduced
  motion/effects, Data Saver, no WebGL, chunk failure or context loss. Skipped in Recruiter mode.
- `src/utils.js`: `EASE` (the single curve), `fadeUp`/`revealTransition`/`revealVariants` on it,
  and **`scrollToSection(id)`**. See gotcha 1.
- `src/App.jsx`: scroll-spy uses a pixel mid-viewport band (`rootMargin` from `innerHeight`).
- `src/components/Nav.jsx`: CSS active pill, Contact as CTA, mobile sheet focus containment, closes
  on widening to desktop.
- `src/components/Hero.jsx`: per-line mask reveal, glass eyebrow (the one ink-blue dot), pill CTAs, `ScrollCue`.
- `src/components/TrustStrip.jsx`: marquee (4 passes, copies `aria-hidden`, stops with Effects: off).
- `src/components/IntroOverlay.jsx`: ECG trace replaces the rule. Dialog/skip/focus logic untouched.
- `DESIGN.md` §7 documents the layer and the four §6 rules it deliberately supersedes.
- `index.html`: Fraunces weight axis widened to 300–900.

---

## Gotchas (read before editing)

1. **Use `scrollToSection()` for every in-page jump.** Off-screen sections are
   `content-visibility: auto` (it cut mobile Total Blocking Time substantially). Their height is
   an estimate until rendered, so a plain `scrollIntoView` lands thousands of px off. The helper
   re-aligns after the smooth scroll ends. It is single-flight and cancels on any reader input.
   Deep links (`/#research`) are re-run through it in `pages/Home.jsx`.
2. **IntersectionObserver percentage `rootMargin` resolves against viewport *width*.** Use px.
3. **No framer `layoutId` on the nav.** Its projection pass re-measured the whole ~20k px page on
   every scroll-spy change (~400ms on a throttled phone). The active pill is pure CSS.
4. **Glass on `.nav-inner` lives on `::before`.** A `backdrop-filter` on the element itself would
   become the containing block for the `position: fixed` mobile sheet and trap it in the bar.
5. **Small sage text uses `--sage-text` (#9fb398)**, not `--accent2`. Plain sage drops to ~4.2:1 on glass.
6. **Codex CLI**: `codex exec -s read-only - < prompt.txt` (a bare positional prompt hangs on
   stdin). `codex review --base X` can't take custom instructions. The Plus quota ran out
   once mid-session. Repo policy is in `CLAUDE.md`: batch reviews, don't call per file.

---

## Numbers (Lighthouse 12, preview build)

| | Original (`journal-edition`) | This branch |
|---|---|---|
| Mobile performance | 61 | ~61–62 typical (an occasional run dips when web-font arrival collides with framer's mount-time layout read; the same mechanism exists in the original) |
| Mobile FCP / LCP | 5.9s / 7.8s | 5.6s / 7.5s |
| Desktop performance | 89 | 93 |
| Accessibility / Best practices / SEO | 100 / 100 / 100 | 100 / 100 / 100 |
| axe violations (all routes, both modes) | 9 pre-existing contrast nodes in Journey ECG | 0 |

---

## Open items / decisions for you

1. **Merge order.** This PR targets `redesign/journal-edition`. Merge PR #5 into `main` first. If
   that branch is deleted on merge, GitHub retargets this PR to `main` automatically.
2. **Design sign-off.** The layer contradicts four rules in `DESIGN.md` §6 (gradient text, card
   grids, boxed CTAs, flat-by-default). §7 records that. Keep it or reject it. Reverting is
   removing the five `cinematic*.css` imports plus `AmbientMesh` and `Showcase`.
3. **Mobile performance target (85) not reached.** The ceiling is the pre-existing ~6s first paint
   under Lighthouse throttling (render-blocking Google Fonts CSS with five font families, plus the
   Chatbase embed). Next steps if you want it:
   self-host and subset the fonts, `font-display: optional` for Caveat/Plex, and load Chatbase on
   interaction.
4. **Pre-existing CSS bug, deliberately left alone.** A stray `}` at `src/journal.css:268` makes the
   browser drop the next rule (the section-header "rule sheen"). Removing the brace *turns that
   animation on*, which is a visual change, so it's your call.
5. **Not implemented from the brief (would need new content):** a typed role line in the hero, project
   filter chips (projects have no categories), and skill percentage bars (no proficiency data). None
   was invented.
6. **Codex disagreement, not changed:** it wanted the "·" separators kept in the About stat tiles
   and contact pills. They're punctuation that the tile/pill layout replaces, so they stay hidden.
   Revisit if you read the content rule more literally.
7. Items from the old `handoff.md` (design-review backlog from July) are independent of this branch
   and still stand there.
