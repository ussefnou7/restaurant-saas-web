# PROMPT — Layout width audit + dual-mode line editor

> For the agent picking this up (**Flash**). Companion docs: [PROJECT](../PROJECT.md),
> [CONVENTIONS](../CONVENTIONS.md), [DECISIONS](../DECISIONS.md), [REVIEW](../REVIEW.md).
> Target repo: **`restaurant-saas-web`**. Backend is read-only context here — no backend
> change is expected or authorized by this prompt.

---

## 0. What this is

Two related pieces of work, in strict order, with a human gate between each phase:

1. **Phase 1 — Audit.** Find the real, system-wide cause of the wasted horizontal space and
   report it. No code changes.
2. **Phase 2 — Width fix.** Apply the fix the audit justifies.
3. **Phase 3 — Horizontal scroll** on document line tables.
4. **Phase 4 — Dual-mode line editor** (Fixed Assets only, as a pilot).

**Do not start Phase 2 until the Phase 1 report is reviewed and approved by a human.**
Same gate before 3 and before 4. Each phase ends with you stopping and reporting, not with
you moving on.

---

## 1. Evidence already collected — do not re-derive this

Measured live in the browser on the **asset detail** screen (`/assets/:id`), viewport
`1854px`, Chrome, `dir="rtl"`, Arabic locale. Trust these numbers; they are the starting
point, not a hypothesis.

### Ancestor chain (walking up from the card)

| Element | rendered | max-width | margin-inline | padding-inline | display |
|---|---|---|---|---|---|
| `body` | 1854 | none | 0 / 0 | 0 / 0 | block |
| `div` | 1854 | none | 0 / 0 | 0 / 0 | block |
| `div.app-shell` | 1854 | none | 0 / 0 | 0 / 0 | flex |
| `main.main-content` | **1614** | **none** | 0 / 0 | **32px / 32px** | block |

Sidebar = `1854 − 1614 = 240px`. **`main` is fully fluid and already correct** — it has no
cap and consumes all available width. Usable inner width = `1614 − 64 = 1550px`.

### Descendant chain (walking down from `main`)

| depth | Element | rendered | max-width | margin-inline | gridCols |
|---|---|---|---|---|---|
| 0 | `main.main-content` | 1614 | none | 0 / 0 | none |
| 1 | `div.page.list-page.purchase-invoice-form-page.purchase-invoice-form-page--redesign.asset-detail-page` | **1080** | **1080px** | **227.5px / 227.5px** | none |
| 2 | `form.pi-form` | 1080 | none | 0 / 0 | none |
| 3 | `section.pi-form-header-card` | 1080 | none | 0 / 0 | none |
| 4 | `div.pi-form-header-grid` | 1046 | none | 0 / 0 | `340.656px 340.672px 340.656px` |
| 2 | `section.pi-form-lines-card` | 1080 | none | 0 / 0 | none |
| 3 | `table.data-table…asset-lines-table` | 1078 | 100% | 0 / 0 | none |

### The two source rules

```
.page       →  max-width: 1160px
.list-page  →  max-width: 1080px      ← wins (later in source order, equal specificity)
```

### What this means, stated plainly

- The cap is on the **page wrapper**, one level below `main`. It is **not** on `main`, not on
  the shell, not on the table.
- `227.5 × 2 = 455px` of usable width is discarded on **every screen in the app**, because
  `.page` and `.list-page` are base classes present on every route.
- The caps are **inverted relative to need**: `.list-page` (1080px), which is where the data
  tables live, is *narrower* than `.page` (1160px). Table screens are the ones that benefit
  most from width, and they are the ones penalized most.
- **The field grid is innocent.** `340.656 / 340.672 / 340.656` inside a `1046px` container
  with two `12px` gaps is the computed output of `repeat(3, 1fr)`. The sub-pixel fractions are
  the fingerprint of `fr`, not of an authored `px` value. It is already fluid and will expand
  on its own once the cap is lifted. Do not "fix" it as if it were hardcoded.
- **Class-stack pollution.** The asset detail page wears `list-page` *and*
  `purchase-invoice-form-page` *and* `purchase-invoice-form-page--redesign` *and*
  `asset-detail-page` simultaneously. Three different page archetypes on one element. This is
  a copy-paste artifact from building the Assets screen off the purchase-invoice form, and it
  violates the BEM convention in `CONVENTIONS.md`. It is why an asset screen inherited a width
  cap designed for an invoice form.

---

## 2. Phase 1 — Audit (no code changes)

### 2.1 Width and layout inventory

- Every `max-width`, `width`, `min-width` in the CSS that lands on a **page-level or
  card-level** container. For each: selector, value, `file:line`, and which routes it affects.
