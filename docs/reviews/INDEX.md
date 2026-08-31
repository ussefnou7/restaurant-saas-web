# Review archive — layout width & schema-driven document lines

Working documents from the review line that ran 2026-08-21. Copied here from the claude.ai
project so agents working in this checkout can read them — their absence is why the independent
review's reconciliation section came back empty.

These are **working documents**, not decisions. Where they disagree with `DECISIONS.md`, the
decision record wins. Two decisions came out of this work and live there properly:
**D109** (layout width caps live on content elements; rendered-measurement verification standard),
**D110** (asset lines are immutable after creation), plus **D108** (a purchase return uses its
original line's UOM).

## Chronology

### Part 1 — Layout width

Started from "why is there so much white space", which turned out to be `max-width: 1080px` on the
page wrapper discarding 455px on every screen in the app.

| File | What it is |
|---|---|
| `PROMPT_LAYOUT_AUDIT.md` | The original audit brief, with the live measurements |
| `REVIEW_LAYOUT_AUDIT_2026-08-21.md` | Review of the audit — the `minmax(0, 1fr)` misreading |
| `REVIEW_PHASE2_2026-08-21.md` | Review of the width fix |
| `REVIEW_R1_R5_2026-08-21.md` | Review of the follow-ups |
| `REVIEW_PHASE21_PHASE3_2026-08-21.md` | Hub grid + horizontal scroll |
| `REVIEW_PHASE31_PHASE4_2026-08-21.md` | Table floors + the first dual-mode attempt |
| `PROMPT_PHASE5_PIN_ACTIONS.md` | Pin the actions column; remove the expanded mode |
| `REVIEW_PHASE5_2026-08-21.md` | Review of that |
| `VISUAL_TEST_RESULTS_2026-08-21.md` | First verification against rendered screenshots |

### Part 2 — Schema-driven lines and Form view

| File | What it is |
|---|---|
| `PROMPT_FORM_VIEW.md` | The feature brief — one schema, one hook, four documents |
| `REVIEW_FORM_VIEW_PHASE_A.md` | Review of the paper exercise; seven modeling gaps |
| `REVIEW_FORM_VIEW_PHASES_BD.md` | Review after B–D shipped past the gate |
| `REVIEW_VALIDATION_DIFF.md` | The validation diff that confirmed a dropped rule |
| `PROMPT_SOL_INDEPENDENT_REVIEW.md` | Brief for the independent reviewer |
| `PROMPT_REMEDIATION_ORDER.md` | Prioritised fix order from the 20 findings |
| `PROMPT_HOOK_CONTRACT_AND_WASTE.md` | Hook contract + first migration |
| `PROMPT_INVOICE_MIGRATION.md` | Second migration |
| `PROMPT_RETURNS_MIGRATION.md` | Third — the hardest |
| `PROMPT_ASSETS_MIGRATION.md` | Fourth, plus the two skipped i18n/RTL blocks |
| `PROMPT_FINAL_CLEANUP.md` | The closing pass |

`docs/reviews/INDEPENDENT_REVIEW_2026-08-21.md` is the independent review itself and was written
directly into the repo.

## Things worth carrying forward

Patterns that cost real time here, in case they recur:

- **`minmax(0, 1fr)` is not width protection** — the `0` is the minimum and the maximum is
  uncapped. Its mirror image, `minmax(200px, 300px)`, never grows toward the max; tracks size to
  content. Both were shipped as bugs in this work.
- **A passing build is not verification of anything visual or interactive.** This was offered as
  proof five times before a browser was found to be available all along.
- **A refactor silently reverts decisions.** `.asset-lines-table` stopped rendering, and three
  weeks of sticky-column and scroll CSS became inert while still looking correct in source.
- **Check that shared code has callers.** `useDocumentLines` was the design's entire justification
  and had zero for the length of a whole feature.
- **A selector edit is rarely local.** Four separate fixes intended for one place landed on shared
  selectors used app-wide.
- **Self-review has a specific blind spot** — reading intent as outcome. The independent review
  found the zero-caller hook that three prior review passes had missed.
