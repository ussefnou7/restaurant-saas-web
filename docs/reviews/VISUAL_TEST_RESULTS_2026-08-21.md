# Visual test results — 2026-08-21

> First round verified against rendered screenshots rather than computed arithmetic.
> **Passing: horizontal scroll, RTL sticky column, list-page width, entity-detail cap, grid-mode
> entry.** Three grids still leave dead space — two of them because of a CSS mistake in my own
> recommendations. Details and fixes below.

---

## 1. Results

| # | Test | Result | Evidence |
|---|---|---|---|
| 1 | List pages use full width | **PASS** | Warehouses list spans edge to edge |
| 2 | Hub cards fill the row | **PASS with a wrinkle** | 5 cards across, no trailing gap — but a lone 6th card orphaned on row 2 |
| 3 | Asset header fields sane width | **PASS** | 3 fields + value field, none oversized |
| 4 | Entity detail still capped | **PASS** | Warehouse detail renders ~1200px, not full width |
| 5 | Horizontal scroll on line tables | **PASS** | Scrollbar present under the asset lines table |
| 6 | Sticky first column under RTL | **PASS** | البند holds its exact x-position across a full scroll; الكمية scrolls under it |
| 7 | Expanded panel | **not exercised** | Screenshots used "إضافة بند", not "إضافة بند (موسع)" |
| 8 | Panel reachable while scrolled | **not exercised** | Depends on 7 |

Test 6 is the one worth calling out. RTL sticky positioning was the single highest-risk item in
the whole plan — the thing most likely to ship broken and hardest to reason about without a
browser. It works, and the screenshots prove it: the البند cell occupies the identical pixel
range before and after scrolling, while the column beside it disappears underneath.

---

## 2. F-A — Employee stat row leaves ~730px empty (my error)

The four stat tiles render at **~198px each**, clustered at the inline start, with roughly
**730px** of empty space beside them.

I recommended:

```css
.mini-stat-grid--compact {
  grid-template-columns: repeat(auto-fit, minmax(200px, 300px));
  justify-content: start;
}
```

**That was wrong, and it is the mirror image of the `minmax(0, 1fr)` mistake from Phase 1.**

When the max in `minmax(min, max)` is a **fixed length**, the track is sized to its *content*,
clamped between the two bounds. It does not grow toward the max. Only `1fr` as the max makes a
track absorb free space. So:

- `minmax(0, 1fr)` → **no ceiling.** Tracks grow without limit. (Phase 1's bug.)
- `minmax(200px, 300px)` → **no growth.** Tracks sit at content size, ~198px here, and the
  remainder is dead. (This bug.)

Both traps come from reading `minmax` as "between 200 and 300, filling what it can." It isn't —
the second value is a clamp, not a target.

### Fix

```css
.mini-stat-grid--compact {
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  justify-content: stretch;
}
```

Four tiles then fill the row at ~380px each on this viewport. That is wider than the 300px I
originally argued for, and it is the right trade: a 730px hole reads as broken, a 380px stat
tile does not. On a 2560px monitor they reach ~560px — noted, accepted, and far less
objectionable than the gap.

---

## 3. F-B — Warehouse detail field card leaves ~330px empty inside the card

The `تفاصيل المستودع` card renders **two columns at the 420px ceiling**, with ~330px of dead
space at the inline end, inside a page already capped at 1200px.

Two columns is not what the shared rule produces. `repeat(auto-fit, minmax(260px, 420px))` in a
~1180px container creates `floor(1192 / 272) = 4` tracks, sized to `(1180 − 36) / 4 ≈ 286px`
each — four columns, no gap. Something is still forcing two.

Likely candidates, in order:

1. `.field-grid--2col` retains its own `repeat(2, …)` in a file that was not part of the
   grouped edit.
2. This card uses `.entity-overview-panel` (`232px minmax(0, 1fr)` per audit §4), which is a
   label+content layout, not a field grid, and was never in scope.
3. A page-specific override in `entity-detail-page.css`.

**Do not guess — this is exactly what the console settles.** On the warehouse detail page:

```js
(() => {
  const g = document.querySelector('[class*="field-grid"], [class*="overview-panel"], [class*="details"] [class*="grid"]');
  if (!g) return console.warn('grid not found — inspect the card and report its class');
  const s = getComputedStyle(g);
  console.table([{
    cls: g.className,
    width: Math.round(g.getBoundingClientRect().width),
    parent: Math.round(g.parentElement.getBoundingClientRect().width),
    tracks: s.gridTemplateColumns,
    trackCount: s.gridTemplateColumns.trim().split(/\s+/).length,
    justify: s.justifyContent,
  }]);
})();
```

Report `cls` and `tracks`. The fix follows directly from which of the three it is.

---

## 4. F-C — Hub orphan (cosmetic, your call)

The hub now fills the row with **five** cards and no trailing gap — the dead space is genuinely
gone. But six cards across five columns leaves the sixth alone on row two.

This is the `1fr` change working as designed: with no ceiling, `auto-fit` maximizes the track
count, and five 280px tracks fit where four would have looked more balanced.

If the orphan bothers you, raise the floor:

```css
.hub-nav-card-grid {
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
}
```

At this viewport that yields **4 + 2** instead of 5 + 1. The trade-off is at ~1280px, where a
320px floor drops to 2 columns (3 rows of 2) instead of 3 + 3. Pick whichever balance you
prefer — both are defensible, neither is a defect.

---

## 5. Two unrelated bugs visible in the screenshots

Not layout, not in scope, but they are on screen and worth a ticket:

- **`تاريخ التحديث: Invalid Date`** on the warehouse detail page. The updated-at value is not
  parsing. The created-at beside it renders fine, so it is that one field or a null not being
  guarded.
- **Inconsistent date formatting.** The same page shows `٨ أغسطس ٢٠٢٦` (Arabic-Indic numerals)
  in the metadata line and `6/2/2026` (Latin, US order) in the table below it. Under an Arabic
  locale these should agree — and `6/2/2026` is ambiguous besides.

---

## 6. What's left

1. Fix F-A — one rule, `1fr` instead of the `300px` ceiling.
2. Diagnose F-B with the console snippet, then fix whichever of the three causes it is.
3. Decide F-C — 5 + 1 as-is, or a 320px floor for 4 + 2.
4. Exercise tests 7 and 8: use **"إضافة بند (موسع)"**, then narrow the window until the table
   scrolls and confirm every field in the panel stays reachable.
5. Optionally file the two date bugs in §5.
