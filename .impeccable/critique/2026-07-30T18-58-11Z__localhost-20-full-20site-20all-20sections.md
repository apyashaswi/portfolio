---
target: "full site (all sections, / and /projects/:id)"
total_score: 31
p0_count: 1
p1_count: 3
timestamp: 2026-07-30T18-58-11Z
slug: localhost-20-full-20site-20all-20sections
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | Nav active-states, Effects toggle, ScrollTop button all give good feedback |
| 2 | Match System / Real World | 4 | n/a |
| 3 | User Control and Freedom | 2 | Chatbase widget auto-opens and takes over screen real estate |
| 4 | Consistency and Standards | 2 | Journey (ECG) and Globe sections abandon the cardstock/oat system |
| 5 | Error Prevention | 3 | n/a |
| 6 | Recognition Rather Than Recall | 4 | n/a |
| 7 | Flexibility and Efficiency | 3 | Recruiter/Explorer toggle is good but not default |
| 8 | Aesthetic and Minimalist Design | 2 | Three heavy visual set-pieces + persistent chat bubble |
| 9 | Error Recovery | 4 | n/a |
| 10 | Help and Documentation | 4 | n/a |
| Total | | 31/40 | Good |

## Priority Issues
[P0] Chatbase widget auto-opens, blocks content, breaks mobile nav (3/10 links unreachable)
[P1] Mojibake bullet glyph on every Experience bullet (styles.css:826) - undetected by automated scan
[P1] Design-system fragmentation: Journey/Globe abandon One Voice palette
[P1] Mobile a11y: 92% of tap targets under 44x44px; keyboard skip-link unreachable as first Tab stop (IntroOverlay focus-restoration bug)
[P2] Unvetted AI-authored content cluster: mascot hero photo, redundant byline, verbatim job-description pull-quote, missing Testimonials
[P3] Self-violations of own DESIGN.md: gradient-clip intro monogram + dead .grad-text classes, TiltCard glare on Projects "articles not cards"

## What's Working
1. Accessibility care beyond checkbox compliance (3-layer reduced-motion, focus-trapped intro dialog, accessible globe fallback)
2. Evidence-forward writing (specific numbers, not adjectives)
3. Explorer/Recruiter mode toggle (real, working, localStorage-persisted)

## Anti-Patterns
Gradient-clip text on intro monogram (violates own DESIGN.md), TiltCard glare on Projects. Detector: 6 findings (gradient-text x3, broken-image x2 both false positives, layout-transition x1). Two sections in entirely different visual languages (Journey ECG, Globe).
