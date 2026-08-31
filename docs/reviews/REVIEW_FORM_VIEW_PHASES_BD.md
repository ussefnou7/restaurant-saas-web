# Review — Form view, Phases B–D

> **The feature landed. It is not verified, and one unclosed finding can corrupt inventory data.**
> Phases B, C and D shipped in one pass across all four documents, without the Phase A findings
> being closed or reported. Most of that is recoverable by inspection. One item is not, and it
> comes first.

---

## 1. The one that matters — F-1

Phase A's report described the purchase-return quantity rule:

> "computes unit conversion between selected UOM and original UOM, validating that return
> quantity does not exceed available returnable quantity"

and shipped a config containing only:

```ts
validate: (val) => (!val || Number(val) <= 0 ? '…returnQuantityRequired' : null)
```

Phase B has now **deleted the page-level validation** in favour of the schema across all four
documents. If the max-quantity rule was not carried into the config, it is gone — and a user can
return more than was purchased. In an inventory system with a batch-costing ledger, that is not a
UI bug; it writes wrong stock and wrong cost.

A green build cannot see this. Neither can a visual check — the field looks fine, it just accepts
a number it should reject.

### Required, before anything else

Produce a **validation diff table**. For each of the four documents, each field:

| Document | Field | Rule before (git, pre-refactor) | Rule in config now | Match? |
|---|---|---|---|---|

Source the "before" column from `git show HEAD~n:src/pages/.../XFormPage.tsx` — the imperative
`validateLineForm` / `handleSaveLine` bodies that were removed. This is mechanical, not a
judgment call, and it is the only way to know what survived.

Any row that does not match is a regression to restore, not a design decision to defend.

**Then test it live:** open a purchase return, enter a return quantity larger than the original
invoice quantity, and try to save. It must be rejected. Repeat with a different UOM selected than
the original line's, which is where the conversion matters.

---

## 2. Second data-integrity risk — F-5

Field dependencies were never modeled. The cascades are real:

- purchase invoice: `uomId` options depend on `materialId`
- purchase return: `uomId` options depend on `originalLineId`

Filtering may work — `options: (ctx) => …` can read the line. **Resetting** is the exposure: change
the material after picking a UOM, and if nothing clears the stale `uomId`, the line saves with a
unit that does not belong to the material. Silent, and it lands in the ledger.

**Test:** on a purchase invoice line, pick material A, pick a UOM, then change to material B whose
UOM set differs. Check whether the UOM field clears, keeps a now-invalid value, or blocks save.
Any answer except "clears or blocks" is a bug.

---

## 3. The other five — status unknown

None were mentioned in the summary. Some must have been solved to build at all; that is not the
same as being resolved deliberately. State what happened to each:

| | Finding | What to report |
|---|---|---|
| F-2 | `options` absent from all eight select/lookup fields | Are they in the configs now, or does the renderer switch on field key? If the latter, that is the custom-renderer count Q5 said was zero |
| F-3 | Schema as static `const` with stub `onClick: () => {}` | Factory or static? Where do action handlers and lookups come from now? |
| F-4 | `computed` with no `compute` on `returnableQuantity`, `remainingQuantity` | Are these computed client-side or read from the API? Confirm both render real values, not blanks |
| F-6 | `actions` modeled for assets only | Do purchase invoice / return / waste rows still have their edit and delete controls in **both** views? |
| F-7 | `gridWidth: '2fr'` on a `table-layout: fixed` table | `fr` has no meaning for table columns. Did the grid become CSS Grid, did the values become percentages, or is `gridWidth` being ignored? If ignored, the asset column widths tuned last week may have been overwritten |

---

## 4. "Verified" is not the right word

> "Verification: Executed `npm run build` … 0 errors."

Everything Phases C and D added is runtime behaviour: a view toggle, URL parameter sync,
prev/next with RTL-aware chevrons, a position counter, a line picker, row-click switching, and
schema-driven form rendering. TypeScript checks none of it. D98 — written into this codebase's own
decision record — says so explicitly.

The summary says "implemented, integrated, and verified." Two of those three are accurate.

---

## 5. Manual pass

Per document — invoices, returns, waste, assets — and in **both** Arabic and English:

1. **Grid unchanged.** Add, edit inline, delete, row actions. This is the mode people use all day
   and it was refactored underneath them across four documents in one pass.
2. **Toggle** switches views and back.
3. **Row click** opens that line in Form view.
4. **Prev / next** move in the correct visual direction under RTL — `ChevronLeft` pointing left
   must mean *next* in Arabic, not *previous*. This is the classic RTL inversion.
5. **Counter** (`بند 2 من 5`) tracks the selected line.
6. **URL** — copy `?view=form&line=<id>`, reload, land on the same line and view.
7. **Unsaved edits survive the toggle** — that was the stated payoff of state living in the hook.
   Type into a field, switch to Grid, switch back. The edit must still be there.
8. **Purchase return `notes`** appears in Form view and saves. This field is the feature's whole
   justification; confirm it round-trips to the backend.

---

## 6. Credit where due

The feature itself is built the way it was specified: one schema, one hook, four configs, a
toggle, deep links, and `showIn: ['form']` doing exactly the job it was introduced for — surfacing
a `notes` field the product already stored and users could never reach.

The gap is not the design. It is that seven known open questions were carried into an
implementation instead of being closed before it, and the result is that nobody currently knows
which of them the code answered.

Close §1 first. Everything else can follow.
