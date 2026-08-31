# Review — Phase 5

> **Accepted in substance. One latent bug, two convention breaks, two polish items.**
> Nothing here blocks testing — run the script and the manual list now; these can land together
> in one small follow-up.

---

## 1. Accepted

The removal is thorough — `expandedNew` and `expandedForm` were cleaned up beyond what the
prompt listed. Both directions handled through `inset-inline-end`. `scroll-padding` present.
البند unpinned and narrowed.

And the verification framing was right this time: *"Per D98, layout & sticky interactions are
marked unverified by build"*, with the build mentioned separately as a status note rather than
offered as proof. That is exactly the distinction the standard was written for.

---

## 2. F-1 — `--lines-actions-width` never reaches `.table-wrap`

```css
.asset-lines-table { --lines-actions-width: 160px; }          /* defined on the TABLE */

.table-wrap { scroll-padding-inline-end: var(--lines-actions-width, 160px); }   /* read on the PARENT */
```

**Custom properties inherit downward only.** `.table-wrap` is the table's *ancestor*, so it
cannot see a property defined on the table. That `var()` never resolves — it silently falls
back to the literal `160px` every time.

It works today because the fallback happens to equal the real value. It breaks the moment
anyone changes `--lines-actions-width` — which §4.3 of the prompt explicitly instructed them to
do, since the English labels *Maintenance* / *Dispose* are longer than the Arabic and may need
more than 160px. Widen the column, the scroll padding stays at 160, and focused fields land
under the pinned actions again: precisely the bug the line was added to prevent, reappearing
with no visible cause.

**Fix — define it on the wrapper so it inherits down to both:**

```css
.asset-lines-card .table-wrap {
  --lines-actions-width: 160px;
  scroll-padding-inline-end: var(--lines-actions-width);
}
```

The table and its cells still read it by inheritance; the wrapper now reads its own. One
definition, one source of truth.

---

## 3. F-2 — hardcoded hex fallbacks

```css
background: var(--color-surface, #ffffff);
box-shadow: inset 1px 0 0 0 var(--color-border, #e5e7eb);
```

Two problems.

**It breaks the convention.** `CONVENTIONS.md`: *"Colors/spacing via `--color-*` custom
properties only … No hardcoded hex."* A fallback is still a hardcoded hex, and `#ffffff` is the
worst possible one to bake into a sticky background — it is the value that would be wrong first
if a dark theme ever lands.

**It defeats the check that was written to catch this.** The verification line reads:

```js
lastColBg: cs(lastCell)?.backgroundColor,   // must NOT be rgba(0,0,0,0)
```

The whole point was to detect a token that failed to resolve. With `#ffffff` behind it, an
unresolved token paints white, the check reads `rgb(255, 255, 255)`, and passes — reporting
health precisely when something is broken. A guard that cannot fail is not a guard.

Drop both fallbacks. If `--color-surface` is ever missing, a transparent cell is the *correct*
outcome: it fails loudly, and the check catches it.

---

## 4. F-3 — `scroll-padding-inline-end` landed on a shared selector

It was added to `.table-wrap` **and** `.pi-form-lines__table-wrap`. Per the audit's §5,
`.table-wrap` is the **generic** wrapper used by every list table in the app — materials,
warehouses, users, employees, suppliers, and the rest.

None of those have a pinned actions column. They now reserve 160px of scroll padding for
nothing, so any scroll-into-view in any list table overshoots by 160px.

Scope it to the line-table wrapper only — the `.asset-lines-card .table-wrap` selector in §2
already does this, so applying F-1's fix resolves F-3 at the same time. Just remove the bare
`.table-wrap` rule.

This is the fourth time a change intended for one place was applied to a shared selector
(`.hub-card-grid`, `.list-stats-grid`, the `minmax` group, now `.table-wrap`). Worth flagging to
Flash as a standing habit rather than four separate incidents: **before editing a selector,
check how many call sites it has.**

---

## 5. Polish

### 5.1 The `[dir="rtl"]` branch is avoidable

```css
box-shadow: inset 1px 0 0 0 var(--color-border);
[dir="rtl"] … { box-shadow: inset -1px 0 0 0 var(--color-border); }
```

`box-shadow` has no logical form, so the branch is a legitimate workaround — but a border does:

```css
border-inline-start: 1px solid var(--color-border);
```

One declaration, correct in both directions, no `[dir]` selector. Worth trying; if
`border-collapse` on the table makes it render oddly, keep the shadow branch and note why.

### 5.2 Column widths will look airy at wide viewports

With البند fixed at 220px and actions at 160px under `table-layout: fixed`, the five remaining
columns split the rest equally — about **233px each** at a 1548px table, for cells holding `1`,
`150`, `8/21/2026`, `نشط`.

Not a defect, and much better than the previous quarter-of-the-table البند. But if it reads
empty, give the numeric and status columns explicit narrow widths and let البند absorb the
remainder — that is what `table-layout: fixed` is good at. Judgment call after seeing it.

---

## 6. Next

1. Run the console script and the manual list — both directions, window narrowed until the
   table scrolls.
2. Land F-1 + F-3 together (one selector change fixes both), and F-2.
3. Decide 5.1 and 5.2 after looking at it.

With Phase 5 verified, the line of work that started at "why is there so much white space" is
closed: a system-wide width decision recorded as D98, six line tables with working horizontal
scroll, a pinned actions column that survives both directions, and no unreachable fields.
