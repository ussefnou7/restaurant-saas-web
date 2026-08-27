# Phase 2 review — width fix

> **Verdict: accepted in substance. Phase 3 is NOT yet authorized.**
> The amendments were implemented correctly where the summary is specific. But the
> verification claim does not hold, and four coverage items are unaccounted for.
> Close R-1 through R-5 below, then Phase 3 opens.

---

## 1. Accepted

- **A-1 honored.** `.entity-detail-page` retained at 1200px. This was the amendment most likely
  to be steamrolled by the "remove all caps" framing, and it wasn't. Good.
- **A-2 implemented as specified** — `repeat(auto-fit, minmax(260px, 420px))` +
  `justify-content: start`. The stated outcome checks out arithmetically: at a 1920px viewport,
  usable card width ≈ 1570px, minus 36px of gaps = 1534px ÷ 4 = **383.5px per track**, inside
  the `[260, 420]` band. The 4-field asset header card does land on one row, and each field
  stays a sane width. At 1280px it correctly falls back to 3 + 1 — expected, not a regression.
- **`.order-consumption-detail__header-grid`** was not in the audit's §4 inventory and was
  picked up anyway. That is a real catch beyond the brief.
- **F-02 and F-04** cleaned as scoped.

---

## 2. R-1 — the verification claim does not hold (blocking)

> "**Verification:** Successfully validated with `npm run build` (0 TypeScript errors,
> 0 ESLint errors)."

A green build proves nothing about this change. TypeScript does not type-check `max-width`;
ESLint does not render a grid. This change is **entirely** visual, and the build would have
passed identically had every rule been written wrong.

Item 8 then claims:

> "Updated `LAYOUT_AUDIT_2026-08-21.md` with the re-issued Section 7 impact table and
> **measured verdicts** across 1280px, 1920px, and 2560px viewports in both RTL and LTR."

Those two statements are in tension. If the only verification run was `npm run build`, then
§7 was re-issued from static inference a second time — which is precisely the defect that
amendment A-4 existed to correct.

**Required before Phase 3 — the evidence, not the verdicts:**

- **How** the measurement was taken. Headless browser? Playwright? Manual? Name the mechanism.
- For a representative route per archetype — asset detail, a list page, a report, a module hub,
  an entity detail — a dump of **computed** values at each of 1280 / 1920 / 2560:
  the page wrapper's rendered width, the header grid's `grid-template-columns`, and the
  resulting per-field width. The same shape of data the original diagnosis was built from.
- Screenshots for the RTL pass, if a browser was in the loop.

If no browser was available, say so plainly and mark §7 **unverified**. An honest "not
measured" is worth more than a confident table — an unverified §7 that reads as verified is
worse than no §7, because it closes a question that is still open.

---

## 3. Coverage gaps

### R-2 — `.hub-card-grid` vs `.hub-nav-card-grid`

Amendment A-3 targeted `.hub-card-grid` (`hub.css:93`), which the audit's own §4 recorded as
`repeat(3, minmax(0, 1fr))`. The Phase 2 summary reports updating **`.hub-nav-card-grid`** —
a different selector.

Either the audit misnamed it, or there are two hub grids and only one was fixed. If
`.hub-card-grid` is still `repeat(3, minmax(0, 1fr))` now that `.module-hub` is uncapped, its
cards render at ~744px on a 2560px viewport. **Confirm which, and cover both if both exist.**

### R-3 — the three document header grids

A-2 listed `.transfer-header-grid`, `.physical-count-header-grid`, and
`.waste-document-header-grid`. The audit stated all four share `inventory.css:852`, so a single
grouped rule would cover them — but the Phase 2 summary names only `.pi-form-header-grid`.

**Confirm it was one grouped selector.** If they were separate rules, transfers, physical
counts, and waste documents still have unbounded `1fr` fields on wide screens.

### R-4 — `.list-stats-grid` was never addressed

`App.css:566` — `repeat(4, 1fr)`. It appears in the audit's §4 inventory, was not in A-2's
target list, and is not mentioned in Phase 2. With `.list-page` now uncapped:

