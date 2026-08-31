# Review — validation diff & architecture responses

> The diff table is the right artifact and it did its job: it confirms the max-quantity rule was
> genuinely missing from shipped code. Five findings remain, three of them behavioural.

---

## 1. "Restored" is the important word

| Purchase Return | quantity | … `> maxQty → returnQuantityExceeded` | **Restored** in `purchaseReturnLineSchema.ts` | Yes (Restored) |

That confirms it: between Phase B shipping and this pass, the purchase-return max-quantity check
and its UOM conversion **were not in the code**. Reporting that plainly rather than quietly
patching it is the right call.

One question follows from it: **did that build ever reach a real tenant?** If it ran anywhere with
live data, `purchase_return` lines need auditing for returns exceeding their original invoice
quantity — the ledger and batch costing would have accepted them. If it never left local dev, say
so and close it.

---

## 2. Five rows marked "Yes" swapped a specific errorCode for generic `required: true`

| Document | Field | Before | Now |
|---|---|---|---|
| Purchase Return | `uomId` | `!form.uomId → uomRequired` | `required: true` |
| Waste | `uomId` | `!form.uomId → uomRequired` | `required: true` |
| Assets | `quantity` | `!qty \|\| qty <= 0` | `required: true, min: 0` |
| Assets | `unitCost` | `!cost \|\| cost <= 0` | `required: true` |
| Assets | `purchaseDate` | `!purchaseDate` | `required: true` |

`required: true` is not equivalent to a `validate` that returns a **named** errorCode. What message
does the framework emit for a `required` failure — the field's own key, or one generic string?
Before, a user who left the UOM blank saw "وحدة القياس مطلوبة". If they now see a generic "هذا
الحقل مطلوب", the rule survived but the message did not, and Phase A's "error messages remain 100%
identical" is still not true.

Also note `min: 0` is not the old rule: `qty <= 0` rejected zero, `min: 0` permits it. Confirm
whether an asset line quantity of `0` is now saveable.

State what errorCode `required` produces, per field.

---

## 3. Purchase return `unitCost` changed from read-only to editable

| Purchase Return | `unitCost` | **"Auto-populated read-only from original line"** | `type: 'money', required: true` | Yes |

The "before" column says read-only. The "now" column has no `readOnly`. Those are not the same
row, and the difference matters: a return line's unit cost must mirror the invoice it returns
against. If a user can now type a different cost, the return posts at a value the purchase never
had, and the batch costing absorbs the difference.

`dependsOn: ['originalLineId']` populates it — but populating is not the same as locking it.
Add `readOnly: true` unless there is a deliberate reason it should be editable, in which case say
what that reason is.

---

## 4. The dependency dispatch looks inverted

```ts
if (field?.onDependencyChange) {
  const patch = field.onDependencyChange(value, { … })
  Object.assign(updated, patch)
}
```

`uomId` declares `dependsOn: ['materialId']` and carries the `onDependencyChange` handler. So when
`materialId` changes, the handler that must fire belongs to **`uomId`** — the dependent field.

As written, this looks up `field` (the field being changed, `materialId`), finds no
`onDependencyChange` on it, and does nothing. The correct dispatch iterates every field whose
`dependsOn` includes the changed key and runs each of their handlers.

If `field` here resolves to something else, the snippet needs clarifying. Either way this is
settled by one test, and it is the same test as before:

> Purchase invoice line → pick material A → pick a UOM → switch to material B with a different
> UOM set. The UOM must reset. If it keeps the stale value, the cascade is declared but never
> firing, and F-5 is still open.

Run the same test on waste (`materialId` → `uomId`) and returns (`originalLineId` → `uomId`,
`unitCost`, `quantity`).

---

## 5. Section 4–5 is asserted, not observed

> "RTL Prev/Next Arrows: `ChevronRight` moves to next line in RTL layout…"
> "URL Deep Linking: … Direct navigation or page reloads retain line and view state."

No browser is installed in that workspace. These outcomes cannot have been observed, and RTL arrow
direction in particular is exactly the kind of thing that reads correct in code and inverts on
screen.

Sections 1–3 of this report are excellent precisely because they are derived from source that can
be read. Section 4–5 is derived from source that cannot. Mark it **unverified** and hand the list
back — that is what D98 asks for, and what Phase 5 already got right once.

---

## 6. Two smaller things

**Column widths.** F-7 now renders `<colgroup><col style={{ width }}>` from `tableWidth`. Two
checks: does the `colgroup` include a `<col>` for the **actions** column (which is not a schema
field and gets its width from `--lines-actions-width`)? If not, every column after it misaligns.
And do these percentages override the `.asset-lines-table` widths tuned last week — is البند back
to a quarter of the table?

**Inconsistent numeric guards.** `quantity` and `unitCost` check `Number.isNaN`; `lineDiscount`
and `lineTax` do not — `val && Number(val) < 0` lets `"abc"` through as valid. Pre-existing, not
introduced by this refactor, so not a regression — but worth aligning while the file is open.

---

## 7. Credit

`dependsOn` / `onDependencyChange`, schema factories with injected handlers, `options` as real
functions, `compute` split from API-provided values, actions rendered from one config in both
views, and `<colgroup>` instead of `fr` units — that is all six architectural findings answered
properly, not worked around.

The remaining gap is narrow: three behavioural differences hidden behind "Yes" in the diff table,
one dispatch that may not fire, and a verification section that claims more than it can know.
