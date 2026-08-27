# Review — Phase 3.1 & Phase 4

> **One real defect, three unanswered questions, one verification run — then this is done.**
> Phase 3.1 is accepted. Phase 4's structure is right; the horizontal-scroll pinning is not,
> for a reason that is subtle and worth understanding rather than just patching.

---

## 1. Phase 3.1 — accepted

All six line tables now carry a floor and the grouped sticky rule. The per-table numbers are
mostly formulaic — 840/960/840/720/780/800 works out to ~120px per column with two tables
adjusted off the pattern — but two 6-column tables getting 780 and 800 shows the numbers were
at least considered individually rather than pasted. Good enough to ship and measure.

Two notes rather than objections:

- **The pilot table's floor went down.** `.asset-lines-table` was 900px, now 840px. Lower floor
  means it engages the scroll later. Since this is the table Phase 4 pilots on, it is the one
  most worth checking empirically — see §4.3.
- The re-derivation command in the report is elided (`...`), so its output isn't inspectable.
  Not worth another round trip; §4.3 tests the outcome directly, which is what actually matters.

---

## 2. Phase 4 — the pinning defect

The structure is right: accordion inside `<TableRow>` → `<Td colSpan>`, expand toggle with
`aria-expanded`, translated labels, EN/AR key parity, an "add line expanded" entry point. That
is the requirement, built the way the constraints asked for.

The pinning is not:

```css
.asset-line-expanded-panel {
  position: sticky;
  inset-inline-start: 0;
  width: 100%;      /* ← this */
}
```

**`width: 100%` resolves against the panel's containing block — the `<td colSpan={7}>` — which
is as wide as the whole table, not as wide as what the user can see.** The table has
`min-width: 840px`; the scroll container may be showing 600px of it.

So the panel is 840px wide inside a 600px viewport. `position: sticky` does engage — the panel's
start edge stays pinned as you scroll — but it pins a panel that is 240px wider than the
window it is pinned inside. The fields at its trailing end sit outside the visible area, and
because the panel travels with the scroll, **scrolling can never bring them into view.** They
become unreachable rather than merely offscreen.

That is worse than not pinning at all: without sticky, at least scrolling reveals them.

### The fix

The panel has to be sized to the scroll container's *client* width, and CSS cannot read that
from inside a table cell. It needs one observer feeding a custom property:

```jsx
// DocumentLinesCard — on the .table-wrap element
const wrapRef = useRef(null);
useEffect(() => {
  const el = wrapRef.current;
  if (!el) return;
  const ro = new ResizeObserver(([entry]) => {
    el.style.setProperty('--lines-wrap-width', `${entry.contentRect.width}px`);
  });
  ro.observe(el);
  return () => ro.disconnect();
}, []);
```

```css
.asset-line-expanded-panel {
  position: sticky;
  inset-inline-start: 0;
  width: var(--lines-wrap-width, 100%);
  max-width: var(--lines-wrap-width, 100%);
}
```

`contentRect.width` excludes the scrollbar, which is the number wanted here. The `100%`
fallback keeps it sane before the observer's first callback and if the observer is absent.

Verify it with §4.2 — the check is one comparison: **panel width must equal the wrapper's
visible width, not the table's scroll width.**

---

## 3. Three required answers still missing

§5.2 of the original prompt listed these as explicit deliverables — "recommend one and say
why", "define what happens". The Phase 4 report does not mention any of them.

1. **Simultaneous expansion.** May more than one row be expanded at once? With sticky panels
   this is not cosmetic: two pinned panels in one scroll container will overlap or fight for
   the same pinned position. Decide, and say why.
2. **Unsaved state.** What happens when a user edits inside an expanded panel and collapses
   without saving? And when they expand a row that already has unsaved grid-mode edits — does
   the panel show them, discard them, or block?
3. **Tab order.** Does tabbing through an expanded panel continue into the next row, or jump
   back to the top of the table? This is the one thing that decides whether the fast-entry
   workflow survives the feature, and it was the stated reason grid mode had to be preserved.