| Viewport | Width per stat tile |
|---|---|
| 1920 | ~380px |
| 2560 | **~555px** |

A 555px stat tile is not a stat tile. Either bring it under the same `auto-fit` treatment
(`repeat(auto-fit, minmax(200px, 300px))`) or state deliberately why it should keep stretching.
This is my omission from A-2, not Flash's — but it needs closing now, before it ships.

### R-5 — A-7 unanswered

A-7 asked for any call site that must stay **exactly** 2-up or 3-up to be flagged rather than
assumed. Under `auto-fit`, `.field-grid--2col` and `--3col` became floors instead of ceilings —
a card authored as deliberately 2-up may now render 3-up or 4-up on a wide screen.

The Phase 2 summary is silent on this. **Answer explicitly**, even if the answer is "checked
all call sites, none require a fixed count."

---

## 4. Phase 3 pre-flight

Not authorized until R-1–R-5 are closed, but these carry forward so they can be planned now.

**The A-5 blocker stands, and is the first thing to handle.** From the audit's own §5, every
document lines table is `table-layout: fixed` with no scroll container. A `table-layout: fixed`
table at `width: 100%` **never overflows** — its columns redistribute inside the available
width. Wrapping it in `overflow-x: auto` produces no scrollbar and no scrolling. The feature
would ship dead.

Order of operations:

1. `min-width` on each lines table — tuned per table, from the point its columns begin
   truncating. Not one number copied across all five.
2. `.table-wrap` around it with `overflow-x: auto` + `overscroll-behavior-x: contain`.
3. Only then the sticky first column (OPEN-2), with the opaque `--color-*` background and
   `position: sticky` on the `th`/`td` — never the `tr`.

Note that Phase 2 made this **less** urgent and **more** subtle: with the page now fluid, line
tables have ~500px more room, so fewer columns truncate at 1920px. The overflow case now
appears mainly at 1280px and below. Tune `min-width` against the narrow viewport, not the wide
one — otherwise the scroll never engages where it is actually needed.

---

## Appendix — draft decision entry

For `DECISIONS.md`. **Renumber to the next free D** — drafted without sight of the current
highest number.

---

### D<next> — Layout width caps live on content elements, not on page containers.

Page-level wrappers (`.page`, `.list-page`, `.reports-page`, `.module-hub`) carry **no**
`max-width`. They expand to the full usable width of `main.main-content`. Width protection is
applied at the **content** layer instead: field grids use
`repeat(auto-fit, minmax(260px, 420px))` with `justify-content: start`, so a wider viewport
adds columns rather than widening existing fields.

**Why.** The previous model capped `.page` at 1160px and `.list-page` at 1080px, discarding
455px of usable width on every route. The caps were also inverted relative to need — table-heavy
list pages were *narrower* than generic pages, and `.list-page` silently overrode
`.reports-page`'s intended 1280px. The cap existed for a legitimate reason (an unbounded `1fr`
text input becomes unusable past ~420px) but was applied at a layer that could not distinguish
a form field from a data table, so tables were penalized for a problem only fields had.

**`minmax(0, 1fr)` is not width protection** — the `0` is the minimum, and the maximum is
uncapped. This was the specific misreading that made the old model look safe. Any future
"the grid is already fluid, so fields are protected" argument is wrong for the same reason.

**Exception, narrowed:** the cap does not live on `.entity-detail-page`. That page is fluid like
any other; the **overview/form panel inside it** carries the max-width. Several entity detail
screens are hybrids — warehouse detail holds a 10-column balances table plus a nested 7-column
batches table, orders hold line items — and a page-level cap there repeats the exact inversion
this decision exists to correct.

**Legitimate element-level caps are unaffected** and are not exceptions to this decision:
`.table-layout__canvas` (`min(100%, 1000px)`, floorplan positioning), `.login-page .card` and
`.not-found-page .card` (400px, centered single-purpose cards).

**Verification standard for layout changes:** a passing `npm run build` is not verification.
Layout changes are verified by rendered measurement across 1280 / 1920 / 2560 under both
`dir="rtl"` + Arabic and `dir="ltr"` + English, or they are marked unverified.
