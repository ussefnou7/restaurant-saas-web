# PROMPT — Phase 5: pin actions, drop the expanded mode

> Supersedes Phase 4 and the OPEN-2 sticky decision. The human tested the built result and
> changed the requirement. Phase 3's horizontal scroll **stays** — only what is pinned changes,
> and the expanded mode is removed entirely.
> Target repo: `restaurant-saas-web`. Assets only, as before.

---

## 1. What changed and why

Two things were built that the real workflow does not want:

**Pinning البند was the wrong column.** It occupies ~370px of ~1548px — roughly a quarter of
the table — and pinning it means paying that cost permanently, on every horizontal scroll, to
keep visible something the user already knows (they are editing one row at a time). The column
does not need pinning and does not need to be that wide.

**The expanded accordion is not wanted at all.** The workflow is: read across the row, edit in
place, add a new row. Fields scroll; what must never scroll away is the ability to *act* on the
row.

So: **pin the actions column instead, at the inline end** — left under Arabic, right under
English — and let everything else scroll freely, in all three states: viewing, editing inline,
and creating a new line.

---

## 2. Remove — the expanded mode, completely

Delete, do not hide. Git holds it if it is ever wanted back.

- The `.asset-line-expanded-panel` component and its CSS (`assets.css:~358`)
- The **"إضافة بند (موسع)"** button and its handler in `DocumentLinesCard`
- The `ResizeObserver` and the `--lines-wrap-width` custom property (`DocumentLinesCard.tsx:17`)
- The `expandedLineId` state and every branch that reads it
- The expand/collapse **chevron** in the actions cell
- The `<Td colSpan={LINE_TABLE_COLUMNS}>` panel row, and `LINE_TABLE_COLUMNS` itself if the
  panel row was its only consumer
- The i18n keys, from **both** `en/assets.ts` and `ar/assets.ts`:
  `assets.lines.addExpanded`, `assets.lines.expand`, `assets.lines.collapse`,
  `assets.lines.modeGrid`, `assets.lines.modeExpanded`
- `aria-expanded` on the removed toggle

After this the actions cell holds only **صيانة** and **تخلص** in view mode, and **✓ / ✕** in
edit and create mode.

The three design questions answered in the last pass — simultaneous expansion, unsaved state on
collapse, tab traversal through the panel — are now moot. Drop them from the record rather than
carrying them forward as answered.

---

## 3. Keep — Phase 3's horizontal scroll

Unchanged and still required: `.table-wrap` with `overflow-x: auto` +
`overscroll-behavior-x: contain`, and each table's `min-width` floor. Only the sticky target
moves.

---

## 4. Change — unpin البند, pin the actions column

### 4.1 Remove the first-column sticky

Delete the `th:first-child` / `td:first-child` sticky block from the grouped rule covering all
six line tables. البند becomes an ordinary scrolling column.

### 4.2 Pin the last column

```css
.asset-lines-table th:last-child,
.asset-lines-table td:last-child {
  position: sticky;
  inset-inline-end: 0;              /* left under RTL, right under LTR — do not use `right` */
  z-index: 2;
  width: var(--lines-actions-width);
  min-width: var(--lines-actions-width);
  background: var(--color-surface);  /* REQUIRED — a transparent cell lets rows scroll through it */
  box-shadow: inset 1px 0 0 0 var(--color-border);   /* see 4.4 */
}
```

`inset-inline-end` is what makes one rule serve both directions. Under RTL the last DOM column
renders leftmost and pins to the left edge; under LTR it renders rightmost and pins right. No
direction branching, no duplicated rule.

### 4.3 Size it to its widest state

The pinned width is paid on every row at every scroll position, so it should be the minimum
that fits. The widest state is view mode — **صيانة** + **تخلص** side by side, ~140–160px.
Edit/create mode (**✓ / ✕**) is narrower and will sit inside the same track.

Define it once so §4.5 can reuse it:

```css
.asset-lines-table { --lines-actions-width: 160px; }
```

Verify the value against the English labels too — *Maintenance* / *Dispose* are longer than the
Arabic and are what actually sets the floor.

### 4.4 The seam

The shadow now belongs on the **inline-start** edge of the pinned column — the side facing the
scrolling content — not the inline-end edge where the old البند seam was. `inset 1px 0 0 0`
resolves correctly under both directions when the cell is the pinned one; confirm visually
under LTR as well, and flip to `inset -1px 0 0 0` if it lands on the wrong side.

### 4.5 Tab must not focus a field underneath the pinned column

This is the part that is easy to miss and will be reported as a bug if skipped.

"يتحرك بحرية بين الفيلدات" means tabbing across the row while it is scrolled. Browsers scroll a
newly focused input into view automatically — but they scroll it to the *edge* of the scroll
container, which is exactly where the pinned actions column sits. The field receives focus and
is then covered by it: typing into an invisible input.

One line prevents it:

```css
.table-wrap {
  scroll-padding-inline-end: var(--lines-actions-width, 160px);
}
```

`scroll-padding` tells the browser to treat that strip as unavailable when scrolling something
into view, so a focused field lands beside the pinned column rather than beneath it.

Test it directly: scroll the table fully, click the first field, then hold Tab across every
column. No field may ever be partly or fully hidden by the pinned actions at the moment it
receives focus. Do this in **both** directions — RTL is where it will fail first.

### 4.6 البند column width

It renders at ~370px (~24% of the table) with no reason to. With `table-layout: fixed`, column
widths come from the first row's cells or explicit rules, so this is set somewhere — find it
and bring it in line with the other text columns. It should be the widest data column, not a
quarter of the table.

---

## 5. Scope

Assets only, same as Phase 4. The other five documents keep Phase 3's scroll and lose the
first-column sticky in §4.1, but do **not** get the pinned actions column in this pass —
their actions cells differ and generalizing before assets is settled repeats the mistake D13
warns about. Note in the report which of the five would need what, without changing them.

---

## 6. Verification

No browser is available to you. Implement, mark **unverified**, and hand back this script plus
a short manual list. Do not cite `npm run build` as verification — D98 forbids it and it proves
nothing about sticky positioning or focus behavior.

```js
(() => {
  const t = document.querySelector('.asset-lines-table');
  const wrap = t.closest('.table-wrap');
  const head = [...t.querySelectorAll('thead th')];
  const firstCell = t.querySelector('tbody td:first-child');
  const lastCell  = t.querySelector('tbody td:last-child');
  const cs = el => el && getComputedStyle(el);
  console.table([{
    cols: head.length,
    firstColWidth: Math.round(head[0].getBoundingClientRect().width),
    firstColSticky: cs(firstCell)?.position,          // must be 'static'
    lastColWidth: Math.round(head[head.length - 1].getBoundingClientRect().width),
    lastColSticky: cs(lastCell)?.position,            // must be 'sticky'
    lastColBg: cs(lastCell)?.backgroundColor,         // must NOT be rgba(0,0,0,0)
    scrollPadEnd: cs(wrap)?.scrollPaddingInlineEnd,   // must be ~the actions width
    scrollable: wrap.scrollWidth > wrap.clientWidth + 1,
    expandedPanelGone: !document.querySelector('.asset-line-expanded-panel'),
  }]);
})();
```

Manual, after the script passes — narrow the window until the table scrolls, then in **each** of
Arabic and English:

1. Scroll fully. The actions column stays pinned at the inline end; البند scrolls away.
2. No row content is visible through the pinned cells.
3. Tab across a row from the first field. Every focused field is fully visible — never under
   the pinned column.
4. Repeat while editing an existing line: ✓ / ✕ stay reachable at every scroll position.
5. Repeat while adding a new line: same.
