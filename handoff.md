# Portfolio Redesign — Handoff

> Status as of **2026-05-30**. Branch: `main`. The current session built out an editorial-magazine redesign of the portfolio.

---

## TL;DR — where we are

The portfolio has been rebuilt from a dark-3D / Linear-style SaaS look into an **editorial magazine** aesthetic. Think long-form journal: cream serif type on warm cardstock-dark paper, photo-driven, restrained palette, no glow, no buttons-with-glows, no 3D gem.

**Five phases were planned. A → E are all built.** Phase D is committed (`b549db8`). **Phase E (the sign-off footer) is built but not committed yet** — work is on disk, `vite build` passes.

**Before stopping, run:**
```
git add -A src/
git commit -m "Phase E: editorial colophon footer / sign-off"
```

---

## Design language (current)

### Palette — cardstock dark
| Var | Value | Use |
|---|---|---|
| `--bg` | `#2c2620` | page background (warm charcoal, not stark) |
| `--bg-alt` | `#322c25` | alternating section bg |
| `--bg-card` | `#3a342c` | card / well surfaces |
| `--accent` | `#bca47a` | **oat** — singular voice color (rules, links, kickers, dots) |
| `--accent2` | `#7d9079` | dusty sage — calm secondary |
| `--accent3` | `#6b8aa8` | ink-blue — tertiary, rare |
| `--ink` | `#f0e2c5` | cream body text |
| `--ink-soft` | `#d6c9ad` | softened cream for leads |
| `--ink-muted` | `#998b75` | dim metadata |
| `--ink-dim` | `#5e5345` | very dim, decorative only |

**Voice color discipline:** oat does all the editorial work. We tried vermillion red (alarm/danger on dark — rejected) and a full light-cream-paper flip (broke too many components mid-flight — reverted). Stay on cardstock dark unless there's a strong reason to revisit.

### Typography
| Var | Family | Use |
|---|---|---|
| `--font-display` | **Fraunces** (variable, with `WONK` + `SOFT` axes) | All headings, titles, name marks |
| `--font-serif` (`--font-body`) | **Newsreader** | Body prose, leads, subtitles |
| `--font-mono` | **IBM Plex Mono** | Chrome: masthead edition, dates, kickers, metadata |
| `--font-hand` | **Caveat** | Nav logo "AP" signature, contact sign-off |
| `--font-ui` | DM Sans | Utility fallback, mobile nav |

All loaded from Google Fonts in `index.html`. Fraunces uses `font-variation-settings: "opsz" 144, "SOFT" 30-50, "WONK" 1` on most headings for character.

### Texture
- **Paper grain**: SVG turbulence noise overlay (`mix-blend-mode: overlay`, 0.075 opacity) + warm sepia wash (`soft-light`, 0.13 opacity) on body `::before` / `::after`. Fixed-position, z-index 9989-9990, pointer-events none. Don't touch unless adjusting for theme change.
- **Asterism (⁂)** divider between consecutive sections (`.section + .section::before`). Oat, restrained.

### Reading column
- `--column: 760px` — narrow editorial column for long-form prose (About, Leadership).
- `.container-prose` class uses this width.
- `.container` is 980px (broader, used for Projects, Highlights, etc.).

---

## Architecture

### Top-level chrome
- `src/components/Masthead.jsx` — fixed editorial nameplate band at top (`THE A·P JOURNAL · VOL. XXVI · NO. V`, with an "Open to roles" CTA on the left and a pulsing oat pip). Replaces the old dismissible promo banner.
- `src/components/Nav.jsx` — sticky nav below masthead. "AP" logo is **Caveat handwritten**, links are serif italic when active with hairline underline.
- `src/components/Footer.jsx` — current footer has "Built with Claude Code · React on Vercel". **Phase E will rebuild this as the editorial sign-off.**

### Section structure
Section headers everywhere use a consistent pattern:
- 36px × 1px oat hairline rule (via `.section-header::before`)
- Fraunces (variable, WONK on) `.section-title` — clamp-sized
- Italic Newsreader `.section-subtitle` — editorial voice

