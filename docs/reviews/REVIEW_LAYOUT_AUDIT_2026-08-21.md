# Phase 1 review — LAYOUT_AUDIT_2026-08-21

> Human-side review of Flash's audit. **Verdict: approved with amendments.**
> The inventory is sound and Direction A is the right call. One premise is wrong, and it
> propagates into three internal contradictions that would ship visible regressions if
> Phase 2 were implemented exactly as written.
> Phase 2 is authorized **only** with the amendments in §3–§5 applied.

---

## 1. What the audit got right — accepted without change

- **F-01 root cause.** Confirmed and consistent with the live measurements: the cap sits on
  the page wrapper one level below `main.main-content`; `.list-page` (1080px) wins over
  `.page` (1160px); 455px discarded per screen. Locating it in `list-system.css:4` and
  `App.css:507`, and identifying `<ListPage>` as the emitter of `page list-page`, is the
  useful finding — it explains why this is system-wide rather than per-page.
- **The inverted-cap observation**, now extended: `.list-page` (1080px) also silently overrides
  `.reports-page` (1280px). Report tables — the widest content in the app — are the most
  penalized. That is worse than originally suspected.
- **F-02 class-stack pollution**, traced to `AssetDetailPage.tsx:302`. Correct, and correctly
  scoped to Phase 2.
- **F-04 RTL `text-align: left/right`** in `inventory.css:1617`. Genuine convention violation,
  independently worth fixing.
- **Direction A over Direction B.** Correct reasoning: B substitutes one magic number for
  another and leaves the architectural inversion unresolved.
- **Section 5 table inventory** is the most valuable table in the report — see §5 below, it
  contains a Phase 3 blocker the audit did not recognize as one.

---

## 2. The wrong premise

The audit states, in §4 NOTE and again in §8:

> "All field grids … are authored using CSS `fr` units … They are 100% fluid and will expand
> naturally as soon as the outer page cap is removed."
>
> "Form fields … are ALREADY protected by `fr`-based grid rules (`repeat(3, minmax(0, 1fr))`
> …), so lifting page caps allows data tables and document forms to go fluid immediately
> **without distorting form inputs**."

**`minmax(0, 1fr)` is not a width protection.** In `minmax(min, max)`, the `0` is the
*minimum*. It is the standard idiom for letting a grid item shrink below its `min-content`
size so long values don't force overflow. The *maximum* is `1fr` — an equal share of all
remaining space, with **no ceiling**.

So the grids are fluid, correctly — but "fluid" is precisely the problem once the page cap is
gone. Columns grow without limit.

### The arithmetic

Usable width inside `main` = `viewport − 240 (sidebar) − 64 (padding)`. Subtracting ~24px of
card padding and 12px gaps:

**`repeat(3, minmax(0, 1fr))`** — header cards, `.field-grid`, all four document header grids:

| Viewport | Width per field |
|---|---|
| 1080px (today, capped) | ~340px ✓ |
| 1920px | **~515px** |
| 2560px | **~729px** |

**`repeat(2, minmax(0, 1fr))`** — `.field-grid--2col`, entity detail pages:

| Viewport | Width per field |
|---|---|
| 1200px (today, capped) | ~580px |
| 1920px | **~779px** |
| 2560px | **~1099px** |

A 729px text input for a branch name, or a 1099px input for an employee's job title, is not a
neutral outcome. This is the exact failure mode the original page cap existed to prevent —
the audit correctly identifies that the cap is at the wrong *layer*, then omits the other
half of Direction A: **moving it to the right layer.**

---

## 3. Three contradictions this produces

### C-1 — §7 marks entity detail routes "Neutral"; they would degrade

> `/users/:id`, `/hr/employees/:id`, `/orders/:id`, `/branches/:id`,
> `/inventory/warehouses/:id` → *Neutral — "Form fields remain protected by
> `repeat(2, minmax(0, 1fr))`."*

They are not protected — see the 2-column table above. These are the most form-dominant,
least table-dominant screens in the app, and they are the ones where a page cap is genuinely
justified.

**Amendment: `.entity-detail-page` keeps its 1200px cap.** Do not remove it. It is the one
entry in F-01's list that does not belong there.

### C-2 — §7 marks module hubs "Neutral"; the cited mechanism does not exist

> `/dashboard`, `/sales`, … → *"Module hubs expand cleanly; grid cards auto-flow from 3 to 4
> columns on wide screens."*

The audit's own §4 records `.hub-card-grid` as `repeat(3, minmax(0, 1fr))` at `hub.css:93`.
That is a **fixed three-column** grid. It cannot flow to four columns. Lifting the cap produces
three ~500px cards, not four normal ones.

**Amendment: the claimed behavior requires changing the grid.** See §4.

### C-3 — §8 "without distorting form inputs" is unsupported

Direct consequence of §2. Every "Improves" verdict in §7 for a screen with a header card is
partly wrong: the *table* half improves, the *field grid* half degrades. Several rows in §7
are net-positive-but-mixed, not clean wins.

**Amendment: §7 should be re-issued after Phase 2 as measured, not asserted.** As written it
is a static-analysis prediction with no rendering behind it.

---

## 4. Phase 2 — amended scope

Direction A, both halves. Page containers go fluid **and** the cap relocates to the field
grids.

