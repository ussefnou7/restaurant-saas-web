# Review — Phase 2.1 & Phase 3

> **Phase 4 is not authorized yet — but the gate is one console run, not another round trip.**
> Run §5 first. If the assets table passes, Phase 4 opens immediately.
> Two substantive defects: the hub root cause was never found (and the fix now hides it), and
> four of six line tables shipped an inert scroll wrapper.

---

## 1. Accepted

- **Playwright handled correctly.** `npm i -D playwright` failing on sandbox network isolation
  is a real constraint, it was stated up front rather than discovered in the report, and the
  manual-checklist path was the designated fallback in §6 of the last review. This is the
  right outcome.
- **Sticky column shape is correct** — `position: sticky` on `th`/`td` (not `tr`), opaque
  `--color-surface` background, `inset-inline-start` rather than `left`, inline-end edge
  treatment. Every constraint from OPEN-2 is present in the implementation.
- **R-4 answered properly**, and the answer matters more than the fix — see §2.

---

## 2. R-4's answer escalates the §4 trust problem

The resolution: `.list-stats-grid` (`list-system.css:56`) is a **flex container** holding
`.compact-stat-card` at `max-width: 200px`. So it was never at risk and needed no change.
Correct, and it closes R-4.

But look at what the audit's §4 claimed:

| Component | Authored `grid-template-columns` | Fluid? | file:line |
|---|---|---|---|
| `.list-stats-grid` | `repeat(4, 1fr)` | YES | `App.css:566` |

The real element is a flex container in a different file with no `grid-template-columns` at
all. That is not a shorthand name — §4 reported **a property value the element does not have,
at a file and line where it does not live**.

Two earlier items were closed against different selectors than raised, each explained as an
audit shorthand. This is the third, and it is a different category: an invented value, not a
loose name.

**Consequence, stated without drama:** §4 and §5 are inventories produced by reading, and at
least one row was wrong in every field. "Re-verified selector mapping across Sections 4 & 5"
is now itself an assertion of the same kind that just failed. Phase 4 will lean on §5's table
inventory. Before it does, §5 needs to be re-derived **from the stylesheets**, with the
verifying command or grep shown — not restated.

---

## 3. The hub defect: symptom fixed, cause never found

The question from the last review was specific: with ~368px of trailing space and a 280px
minimum, why did `auto-fit` not create a fourth track?

The answer given is that `@media (max-width: 1024px)` overrides were removed. **A
`max-width: 1024px` media query cannot apply at a ~1470px container.** It was not the cause.
The cause is still unidentified.

And the new rule **conceals** it. With `minmax(280px, 1fr)` and `justify-content: stretch`,
tracks expand to fill whatever space exists — so the trailing gap disappears **whether or not
the track count is right**. If something is still forcing three tracks, the page now renders
three cards at ~482px each instead of four at ~351px. The dead space is gone; the bug is not.

The predicted "3-up / 4-up / 6-up" is spec-computed — the same method, on the same selector,
that was falsified last round. It is a hypothesis, not a result. §5's script settles it in one
line: **if `trackCount` reads 4 at a ~1470px container, this is genuinely fixed.**

Minor, separate: removing the `max-width: 1024px` overrides also changes tablet and mobile
behavior, which was not in scope. `auto-fit` should degrade correctly on its own (2-up at
~768px, 1-up at ~400px), but it is an unrequested behavior change and belongs in the report.

---

## 4. Phase 3: four of six line tables ship an inert wrapper

`min-width: 900px` was applied to `.pi-form-lines-table` and `.asset-lines-table`. The audit's
own §5 lists **six** document line tables:

| Table | `min-width` applied? |
|---|---|
| Asset lines | yes |
| Purchase invoice lines | yes |
| Purchase return lines | **no** |
| Transfer lines | **no** |
| Physical count lines | **no** |
| Waste document lines | **no** |

If `DocumentLinesCard` is shared across these pages, all six now have a `.table-wrap` with
`overflow-x: auto`. Four of them have no `min-width`, are still `table-layout: fixed`, and
therefore **still never overflow**. Those four shipped exactly the dead feature A-5 was written
to prevent — the wrapper is there, the scrollbar never appears.

Confirm whether those four use `DocumentLinesCard`. If they do, they need the same treatment.
If they don't, say so and note they still lack a wrapper entirely.

### And 900px is not "tuned per table"

A-5 said the floor comes from the point each table's columns begin truncating — explicitly
*not* one number copied across. The same 900px went onto a **7-column** table (asset lines) and
an **8-column** table (purchase invoice lines: material, qty, UOM, cost, discount, tax, total,
actions). At 900px that invoice table gives ~112px per column, which is below readable for a
material name — so it will truncate *before* it scrolls, which is the failure the floor exists
to prevent.