Section numbers (`01`, `02`, …) were removed in Phase A — they read as SaaS.

### Per-section components & treatments
| Component | File | Treatment |
|---|---|---|
| Hero | `Hero.jsx` | Two-column nameplate. Italic first-name kicker over big Fraunces last name with oat period. Italic byline. Lead paragraph. Text-link CTAs (no buttons). Portrait photo in 4:5 with mono caption. |
| About | `About.jsx` | Long-read with drop-cap lead, italic pull quote, wider-than-column inline figure (`pm-class-northeastern.jpg`), "By the numbers" inline strip, education as dot-prefixed list. |
| Experience | `Experience.jsx` | Timeline-v2 with branded company-mark badges (MSIG red, Cratel oat, PES blue). Each role gets a `--brand` CSS var for in-context tinting. |
| Projects | `Projects.jsx` | Articles, not cards. Vermillion-rule mono kicker for awards, Fraunces title linking to case study, italic subtitle, mono context, em-dash bullets, italic "Read the full case study" CTA. Hairline rules separate entries. |
| Highlights | `Highlights.jsx` | 3-col grid with captions **below** image (not overlaid). MSIG award is `tall` and spans 2 rows. Mono badge top-left of frame when present. |
| Research | `Research.jsx` | Restrained 3-stat strip with rule above/below. Papers as editorial entries (`01 / UNDER REVIEW`, Fraunces title, italic authors, mono venue, serif abstract, `#hashtag` mono tags). |
| Skills | `Skills.jsx` | Already editorial from earlier phase. Icon+label grid grouped by category. Branded tool icons from Simple Icons CDN. |
| Leadership | `Leadership.jsx` | **Single-column timeline list** with vertical hairline rail. Mono period, Fraunces role, italic accent org, serif description. Current role has oat-halo dot. |
| Contact | `Contact.jsx` | Editorial sign-off. Italic blurb, huge Fraunces vermillion email link, inline `LinkedIn · GitHub · Résumé`, handwritten Caveat "— Yashaswi". |

### Data layer
- `src/data.js` — `NAV_LINKS`, `RECRUITER_NAV`, `EXPERIENCE`, `PROJECTS`, `HIGHLIGHTS`, `RESEARCH`, `SKILLS`, `LEADERSHIP`.
- `src/icons.jsx` — `simpleIconUrl()`, `skillIconUrl()`, `lookupIcon()`, `SKILL_ICONS` map, `CATEGORY_META`.
- `src/components/TechTag.jsx` — chip that renders Simple Icon if slug exists, plain text otherwise.

### Removed during the redesign
- `Banner.jsx` (replaced by `Masthead.jsx`)
- `Roadmap.jsx` + `ROADMAP` data ("AP as a Product" section — user disliked it)
- `CustomCursor.jsx` (the dot+ring cursor) — switched to system cursor
- `HeroCanvas.jsx` is **still on disk but no longer imported** anywhere. Safe to delete in a cleanup pass.
- `CareerTimeline.jsx` was already dead before this session (replaced by `JourneyECG.jsx`).
- All `.cursor-dot` / `.cursor-ring` CSS
- All `.section-num` / `.section-header::before { content: attr(data-num) }` CSS (now used for the hairline rule)
- `.btn-primary` / `.btn-glow` / `.scroll-indicator` styles
- The old `data-num="0X"` attributes are still in JSX in some components — harmless, not styled. Can be pruned in a cleanup pass.

---

## Photos (all in `public/`)

