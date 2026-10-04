# PROMPT — L045: six translation keys render raw to the user

> For **Flash**. Repo: `restaurant-saas-web`. Ledger row **L045**.
> Self-contained — you do not need the testing session's context.

## Why a missing key is user-visible here

`useTranslation` has **no `defaultValue`**. A key with no dictionary entry is echoed back
verbatim, so the UI prints the literal string `common.accessDenied` to the user.

## The six keys

**Five are absent from _both_ dictionaries — they render raw in English as well as Arabic:**

| Key | Site | What the user sees |
|---|---|---|
| `common.accessDenied` | `src/pages/expenses/ExpenseCategoriesPage.tsx:136` | inside `<div className="page-error-banner">` — **the entire text of an error banner** |
| `expenses.categories.globalReadOnlyNotice` | `ExpenseCategoriesPage.tsx:279` | a `title=` tooltip on category rows — **confirmed live in the browser** |
| `orders.type.DINE_IN` | `src/pages/sales/reports/SalesByHourReport.tsx:337` | `<option>` in the order-type filter |
| `orders.type.TAKEAWAY` | `SalesByHourReport.tsx:338` | same dropdown |
| `orders.type.DELIVERY` | `SalesByHourReport.tsx:339` | same dropdown |

The sales-by-hour filter currently reads:

```
All order types
orders.type.DINE_IN
orders.type.TAKEAWAY
orders.type.DELIVERY
```

`SalesByHourReport.tsx:218` builds the same key from a template (``t(`orders.type.${urlOrderType}`)``),
so the broken label also appears in the report header once a type is selected.

**One is absent from `ar` only:** `inventory.purchase.lines.notes` — the purchase-line notes label,
a form-view-only field. Renders raw for Arabic users.

## Two of these need a judgement call, not just a string

- **`expenses.categories.globalReadOnlyNotice`** was written for a global/tenant category split
  that **no longer exists** — categories became tenant-owned in backend commit `8e20e94`. Check
  whether the tooltip still has anything true to say. If not, remove the call site rather than
  inventing copy for a concept that was deleted.
- **`orders.type.*`** are enum values. Ledger row **L014** (currently in progress) covers enum
  translation keys systematically. Coordinate: if L014 introduces a shared enum-label helper, these
  three should use it rather than gaining three one-off keys that then need migrating.

## Coverage is not the problem — do not start a sweep

Already measured: **2,873 `en` keys vs 2,872 `ar`**, 2,029 literal `t()` keys used in code, and
**zero** used keys that exist in `en` but are missing from `ar`. The dictionaries are symmetric.
These six are the whole exposure. Fix them, do not audit everything.

> One caveat worth knowing: that measurement only covers **literal** `t('…')` calls. Template-literal
> keys like ``t(`orders.type.${x}`)`` are invisible to a static scan — the three above were found
> only because the same file also lists them literally. If you want to harden this, a runtime check
> is the only way, and that belongs in L014's scope, not here.

## Done when

- All six keys resolve in both locales, or their call sites are removed where the concept is dead.
- `/expenses/categories` shows no raw key in the banner or any tooltip.
- The sales-by-hour order-type filter shows translated labels in `ar` and `en`, including the
  report header after a type is selected.
- A fresh grep for `t('…')` keys absent from both dictionaries returns nothing.
