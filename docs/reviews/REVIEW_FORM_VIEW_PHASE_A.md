# Review — Form view, Phase A

> **Phase A succeeded. Phase B is not authorized.**
> The exercise did exactly what it was for: it surfaced modeling gaps while they were still
> cheap. Six of them change the `LineSchema` type itself, so they must close before any
> rendering depends on it.
> One finding contradicts the report's own conclusion and would have silently dropped a
> validation rule in Phase B.

---

## 1. What this report got right

- **Real field inventories** for all four documents, traced to real files
  (`PurchaseInvoiceFormPage.tsx`, `PurchaseReturnFormPage.tsx`, `WasteDocumentDetailPage.tsx`,
  `AssetDetailPage.tsx`) rather than inferred.
- **Q3 is the strongest section in the report.** Purchase-return `notes` already exists in
  `LineFormState` and is accepted by `addPurchaseReturnLine` / `updatePurchaseReturnLine`, and is
  simply not rendered because seven columns leave no room. That is a field the product already
  has, already stores, and users cannot reach. It justifies the whole feature on its own, and it
  is verifiable rather than asserted.
- **Waste reason codes correctly placed on the header, not the line.** Good scoping — modeling
  them as a line field would have distorted the schema.
- **`badge` and `lookup` added to the type union** rather than reaching for custom renderers.
  Right instinct — see F-2 for why it isn't yet established.

---

## 2. F-1 — Q4's "zero behaviour change" is false *(highest severity)*

Q2 describes the purchase-return quantity rule:

> "`validate` function on `quantity` computes unit conversion between selected UOM and original
> UOM, validating that return quantity does not exceed available returnable quantity."

The config actually delivered:

```ts
validate: (val) => (!val || Number(val) <= 0
  ? 'inventory.purchaseReturn.validation.returnQuantityRequired' : null),
```

**The max-quantity check and the UOM conversion are both absent.** Only the positive-number check
survives.

Q4 then concludes:

> "Behavioral Impact: Zero behavior changes. Validation rules, triggers, and error messages remain
> 100% identical."

These cannot both be true. Q2 names a rule the config does not contain, and Q4 certifies that
nothing was lost.

This is the exact failure mode Phase A exists to prevent: in Phase B the page's imperative
validation gets deleted in favour of the schema, the max check disappears, and users can return
more than they purchased. It would pass every build and every visual check.

**Required:** audit every `validate` in all four pages against the config, function by function.
For each, state the rule in the source and the rule in the config, and confirm they match. Where
a rule needs cross-field or converted values — which this one does — the schema needs a validate
signature that receives them, which today it does not.

---

## 3. F-2 — "Zero custom renderers" is not yet established

`options?: (ctx) => SelectOption[]` is declared on `LineField` and used in **none of the four
configs**. Every `select` and `lookup` field ships without an option source:

- purchase invoice `materialId` (`lookup`) — no `options`
- purchase invoice `uomId` (`select`) — no `options`
- purchase return `originalLineId`, `uomId` — no `options`
- waste `materialId`, `uomId` — no `options`

So the renderer cannot know what to display. It resolves one of two ways:

1. The configs are incomplete, or
2. The renderer switches on the key — `materialId → <MaterialSelect>`, `uomId → <UomSelect>`.

If it is (2), those **are** custom renderers, relocated from the config into the renderer where
they are harder to see. Q5's "zero custom renderers" would be an artifact of where the code sits,
not a property of the design.

Fill in `options` for all eight fields, or state plainly which widgets the renderer resolves by
key and count them as what they are.

---

## 4. F-3 — the schema cannot be a static const

```ts
export const assetLineSchema: LineSchema = {
  actions: [
    { key: 'maintenance', icon: 'Wrench', onClick: () => {} },
    { key: 'dispose',     icon: 'PackageX', onClick: () => {} },
    { key: 'delete',      icon: 'Trash2', onClick: () => {} },
  ],
}
```

Empty handlers are fine as placeholders, but they point at a structural problem: **almost
everything the schema needs is page-scoped and dynamic** — action handlers (open the maintenance
modal, open the disposal flow), option sources (the materials list, compatible UOMs), and lookup
data. A module-level `const` can hold none of it.