| File | Where used | Notes |
|---|---|---|
| `APY_with_Paws.jpg` | Hero portrait | Full body shot with Northeastern husky mascot. Strong "personal site" hero. |
| `pm-class-northeastern.jpg` | About inline figure | Group photo at PM class with Sharad. |
| `msig-ceo-award.jpg` | Highlights (tall feature) | CEO "You Make a Difference" award doc. |
| `mit-rh-team.jpg` | Highlights | Reality Hack winning team with the device. |
| `harvard-team.jpg` | Highlights | Asian Business Conference team. |
| `mit-scm-session.jpg` | Highlights | Editorial moment — name placard "Yashaswi" in foreground. |
| `mit-souvenir.jpg` | Highlights | With Prof. García after lecture problem-solve. |
| `mit-rh-mentor.jpg` | Highlights | Candid with the Reality Hack mentor. |
| `with-suresh-kumar.jpg` | (unused) | NYC selfie with Ex-ISRO scientist. Candidate for About or Phase E sign-off background. |
| `first-3d-model.jpg` | (unused) | Ultimaker S3 with first 3D model. Candidate for a Project hero. |
| `northeastern-logo.jpg` | (unused) | School mark — candidate if we add per-school logos on the education list. |
| `APY_Harvard_Bg.jpg`, `APY_MIT_Dome_bg.jpg`, `APY_MIT_Reality_Hack.jpg` | (unused after Phase D) | Originals replaced by stronger people-in-them shots. Safe to delete or keep. |

All 10 user-uploaded photos were renamed from long descriptive filenames to slugs to keep code URLs clean.

---

## Phase status

### Phase A — Foundation ✓ committed
Masthead, Fraunces/Newsreader/Plex Mono/Caveat type system, cardstock-dark palette, paper grain, asterism dividers, hairline-rule section heads, removed cursor/gem/section-numbers.

### Phase B — Hero as nameplate ✓ committed
Two-column hero with photo + Fraunces nameplate, text-link CTAs, mono caption.

### Phase C — About as long-read ✓ committed
Drop cap, pull quote, inline figure, by-the-numbers strip, education as dot list.

### Phase D — Section heads + flow **NOT YET COMMITTED**
Rewrote Projects (articles not cards), Research (paper entries with `01/STATUS` kickers, hashtag tags), Leadership (single-column timeline list), Contact (editorial sign-off with Caveat signature), Highlights (captions below image, not overlay). Added subtitles to all section headers that lacked them. Pruned dead responsive rules.

**Files changed in Phase D:**
- `src/components/Projects.jsx`, `Research.jsx`, `Leadership.jsx`, `Contact.jsx`, `Highlights.jsx`
- `src/components/Experience.jsx`, `Skills.jsx` (subtitle additions)
- `src/styles.css` (~400 lines replaced/refactored)

### Phase E — Personal sign-off ✓ done (not yet committed)
Rebuilt the footer as an editorial colophon / back leaf of the journal:
- Bleeds out — footer now uses `--bg` (cardstock dark), dropped the old stark `#050509` bar and the gradient top-rule.
- Small oat asterism (⁂) at the top echoes the section dividers.
- "Thank you for reading." closing line in Fraunces italic, centered. *(Flagged for tone vetting — see open decisions.)*
- Two-column colophon grid on the `--column` (760px) prose width:
  - Left: handwritten Caveat **AP** monogram, full name (Newsreader), `© MMXXVI · Somerset, New Jersey` in mono caps.
  - Right: **Colophon** label + "Set in Fraunces, Newsreader & IBM Plex Mono." + "Built with Claude Code. React, deployed on Vercel."
- Edition line at the bottom (`The A·P Journal · Vol. XXVI · No. V`) in mono caps, mirroring the masthead.
- Collapses to a single column under 768px.

Removed the old `.footer-logo` / `.footer-credit` / `.footer-inner` flex styles. `vite build` passes clean.

Code: `src/components/Footer.jsx`. CSS: `.footer*` rules (search for `.footer {`).

---

## Open decisions / things to revisit

1. **Hero portrait** — `APY_with_Paws.jpg` works but is a mascot photo. If the user produces a cleaner headshot/portrait, swap the `src` in `Hero.jsx` (lines ~38 and ~80) — same file used in both Hero and RecruiterHero.