```css
/* 4.1 — page containers go fluid */
.page,
.list-page,
.reports-page {
  max-width: none;
  width: 100%;
  margin-inline: 0;
}

/* .entity-detail-page is fluid; the overview/form panel inside it carries the max-width (D109 narrowed). */

/* 4.2 — the cap relocates onto the field grids.
   auto-fit adds COLUMNS as width grows; the 420px ceiling stops any single
   field from becoming an unusable slab. justify-content:start parks the
   leftover space at the inline end instead of stretching tracks. */
.pi-form-header-grid,
.transfer-header-grid,
.physical-count-header-grid,
.waste-document-header-grid,   /* all four share inventory.css:852 — one rule */
.field-grid,
.field-grid--2col,
.field-grid--3col {
  grid-template-columns: repeat(auto-fit, minmax(260px, 420px));
  justify-content: start;
}

/* 4.3 — hub cards need auto-fit for the 3→4 reflow §7 already promised (C-2) */
.hub-card-grid {
  grid-template-columns: repeat(auto-fit, minmax(280px, 360px));
  justify-content: start;
}
```

### Notes on 4.2

- `--2col` / `--3col` modifiers become **floors, not ceilings**, under `auto-fit`. Confirm
  that is acceptable at each call site; if some card must stay exactly 2-up regardless of
  width, it needs its own rule rather than the shared one. **Flag any such case rather than
  assuming.**
- Watch the **2-field card** edge case: two fields under `auto-fit` sit at 420px each with the
  remainder at the inline end. That is the intended result, but eyeball it — an isolated pair
  floating in a wide card can read as unfinished. If it does, that card wants a narrower
  container, not a wider grid.
- Side effect worth having: the asset detail header card's 4 fields land on **one row** at
  ≥1920px instead of `3 + 1 orphan`. That orphan was the original visual complaint.

### Also in Phase 2

- F-02 class-stack cleanup at `AssetDetailPage.tsx:302`, as the audit proposes.
- F-04 `text-align: left/right` → `start/end` at `inventory.css:1617`.

### Verification — required, not optional

Every route in §7, at **1280 / 1920 / 2560**, under **both** `dir="rtl"` + Arabic and
`dir="ltr"` + English. Re-issue §7 with measured verdicts. Report regressions before being
asked.

---

## 5. Phase 3 blocker the audit surfaced but did not name

§5 records, for every document lines table:

```
Scroll container?  No        table-layout: fixed
```

**A `table-layout: fixed` table at `width: 100%` never overflows its container.** Columns
redistribute inside the available width instead. Wrapping it in `overflow-x: auto` therefore
produces *no scrollbar and no scrolling* — the feature would silently do nothing.

Phase 3 must create the overflow before it can scroll it:

```css
.pi-form-lines-table,
.asset-lines-table {
  min-width: 900px;   /* tune per table — the floor below which columns stop being readable */
}

.document-lines-card .table-wrap {
  overflow-x: auto;
  overscroll-behavior-x: contain;   /* don't hijack the page's scroll chain */
}
```

`min-width` is what makes the table wider than its wrapper on narrow viewports, which is what
gives `overflow-x` something to do. Pick the value per table from the point at which its
columns start truncating — do not copy one number across all five.

Related: **F-05 is misgraded as `nit`.** A missing `.table-wrap` on `DocumentLinesCard` is not
cosmetic; it is the prerequisite for an accepted requirement. Regrade to **`warn`** and treat
it as the entry point for Phase 3, not as deferrable polish.

---

## 6. Answers to the open questions

### OPEN-1 — `.module-hub` cap → **go fluid, with the C-2 fix attached**

Approved, conditional. Removing `max-width` from `.module-hub` alone gives three oversized
cards. It is only correct when shipped together with the `.hub-card-grid` change in §4.3.
Do not land one without the other.

### OPEN-2 — sticky first column in Phase 3 → **yes, implement it**

Approved. It is the difference between a scrollable table and a usable one — without it the
user scrolls right and loses track of which line they are editing.

Implementation constraints:

```css
.asset-lines-table th:first-child,
.asset-lines-table td:first-child {
  position: sticky;
  inset-inline-start: 0;
  z-index: 2;
  background: var(--color-surface);   /* REQUIRED — see below */
}
```

- **An opaque background is mandatory.** A transparent sticky cell lets the scrolled content
  render underneath it. Use a `--color-*` token, never a literal.
- `position: sticky` must be on the `<th>` / `<td>` itself. It does not work on `<tr>`.
- `inset-inline-start` resolves to `right` under RTL — correct, and the reason to use the
  logical property rather than `left`.
- If `thead` is also sticky, the top-left cell needs a higher `z-index` than both axes or it
  will be overlapped at the intersection.
- Add a border or shadow on the sticky column's inline-end edge so the seam reads as a pinned
  column rather than a rendering artifact.

---

## 7. Summary of amendments

| # | Amendment | Origin |
|---|---|---|
| A-1 | `.entity-detail-page` keeps its 1200px cap — remove it from F-01's target list | C-1 |
| A-2 | Field grids get `repeat(auto-fit, minmax(260px, 420px))` + `justify-content: start`; page fluidity alone is half of Direction A | §2 |
| A-3 | `.hub-card-grid` → `auto-fit`, shipped together with the `.module-hub` uncap | C-2, OPEN-1 |
| A-4 | §7 impact table re-issued as measured results at 3 viewports × 2 directions | C-3 |
| A-5 | Phase 3 requires `min-width` on line tables; `overflow-x` alone is inert under `table-layout: fixed` | §5 |
| A-6 | F-05 regraded `nit` → `warn`; it is the Phase 3 entry point | §5 |
| A-7 | Flag any call site that must stay exactly 2-up or 3-up under `auto-fit` rather than assuming | §4 |

Phase 2 is authorized with A-1 through A-7 applied. Phase 3 remains gated on Phase 2 review.