The schema needs to be produced, not declared:

```ts
export const createAssetLineSchema = (deps: {
  handlers: LineActionHandlers;
  lookups: AssetLookups;
  t: TranslateFn;
}): LineSchema => ({ ... })
```

Decide this now. It is the difference between a config module and a factory, and every consumer's
call signature depends on it.

---

## 5. F-4 — `computed` and `readOnly` are conflated

Three fields are typed `computed`. Only one has a `compute` function:

| Field | `compute`? |
|---|---|
| purchase invoice `lineTotal` | yes |
| purchase return `returnableQuantity` | **no** |
| asset `remainingQuantity` | **no** |

Two possibilities, and they need different modeling:

- The value is **derived client-side** → it needs a `compute`, and the two above are incomplete.
- The value **comes from the API** → it is not computed at all; it is a server-provided read-only
  display field, and typing it `computed` is wrong.

`remainingQuantity` almost certainly comes from the backend. If so, the union needs the
distinction — a renderer must know whether to call `compute` or read `line[key]`, and a single
`computed` type cannot tell it.

---

## 6. F-5 — no model for field dependencies

Real cascades exist in these documents:

- purchase invoice: `uomId` options depend on the selected `materialId`
- purchase return: `uomId` options depend on the selected `originalLineId`
- purchase return: `returnableQuantity` depends on `originalLineId`

`options: (ctx) => ...` can *read* `ctx.line`, so filtering works. What has no expression is the
**reset**: when the user changes material, the previously selected `uomId` may no longer be
valid. Today each page handles that imperatively. Move to the schema without modeling it and the
behaviour is silently lost — a stale UOM stays selected and the line saves with a mismatched
unit.

The schema needs something like `dependsOn: ['materialId']` with defined reset semantics, or an
explicit `onChange` hook. Name which, and check every page for cascades this list missed.

---

## 7. F-6 — actions modeled for assets only

Only `assetLineSchema` declares `actions`. The other three have none — yet purchase invoice,
purchase return, and waste lines all have at minimum edit and delete controls in their grids
today.

If those stay hardcoded per page, Form view has to re-implement them, which is precisely the
drift the single-schema constraint exists to prevent. Model them, or state why those three
genuinely have no row actions.

---

## 8. F-7 — `gridWidth: '2fr'` does not apply to a table

Every config uses `gridWidth: '2fr'` / `'1fr'`. The lines grid is a `<table>` with
`table-layout: fixed` — `fr` units are a CSS Grid concept and have no meaning for table columns.
We set that table's widths as percentages three days ago.

Either translate to percentages (and reconcile with the values already tuned on
`.asset-lines-table`), or state that Phase B converts the grid from `<table>` to CSS Grid — which
is a much larger change with accessibility consequences and would need its own decision, not a
silent unit choice in a config.

---

## 9. Minor

- **`disabled: (line) => line.status !== 'ACTIVE'`** on delete is a sensible guess, and it
  partially answers the Phase 7 question about deleting lines that carry documents. But it is a
  client-side rule. Confirm the backend enforces the same thing; a client-only guard is a UX
  affordance, not an invariant.
- **The verification plan cites `npm run build` again.** D98. For Phase A specifically nothing
  needed verifying, so this is only a note — but Phases B–D are entirely runtime behaviour.

---

## 10. Verdict

Phase A did its job. Every finding above is a modeling gap caught on paper, at the cost of one
document, instead of being discovered halfway through a refactor of a grid that people use all
day. That is the whole return on doing this phase.

**Before Phase B:**

1. F-1 — full validation audit, source vs. config, rule by rule. *(blocking)*
2. F-2 — `options` for all eight select/lookup fields, or an honest custom-renderer count.
3. F-3 — decide factory vs. static; it changes every call site.
4. F-4 — split `computed` from server-provided `readOnly`.
5. F-5 — a dependency/reset model, plus a sweep for cascades not yet listed.
6. F-6 — actions for the other three documents.
7. F-7 — decide table-percentages vs. CSS Grid conversion.

Re-issue the four configs with these closed. Phase B opens then — and given the grid is the mode
people use all day, it still opens one document at a time.
