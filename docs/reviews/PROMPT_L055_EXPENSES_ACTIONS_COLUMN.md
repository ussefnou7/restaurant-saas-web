# PROMPT — L055: the Void action is clipped out of the expenses list

> For **Flash**. Repo: `restaurant-saas-web`. Ledger row **L055** in
> `restaurant-saas/docs/MVP_LEAK_LEDGER.md`. Evidence:
> `docs/evidence/mvp-e2e/S-media-rtl/README.md`.
> Self-contained — you do not need the testing session's context.

## The defect

On `/expenses`, the row actions cell holds two buttons (`عرض التفاصيل` / `View Details` and
`إلغاء` / `Void`) in a cell too narrow for them. Measured in a real browser at **1440×900**:

| Locale | Cell | `Void` button | Visible |
|---|---|---|---|
| **`ar` / RTL** | `x 41 → 191` | `x −41 → 41` | **zero pixels** — entirely outside the cell, partly off-screen |
| `en` / LTR | `x 1249 → 1399` | `x 1389 → 1468` | ~10px of 79 |

The cell renders at 150px; its content needs **234–247px**.

## Cause

`src/styles/expenses.css:157-165`

```css
.expenses-table__td--actions {
  position: sticky;
  inset-inline-end: 0;
  z-index: 2;
  width: 110px;          /* ← too narrow for two buttons */
  background: var(--color-surface);
  border-inline-start: 1px solid var(--color-border);
  text-align: center;
  white-space: nowrap;   /* ← prevents wrapping to a second line */
}
```

## Do not change the sticky mechanism

`position: sticky` with `inset-inline-end: 0` is **correct** — a logical property that pins the
column at the right edge in LTR and the left edge in RTL without a direction-specific override.
It is not the bug. Only the cell cannot fit its contents.

## Two acceptable directions — pick one and say which

1. **Widen the cell** so both buttons fit in both locales. Arabic labels are longer than English
   ones, so size against the Arabic text, not the English.
2. **Collapse the actions into `ActionMenu`** — `src/components/ui/ActionMenu.tsx` already exists
   and is used elsewhere. A single trigger in a narrow sticky cell, actions in the menu. This also
   stops the problem recurring the next time a third action is added.

Direction 2 is likely better long-term, but it changes the interaction, so it is your call with a
one-line rationale in the commit.

## Why it matters

Void is the **only** correction path for an expense — there is no edit and no delete. A
mis-entered expense cannot be corrected from the list it appears in. A workaround exists
(`ExpenseDetailPage` imports `ExpenseVoidModal`), which is why this is P1 and not higher.

## Check the same pattern elsewhere before you finish

`.expenses-table__td--actions` is one instance. Grep for other sticky actions cells with a fixed
`width` and `white-space: nowrap` — particularly any list that has gained a second action since it
was styled. Report what you find even if you do not change it.

## Done when

- Both actions are fully visible and clickable on `/expenses` in **`ar` and `en`** at 1440×900.
- Verified by measuring, not by eye: for each action element,
  `getBoundingClientRect()` must sit inside the cell's rect in both locales.
- The sticky column still pins correctly when the table scrolls horizontally, both directions.
- No `direction`-specific CSS was introduced — keep using logical properties.