- Every page archetype class (`.page`, `.list-page`, `.*-form-page`, …). Which routes use
  which, and which routes stack more than one. Flag every stacked/contradictory combination
  the way the asset detail page does.
- Every **field grid** (`grid-template-columns` on a form/card grid). Report the authored
  value, not the computed one. Say explicitly whether it is `fr`-based, `minmax`-based, or
  authored in `px`. Count how many are already fluid vs. genuinely fixed.
- Every **data table**: does it have a scroll container, `table-layout`, per-column widths,
  a sticky column, `overflow` anywhere on an ancestor.

### 2.2 Answer these questions explicitly

1. Is the cap a deliberate readability decision applied at the wrong layer, or is it accidental
   inheritance? Look at git history/blame on the rules — say which, with evidence.
2. Which routes would visibly **improve** if the cap were lifted, and which would look
   **loose/broken**? Enumerate them by route. This is the single most useful output of the
   audit — the CSS change is two lines; knowing what it breaks is the actual work.
3. Are there components that *rely* on the 1080px cap (fixed-px children, absolutely positioned
   overlays, charts with a fixed aspect ratio, anything with a hardcoded `px` width that would
   stop centering correctly)?
4. Does anything break under `dir="rtl"` specifically when the page goes fluid? Check for
   hardcoded `left`/`right` instead of logical properties, per `CONVENTIONS.md`.
5. How many distinct places would need to change for a system-wide fix — one base stylesheet,
   or N per-feature files?

### 2.3 Recommend the fix

Two candidate directions. **You decide which, based on what you actually find** — the
human explicitly deferred this call to the audit.

- **Direction A — move the cap to the right layer.** Page containers go fluid
  (`max-width: none; margin-inline: 0`), and the cap moves onto the field grids
  (`repeat(auto-fit, minmax(260px, 420px))`), so a wider viewport adds *columns* rather than
  widening existing fields. Fixes the root cause; more call sites to touch.
- **Direction B — raise the caps.** `.list-page` becomes `min(1600px, 100%)`, `.page` stays.
  Two lines, low risk, but substitutes one magic number for another and leaves the inversion
  conceptually unresolved.

State your recommendation, the reasoning, the blast radius, and the rollback. If neither fits
what you found, propose a third and say why.

### 2.4 Method notes

- Derive everything by **reading the CSS**, not by eyeballing screenshots.
- Prefer counting to adjectives: "23 page-level `max-width` declarations across 9 files" beats
  "widths are inconsistent."
- When a finding repeats, report it once as a pattern with a count and one representative
  `file:line`; put the full list in an appendix.
- If the problem is smaller than this prompt assumes, say so plainly and keep the report short.
  Do not manufacture findings to fill sections.

### 2.5 Deliverable

Write **exactly one** file: `docs/reviews/LAYOUT_AUDIT_<YYYY-MM-DD>.md` in
`restaurant-saas-web`. Nothing else in the repo may change in Phase 1.

```
# Layout width audit — <date>

## 0. Repo access
What was readable, at which paths. Anything you could not read.

## 1. Executive summary
Max 10 lines. Written for someone who reads nothing else.

## 2. Width inventory
| Selector | Value | file:line | Routes affected | Verdict |

## 3. Page archetype map
| Route | Page classes on the wrapper | Archetype conflict? | Notes |

## 4. Field grid inventory
| Component | Authored grid-template-columns | Fluid? | file:line |

## 5. Data table inventory
| Table | Scroll container? | table-layout | Sticky col? | file:line |

## 6. Findings
| ID | Severity | Area | file:line | Finding | Why it matters | Fix sketch |
(F-01, F-02, …; Severity ∈ block | warn | nit per REVIEW.md; Area ∈ layout | rtl | naming | a11y)

## 7. Impact of lifting the cap
| Route | Improves / Degrades / Neutral | Why |

## 8. Recommendation
Direction A, B, or your own. Reasoning, blast radius, rollback.

## 9. Open questions
OPEN-1, … Each: the question, why the code can't answer it, options with trade-offs.
```

**Then stop.** Do not proceed to Phase 2.

---

## 3. Phase 2 — Apply the width fix

Only after the report is approved and a direction is chosen.

- Implement it. Keep the diff minimal and reviewable.
- Clean the class-stack pollution on the asset detail page as part of this phase: it should not
  be wearing `purchase-invoice-form-page*`. Give it its own block, or a shared archetype class
  that honestly describes it.
- Verify visually across **every** route touched, at three viewports: `1280`, `1920`, `2560`.
  Under **both** `dir="ltr"` and `dir="rtl"`, and both locales.
- Report anything that regressed, before anyone asks.

---

## 4. Phase 3 — Horizontal scroll on line tables