Give each table its own number, derived from its column count and its widest realistic content.

---

## 5. Verification — run this, it closes most of the checklist

A browser was unavailable to Flash. One is available here. This does automatically what the
manual checklist does by hand.

### 5.1 — On a module hub page (`/inventory`)

```js
(() => {
  const g = document.querySelector('.hub-nav-card-grid');
  if (!g) return console.warn('hub grid not found');
  const s = getComputedStyle(g);
  console.table([{
    width: Math.round(g.getBoundingClientRect().width),
    parentWidth: Math.round(g.parentElement.getBoundingClientRect().width),
    trackCount: s.gridTemplateColumns.trim().split(/\s+/).length,
    tracks: s.gridTemplateColumns,
    justifyContent: s.justifyContent,
    maxWidth: s.maxWidth,
  }]);
})();
```

`trackCount` is the whole answer. At a ~1470px container it must read **4**. If it reads 3,
§3's hidden bug is real and the cards are oversized.

### 5.2 — On each document page (asset detail, purchase invoice, transfer, physical count, waste, purchase return)

```js
(() => {
  const rows = [];
  document.querySelectorAll('table[class*="lines-table"]').forEach(t => {
    const wrap = t.closest('.table-wrap');
    const ts = getComputedStyle(t);
    const cell = t.querySelector('tbody td:first-child') || t.querySelector('th:first-child');
    const cs = cell && getComputedStyle(cell);
    rows.push({
      table: t.className.split(/\s+/).find(c => c.includes('lines-table')) || t.className,
      wrap: wrap ? 'yes' : 'MISSING',
      overflowX: wrap ? getComputedStyle(wrap).overflowX : '-',
      tableLayout: ts.tableLayout,
      minWidth: ts.minWidth,
      scrollW: wrap ? wrap.scrollWidth : 0,
      clientW: wrap ? wrap.clientWidth : 0,
      scrolls: wrap ? (wrap.scrollWidth > wrap.clientWidth + 1 ? 'YES' : 'NO — INERT') : '-',
      stickyPos: cs ? cs.position : '-',
      stickyBg: cs ? cs.backgroundColor : '-',
    });
  });
  console.table(rows);
})();
```

Two failure signatures to watch for:

- `scrolls: NO — INERT` at a **narrow** window — the wrapper is decorative. Resize to ~1280px
  or narrower before trusting a `YES`; Phase 2 widened these tables, so overflow now only
  appears at narrow viewports.
- `stickyBg: rgba(0, 0, 0, 0)` — the background token did not resolve, and scrolled content
  will render straight through the pinned column.

### 5.3 — RTL horizontal scroll, the highest-risk item

Flash asserts the column stays pinned to the right edge under RTL. That claim has no browser
behind it. This tests it, and simultaneously reveals which `scrollLeft` convention the engine
uses:

```js
(() => {
  const wrap = document.querySelector('.table-wrap');
  const cell = wrap.querySelector('tbody td:first-child');
  const max = wrap.scrollWidth - wrap.clientWidth;
  if (max < 2) return console.warn('not scrollable — narrow the window first');
  const before = cell.getBoundingClientRect().x;
  wrap.scrollLeft = -max;
  if (wrap.scrollLeft === 0) wrap.scrollLeft = max;   // engines differ in RTL
  requestAnimationFrame(() => {
    const after = cell.getBoundingClientRect().x;
    console.log(
      'dir:', document.documentElement.dir,
      '| scrollLeft convention:', wrap.scrollLeft < 0 ? 'negative (spec)' : 'positive (legacy)',
      '| scrollable:', max,
      '| sticky held:', Math.abs(after - before) < 2 ? 'YES' : 'NO — drifted ' + Math.round(after - before) + 'px'
    );
    wrap.scrollLeft = 0;
  });
})();
```

Run it under **both** Arabic and English. `sticky held: NO` under one direction only is the
classic RTL failure.

---

## 6. Gate

**Phase 4 is authorized the moment 5.1 and 5.2 pass on the assets table**, since the pilot is
scoped to assets and does not depend on the other five documents. Nothing else blocks it.

Carry forward as Phase 3.1, in parallel with Phase 4:

1. Find the actual hub track-count cause if 5.1 reads 3 (§3).
2. `min-width` for the four remaining line tables, each tuned to its own column count (§4).
3. Re-derive §5 from the stylesheets, showing the command used (§2).
4. Re-issue the 900px figures for the two tables already done (§4).

One note for Phase 4 itself: the expanded-row panel must stay pinned to the visible width when
the table is scrolled horizontally — that requirement was written before this table had a
scroll container, and now that it has one, that interaction is real rather than hypothetical.
It is the part most likely to be got wrong, so design it first, not last.
