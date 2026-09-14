# CLAUDE.md

## Codex delegation policy

Codex runs on a constrained ChatGPT Plus quota. Every Codex call is a limited
resource — spend it only where a second model genuinely adds value.

### Invoke Codex only for

- **`/codex:review --background`** — before merging a non-trivial change.
- **`/codex:rescue`** — after two failed attempts on the same bug, not before.
- **Plan review** — for work touching auth, schema, migrations, concurrency,
  or payments.

### Never delegate to Codex

- Routine edits (copy changes, styling tweaks, renames, formatting).
- Anything verifiable in under a minute by reading the file, running the
  build, or checking the diff yourself.

### Batching

Batch reviews into a single pass over a complete change. Do not run Codex
per file, per commit, or on work still in progress.
