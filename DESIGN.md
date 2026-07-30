---
name: A·P Portfolio
description: Editorial-magazine portfolio with a WebGL 3D hero, cardstock-dark palette, and a singular oat voice color
colors:
  bg: "#2c2620"
  bg-alt: "#322c25"
  bg-card: "#3a342c"
  paper: "#efe3c8"
  accent-oat: "#bca47a"
  accent-sage: "#8a9d84"
  accent-ink-blue: "#6b8aa8"
  ink: "#f0e2c5"
  ink-soft: "#d6c9ad"
  ink-muted: "#b3a48c"
  ink-dim: "#5e5345"
typography:
  display:
    fontFamily: "Fraunces, Playfair Display, Georgia, serif"
    fontSize: "clamp(2.5rem, 6vw, 5.5rem)"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.01em"
    fontVariation: "opsz 144, SOFT 30-50, WONK 1"
  body:
    fontFamily: "Newsreader, Iowan Old Style, Georgia, serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "IBM Plex Mono, Courier New, monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    letterSpacing: "0.05em"
  signature:
    fontFamily: "Caveat, Bradley Hand, cursive"
    fontWeight: 500
rounded:
  sm: "2px"
  md: "4px"
  pill: "20px"
  circle: "50%"
spacing:
  column: "760px"
  container: "980px"
components:
  text-link-cta:
    textColor: "{colors.accent-oat}"
    typography: "{typography.body}"
  section-header-rule:
    backgroundColor: "{colors.accent-oat}"
    width: "36px"
    height: "1px"
  status-pip:
    backgroundColor: "{colors.accent-oat}"
    rounded: "{rounded.circle}"
---

# Design System: The A·P Journal

## 1. Overview

**Creative North Star: "The A·P Journal"**

The site presents itself as a personal magazine: a running publication with a masthead ("THE A·P JOURNAL · VOL. XXVI · NO. V"), section entries that read as articles rather than app screens, and a single sign-off voice at the close. The paper is warm cardstock, not stark white or SaaS-black; ink is cream, not pure white, so nothing on the page reads as a display panel. A restrained WebGL hero (particle constellation, bloom-lit core) and a holographic globe supply the one moment of technical spectacle the rest of the page earns the right to have, by keeping everything else quiet: no glow-heavy buttons, no card grids, no gradient text.

This system explicitly rejects the generic AI-tool aesthetic: no gradient-clipped headline text, no tiny uppercase tracked eyebrow above every section, no identical icon+heading+text card grids, no "big number, small label, gradient accent" hero-metric template. It also rejects a cold, minimalist engineering-portfolio register; warmth is structural (cardstock tone, serif type, hand-signature), not decorative.

**Key Characteristics:**
- One voice color (oat) does all the "look here" work; sage and ink-blue are rare, calm seconds.
- Long-form prose treatment (drop caps, pull quotes, a narrow 760px reading column) wherever the content is genuinely long-read.
- Baked paper-grain texture (`/grain.png`) plus a soft warm-sepia wash, both fixed and pointer-events-none, so the page never feels like flat digital pixels.
- Hairline rules (1px) and small asterisks (⁂) do the separating work that borders and shadows would otherwise do.

## 2. Colors

The palette is a warm, low-saturation cardstock-dark family with exactly one color that's allowed to carry emphasis.

### Primary
- **Oat / Honey** (`#bca47a`): the singular accent. Every rule, link, kicker, status pip, and CTA text color. Nothing else in the system is allowed to compete with it for attention.

### Secondary
- **Dusty Sage** (`#8a9d84`): calm, infrequent second voice — used at text-safe lightness (lifted from a decorative `#7d9079` specifically so sage text clears WCAG AA 4.5:1 on the dark surfaces). Decorative sage fills stay as literal low-alpha `rgba(125,144,121,*)`, separate from the text token.