This is the third time a required "answer explicitly" item has come back unanswered — A-7 in
Phase 2, then the §5.2 set here. Not a competence problem; the implementations are consistently
good. It is a reporting habit: the code questions get answered, the judgment questions get
skipped. Worth naming to Flash directly, since Phase 5 (generalizing to the other five
documents) will be almost entirely judgment questions.

---

## 4. Verification

### 4.1 — carry-over, still unrun

The hub `trackCount` check from the last review has not come back. Phase 4 proceeded past a
gate that was conditioned on it. No harm done — the work is independent — but that question is
still open, and it is one line. Run §5.1 of the previous review.

### 4.2 — the expanded panel (run with a row expanded, window narrowed to ~900px)

```js
(() => {
  const panel = document.querySelector('.asset-line-expanded-panel');
  if (!panel) return console.warn('expand a row first, and narrow the window until the table scrolls');
  const wrap = panel.closest('.table-wrap');
  const cell = panel.closest('td');
  const table = panel.closest('table');
  const p = Math.round(panel.getBoundingClientRect().width);
  const v = Math.round(wrap.clientWidth);
  console.table([{
    wrapVisible: v,
    wrapScrollable: wrap.scrollWidth,
    panelWidth: p,
    panelPosition: getComputedStyle(panel).position,
    colSpan: cell ? cell.colSpan : '-',
    headerCols: table.querySelectorAll('thead th').length,
    verdict: p <= v + 1 ? 'OK — panel fits the viewport'
           : `TOO WIDE by ${p - v}px — trailing fields unreachable`,
  }]);
})();
```

`colSpan` and `headerCols` must match. The report says `colSpan={7}` is hardcoded — if a column
is ever added to the asset lines table, that silently misaligns. Derive it from the header
count instead; it is a one-line change and removes a whole class of future bug.

### 4.3 — does the table truncate before it scrolls?

This is the empirical version of the "tuned per table" question, and it settles §1's note about
840 vs 900 without argument:

```js
(() => {
  const t = document.querySelector('.asset-lines-table');
  const heads = [...t.querySelectorAll('thead th')];
  console.table(heads.map((th, i) => {
    const cells = [...t.querySelectorAll(`tbody tr > *:nth-child(${i + 1})`)];
    const worst = cells.reduce((m, c) => Math.max(m, c.scrollWidth - c.clientWidth), 0);
    return {
      col: th.textContent.trim().slice(0, 24),
      rendered: Math.round(th.getBoundingClientRect().width),
      clipped: worst > 1 ? `YES — clipped by ${worst}px` : 'no',
    };
  }));
})();
```

Any `clipped: YES` at a viewport where the table is **not** yet scrolling means that table's
floor is too low — content is being cut before the scroll engages, which is the failure the
floor exists to prevent. Raise that table's `min-width` by roughly the largest clipped amount.

### 4.4 — on citing the build

> "Build Verification: `npm run build` executed cleanly with 0 TypeScript errors and 0 ESLint
> errors."

D98 — the decision record written in this same pass — states:

> "a passing `npm run build` is not verification. Layout changes are verified by rendered
> measurement … or they are marked unverified."

For an interactive component with expand/collapse, keyboard traversal, and sticky positioning,
a green build carries even less signal than it did in Phase 2. Nothing here is a compile error;
everything here is a runtime behavior.

The correct line, given no browser is available, is the one Phase 3 already got right: mark it
**unverified** and hand over the checklist. The scripts above are that checklist, executable.

---

## 5. What's left

1. Fix the panel width (§2) — the only functional defect.
2. Answer the three questions (§3).
3. Derive `colSpan` from the header count (§4.2).
4. Run §4.1, §4.2, §4.3 and report actual numbers.
5. Adjust any table floor that §4.3 shows clipping early.

That closes the whole line of work that started with "why is there so much white space." Phase 5
— generalizing the dual-mode editor to the other five documents — should not open until the
three questions in §3 are answered, since their answers are the abstraction's contract.
