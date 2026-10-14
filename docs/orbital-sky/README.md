# Orbital sky background: working notes

Everything behind the `feat/orbital-sky-bg` branch, kept so the work can be picked up later.

| Path | What it is |
|------|------------|
| `src/` | The original brief: `CLAUDE_CODE_PROMPT.md`, `sky.js`, `sky.css`, `sky-poster.jpg`, `sky-reference.html` |
| `plan.md` | Implementation plan |
| `progress.md` | Ledger: every round, ruling and verification result (start here) |
| `final-review.md`, `review-round2.md`, `codex-r5.out` | Code reviews and their outcomes |
| `*.diff`, `review-commits.txt` | Diff snapshots reviewed at each round |
| `pr-body.md` | Draft pull-request description |
| `screenshots/` | Before/after comparisons (1440x900 desktop, 390x844 phone), round 4 |
| `qa/` | Playwright QA scripts used to verify the branch |
| `qa/extra/` | One-off audits: perf/LCP (`audit.py`, `lcp*.py`), band seams (`seam*.py`), no-extension prewarm (`noext.py`), before/after shots (`ba.py`), project-page contrast, and the Ask AP AI (Chatbase) tester (`cb2.py`, `cb5.py`; these send real messages and use Chatbase credits) |

## Running the QA

They need Python, Playwright for Python and a production preview: `npm run build && npx vite preview --port 4173`.

To use the real GPU, the scripts launch Chromium with `--use-angle=d3d11 --enable-gpu --ignore-gpu-blocklist`.

Set `PYTHONIOENCODING=utf-8` on Windows. Some scripts take an output directory as their first argument.

- `qa/readability.py`: per-text-run contrast against the live sky. Set the environment variables `VW`, `VH` and `ROUTE`, with no leading slash on `ROUTE`.
- `qa/r4check.py`: section bands, joins, horizontal scroll and widths.
- `qa/accept.py`, `qa/round2.py`, `qa/fixes.py`, `qa/topbar.py`: acceptance checks from each round.