2. **"VOL. XXVI · NO. V" in masthead** — the user did not push back on the Roman numeral edition conceit but it's twee. If it bothers them, drop or simplify to `EDITION '26`. File: `src/components/Masthead.jsx`.

3. **Three section header subtitles** are written in my voice (e.g., "Three roles, three rooms, three different ideas of what 'shipping' means."). Should be vetted by the user for tone. Files: `Experience.jsx`, `Projects.jsx`, `Leadership.jsx`, `Contact.jsx`, `Highlights.jsx`, `Skills.jsx`.

4. **About pull quote** sources from the MSIG experience description verbatim. Could be replaced with something more reflective if the user has a personal operating principle they prefer.

5. **Chatbase widget** is still loaded in `index.html`. The Hero has a "Chat with my AI →" CTA that opens it. Working.

6. **Cratel `brandColor: '#8b83e4'`** in `data.js` is purple — survives the editorial palette swap because it's the company's brand color (not a site palette decision). MSIG red and PES blue similarly. Don't normalize these unless intentionally rebranding.

7. **`dist/` directory** is untracked but accumulating Vite build output. Consider adding to `.gitignore` if not already there.

8. **`.claude/settings.local.json`** is local Claude Code state. Shouldn't be committed.

---

## Important caveats / gotchas

1. **UTF-8 mojibake in CSS comments**: Earlier in the session, two PowerShell `Get-Content` / `Set-Content` rounds mangled the box-drawing characters (─) and em-dashes (—) in `src/styles.css` comments. The CSS rules themselves are intact; only comment glyphs read as `â”€â”€â”€` and `â€"` in the file. If you edit those blocks, the Edit tool may fail to match on comment text — re-read the file with the Read tool to copy the literal bytes. Future PowerShell writes should use `[System.Text.UTF8Encoding]::new($false)` (UTF-8 no BOM).

2. **Dev server**: a Vite dev server was started in the background earlier on port **5176** (5173-5175 were busy). It's been hot-reloading the whole session. Kill it before you start the next session, or it'll keep running:
   ```
   # find the process holding 5176
   netstat -ano | findstr :5176
   ```

3. **`HeroCanvas.jsx` is orphan** — imported by nothing. Safe to delete. Same for `CareerTimeline.jsx`.

4. **Edit tool quirk on Windows** — when an edit's `old_string` contains a non-ASCII character that's been mangled (e.g., `—` → `â€"`), the Edit tool errors. Always re-Read first if a string match fails on what should be obviously-present text.

5. **`replace_all: true` foot-gun** — a literal short string like `"03"` matches *every* occurrence including section numbers AND year strings. Always check first or pass a longer unique context.

---

## How to resume in the next session

1. Read this file.
2. **Commit Phase D first** — see TL;DR section above.
3. Pick one of:
   - **Phase E (sign-off footer)** — most natural next step.
   - **Polish pass**: ProjectDetail page (the `/projects/:id` route) still uses old card styles and needs the editorial sweep too. Wasn't touched in Phase D.
   - **Content review**: vet the section subtitles I wrote, swap the hero portrait, replace the About pull quote.
   - **Cleanup**: delete `HeroCanvas.jsx`, `CareerTimeline.jsx`, dead `data-num` JSX attributes, orphan `--ink-on-dark` references; add `dist/` and `.claude/` to `.gitignore`.

4. Dev server: `npm run dev` (will pick an open port; check the output).

---

## Reference: recent commit history

```
c402380 About as long-read editorial feature                    ← Phase C
67764bc Editorial redesign: cardstock dark palette, nameplate    ← Phase A + B
866f1c8 Remove 'AP as a Product' Roadmap section
a79c2e3 Soften Hero/About: dim 3D gem, warm amber accents
5239f6a Tech-stack icons on Project chips + softer TiltCard
9a24bfe Rework Experience timeline with branded company-mark
5e8d269 Redesign Skills as icon+label rows
f5cadaf Warm palette, add film grain, credit Claude Code in footer
```

Five clean commits in this session's editorial arc, plus Phase D waiting on disk.