### Tertiary
- **Ink Blue** (`#6b8aa8`): rare, reserved for specific brand-mark contexts (e.g. a company's own brand color inside the Experience timeline). Not a general-purpose UI color.

### Neutral
- **Cardstock Dark** (`#2c2620`): the page surface. Warm charcoal, deliberately not stark black.
- **Alt Cardstock** (`#322c25`): alternating section background, one step lighter.
- **Card Well** (`#3a342c`): card/well surfaces, one step lighter again.
- **Warm Cream** (`#f0e2c5`): body ink. Never pure white.
- **Soft Cream** (`#d6c9ad`): softened cream for lead paragraphs and large intro text.
- **Muted Cream** (`#b3a48c`): metadata, captions, secondary labels — lifted from a darker original specifically to clear AA contrast on card surfaces.
- **Dim Cream** (`#5e5345`): decorative-only, borders and the faintest dividers. Never used for text a user needs to read.

### Named Rules
**The One Voice Rule.** Oat is the only color allowed to signal "pay attention here." If a second element needs emphasis on the same screen, it competes with the first; redesign the hierarchy instead of reaching for a second accent.

**The No-Pure-Neutral Rule.** Nothing in the system is true black or true white. Every surface and every ink value carries the same warm cardstock/cream undertone, top to bottom.

## 3. Typography

**Display Font:** Fraunces (variable, with `SOFT` and `WONK` axes), falling back to Playfair Display, Georgia, serif
**Body Font:** Newsreader, falling back to Iowan Old Style, Georgia, serif
**Label/Mono Font:** IBM Plex Mono, falling back to Courier New, monospace
**Signature Font:** Caveat (handwritten), used only for the "AP" nav mark and the closing signature

**Character:** A magazine pairing, not a product pairing. Fraunces carries personality (its `WONK` axis is switched on for most headings, giving deliberate character wobble); Newsreader stays a calm, highly readable long-form serif underneath it. Plex Mono is the only sans-adjacent element in the system, reserved strictly for "publication chrome" (dates, kickers, edition lines) so it never competes with the two serifs for voice.

### Hierarchy
- **Display** (600 weight, `clamp(2.5rem, 6vw, 5.5rem)`, 1.05 line-height): hero nameplate, section titles. `opsz 144, SOFT 30-50, WONK 1` variation settings give it character at large sizes.
- **Body** (400 weight, 17px, 1.65 line-height): all prose. Capped to the 760px reading column (`--column`) for long-form sections (About, Leadership); broader 980px container elsewhere.
- **Label** (500 weight, 0.75rem, 0.05em letter-spacing, IBM Plex Mono): masthead edition line, dates, mono kickers, metadata. Always used sparingly, never as a body substitute.
- **Signature** (Caveat, 500 weight): reserved for exactly two places — the nav "AP" mark and the Contact sign-off. Using it anywhere else dilutes its "handwritten, personal" meaning.

### Named Rules
**The Three-Family Ceiling.** Fraunces (display) + Newsreader (body) + IBM Plex Mono (label) is the working system. Caveat is a fourth, but its use is capped to two specific signature moments, not treated as a fourth general-purpose family.

## 4. Elevation

The system is flat by default. Depth comes from paper texture (grain + sepia wash) and warm surface-tone stepping (bg → bg-alt → bg-card), not from shadows. Shadows appear only as a deliberate, small accent on a handful of elements — never as the default card treatment.

### Shadow Vocabulary
- **Photo frame lift** (`box-shadow: 0 6px 14px rgba(0,0,0,0.28)`): a soft ambient shadow under framed photographs only.
- **Status-pip halo** (`box-shadow: 0 0 0 2px rgba(188,164,122,0.18)`, pulsing to `0 0 0 5px rgba(188,164,122,0.05)`): the masthead's "open to roles" pip and the Leadership timeline's current-role dot. A living-status signal, not decoration.
- **Focus ring** (`outline: 2px solid var(--accent)`, 3px offset): keyboard-focus only, via `:focus-visible`; never shown on mouse interaction.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. A shadow only ever appears to lift a real photograph off the page or to signal a live status, never as generic card chrome.

## 5. Components

### Buttons
- **Shape:** none in the traditional sense. The system deliberately has no filled, pill, or bordered buttons for primary actions.
- **Primary action:** rendered as a text link in oat with the CTA phrased as a sentence fragment ("Read the full case study →"), not a boxed button.
- **Hover/Focus:** underline or color-shift on hover; the shared `:focus-visible` oat ring on keyboard focus.

### Chips / Tags
- **Style:** small mono-caps pill (`border-radius: 20px`, 4px/12px padding) for hashtag-style research tags; otherwise plain mono text, no chip chrome, for most metadata.

### Cards / Containers
- **Corner style:** near-flat, 2-4px radius where a radius exists at all; fully circular (50%) only for dot/pip indicators and avatar-shaped photos.
- **Background:** `bg-card` (#3a342c) stepped one level up from the page, used sparingly — most sections are plain page background with hairline rules doing the separating work instead of card boxes.
- **Shadow strategy:** none by default (see Elevation). Highlights grid images get the "photo frame lift" shadow because they're real photographs, not because they're cards.

### Navigation
- Sticky nav below a fixed masthead band. Logo is the handwritten Caveat "AP" mark. Active links render serif-italic with a hairline underline rather than a background pill or bold weight.
- Mobile: collapses to a hamburger (`.hamburger` — three 2px bars, oat on interaction).

### Signature Component: Section Header
Every section opens with the same three-part pattern: a 36×1px oat hairline rule, a Fraunces `WONK`-on title, and an italic Newsreader subtitle underneath. This triad is the system's single most load-bearing repeated pattern; changing any one part (removing the rule, dropping the italic subtitle) should be treated as a system-wide change, not a one-section tweak.

## 6. Do's and Don'ts

### Do:
- **Do** let oat (`#bca47a`) carry every "pay attention" moment; keep sage and ink-blue rare and calm.
- **Do** phrase CTAs as text links in a sentence, not boxed buttons.
- **Do** use hairline rules (1px) and the ⁂ asterism to separate sections instead of shadows or card borders.
- **Do** keep the reading column at 760px for long-form prose sections.
- **Do** carry the section-header triad (rule + Fraunces title + italic subtitle) on every new section.

### Don't:
- **Don't** introduce gradient-clipped headline text anywhere in the system.
- **Don't** add a tiny uppercase tracked eyebrow above a section as generic scaffolding; the masthead/edition-line device already fills that role and a second one competes with it.
- **Don't** build identical icon+heading+text card grids; Projects and Research are articles, not cards, on purpose.
- **Don't** reach for a second saturated accent color for emphasis; redesign the hierarchy instead.
- **Don't** add default card-shadow chrome; shadows are reserved for real photographs and live-status pips only.
- **Don't** use pure black or pure white anywhere; every surface and ink value stays on the warm cardstock/cream family.
- **Don't** use emoji as structural icons; all icons are inline SVG from `src/icons.jsx`.