The human has explicitly accepted that a line row does **not** need to show all its fields at
once. What it must have instead:

- A horizontal scroll container around the lines table so hidden columns are reachable.
- Scroll must work correctly under `dir="rtl"`. This is the part that usually breaks — RTL
  `scrollLeft` semantics differ across engines, and any JS that reads or sets it must be
  direction-aware. Test it, don't assume it.
- Consider a **sticky first column** (the البند / item column) so the row stays identifiable
  while scrolling. Treat this as a proposal, not a mandate — raise it as an open question with
  a recommendation rather than silently shipping it.
- The scroll container must not swallow the page's vertical scroll, and must not clip
  dropdowns/date pickers that overflow the row.

---

## 5. Phase 4 — Dual-mode line editor (Fixed Assets pilot)

Scope: **asset lines only** (`asset-lines-table`). Do not generalize to purchase invoices,
returns, physical counts, or waste in this pass. Per D13, build the concrete thing first; the
shared abstraction is justified only once a second caller actually exists.

### 5.1 The requirement

The same set of lines must be workable in **two modes**, both available at the same time, and
the user chooses per-line which one they want:

**Grid mode (existing, keep it).** The inline table row. Optimized for entering data fast,
line after line, without leaving the keyboard. This is the mode that must not get slower or
more awkward — it is the reason the table exists.

**Expanded mode (new).** Clicking a line **expands it in place** — an accordion row directly
beneath the table row it belongs to, laid out as a field grid like the header card, showing
**all** of the line's fields. The user edits inside the expanded panel and collapses it when
done. The rest of the table stays visible above and below.

Creating a line must be possible **either way**: quick-add straight into the grid, or an
"add line" action that opens a new line directly in expanded mode with every field present.

### 5.2 Design constraints — read before writing code

- **Markup validity.** An expanded panel inside a `<table>` must be a `<tr>` whose single
  `<td>` spans all columns via `colspan`. Anything else produces invalid table markup and
  unpredictable layout. If that proves too constraining, converting the table to CSS grid is a
  legitimate alternative — but it is a real decision with accessibility consequences, so raise
  it as an open question rather than deciding it silently.
- **Interaction with horizontal scroll (Phase 3).** When a row is expanded and the user scrolls
  the table horizontally, the expanded panel must not slide out of view. It should stay pinned
  to the visible viewport width. This is the subtle part of the feature — design for it up
  front, don't retrofit it.
- **Keyboard.** Tab order must remain sane when a row is expanded: tabbing through the
  expanded panel then continuing into the next row, not jumping back to the top. Expand and
  collapse must be keyboard-reachable, not click-only.
- **One at a time?** Decide whether multiple rows may be expanded simultaneously. Recommend one
  and say why.
- **Unsaved state.** Define what happens when a user edits inside an expanded panel and
  collapses without saving, and when they expand a row that has unsaved grid-mode edits.
- **Accessibility.** The expand control needs `aria-expanded` and a translated accessible
  label. The panel needs to be associated with its row.

### 5.3 Conventions — non-negotiable, from `CONVENTIONS.md`

- Plain CSS, BEM (`block`, `block__element`, `block--modifier`). No CSS-in-JS, no utility
  framework.
- Colors and spacing via `--color-*` custom properties only. No hardcoded hex.
- Icons from `lucide-react`, outline set.
- Zero hardcoded user-facing strings. Every key added to **both** `src/i18n/locales/en/` and
  `src/i18n/locales/ar/`. Key parity is checked.
- Logical CSS properties (`inline-start`/`inline-end`), never hardcoded `left`/`right`.
- Backend errors surface only through `translateApiError`. Never render the server `message`.

### 5.4 Deliverable

Working component + the routes wired to it. Then a short implementation note appended to the
audit report: what you built, what you decided on each open question in 5.2, and what you
deliberately left for the generalization pass.

---

## 6. Severity model (from `REVIEW.md`)

- **block** — violates a hard invariant or a documented decision; ships a security/data
  problem; or makes the follow-up phases impossible without rework.
- **warn** — real divergence from convention that will have to be fixed, but nothing is broken
  right now.
- **nit** — cosmetic or preference-level; safe to defer indefinitely.

Sort findings by severity, then by area.

---

## 7. Things that would make this go wrong

- Re-deriving Section 1 instead of trusting it, and burning the budget re-measuring.
- "Fixing" the field grid as if it were hardcoded `px`. It is `1fr`. It is fine.
- Lifting the cap globally without the per-route impact table, then discovering breakage in
  review.
- Building the shared line component for all five document types in this pass. Assets only.
- Silently deciding an open question from 5.2 instead of surfacing it.
- Touching the backend. Nothing here needs it.
