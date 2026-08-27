# PROMPT — Purchase returns migration (page 3 of 4)

> The hardest of the four. Two prerequisites close **before** the migration, not during it.
> Invoice is signed off. Chrome at `/usr/bin/google-chrome`.

---

## 1. Carry-over — rounding drift on displayed totals

Item 9 established that the server returns `90.625` and the formatter displays `90.63`. The record
comes from the server; only presentation rounds. That is correct.

But rounded line displays do not sum to a rounded document total. Three lines at `90.625` read as
`90.63 × 3 = 271.89`, while the server's `271.875` displays as `271.88`. In a supplier invoice a
user will add the column by eye and ask about the missing piastre — and money is `NUMERIC(18,6)`
per `CONVENTIONS.md`, so sub-cent values are routine, not edge cases.

Establish whether the server returns a document total and whether it equals the sum of the
**rounded** line values as displayed. Report the answer; do not change behaviour yet. If they
diverge it is a decision (display full precision, or make the total the sum of rounded lines), not
a bug fix.

---

## 2. Prerequisites — close and verify before touching the page

### 2.1 F14 — three fields share `key: 'quantity'`

`originalQuantity`, `returnableQuantity`, and `quantity` all carry the same key, and both renderers
use `field.key` as the React sibling key. Sol observed the duplicate-key error in console.

Add a schema field **id** distinct from the bound data key — `{ id, key, … }` where `id` is unique
within the schema and `key` names the data property. Renderers use `id` for React keys, error
targeting, and layout overrides; `key` stays the data binding.

This touches the shared `LineField` type and all four schemas. Do it now, while three of the four
pages still work the old way, rather than inside the hardest migration.

### 2.2 F19 — the form state is lying

The purchase-return line form has no `unitCost` while its schema requires one, and edit hydration
omits it too. `as unknown as never[]` and `any` at the card boundary hide the mismatch. In edit
mode the read-only cost renders as a dash and the computed total as zero.

Give the shared card real types and delete the escapes. **A page whose types are lying cannot be
type-checked through a migration** — that is the whole reason this is a prerequisite.

While fixing it: `unitCost` must be `readOnly`. The add and update requests do not accept it; the
backend derives it from the original line. An editable cost is a false affordance that would let a
return post at a price the purchase never had.

**Report both, then continue without stopping.**

---

## 3. Migrate purchase returns

Same pattern. Plus three things unique to this page.

### 3.1 A cascade with three targets, on the wrong field

`originalLineId` drives `uomId`, `unitCost`, **and** `quantity`. The current schema attaches the
cascade to the changed field rather than to its dependents. Move it: each dependent field declares
`dependsOn: ['originalLineId']` and carries its own handler, matching the hook's dispatch.

### 3.2 F04 — closed as won't-do: a return always uses the original line's UOM

**Decision taken.** F04 asked to restore compatible-UOM options. That is now explicitly rejected:
a return is entered in the unit of the invoice line it returns against, and nothing else.

Rationale — a return is always against one specific invoice line, and that line has one unit, so
returning in it is unambiguous. Allowing another unit only adds a conversion path, a second
validation branch, and fractional ledger quantities (buy a case of 24, return 3 → `0.125` cases at
six decimal places) in exchange for a capability nobody has asked for. Per D13, it stays out until
a concrete need appears.

So `uomId` gets the same treatment as `unitCost`: **read-only, populated from the original line
via the cascade, not editable.** The UOM conversion inside the quantity validation becomes dead
code — remove it rather than leave it unreachable.

Two things to establish before closing it, because they are not the same question:

- **Read path ≠ write path.** Query whether any existing `purchase_return_line` rows carry a UOM
  different from their original invoice line. If any do, the UI must still load and display them
  correctly — locking the input does not migrate old data. Report the count.
- **The backend contract.** If the add/update API still accepts `uomId` and converts server-side,
  this lock is a UI convention only; another client could still submit a different unit. That may
  be perfectly acceptable — but state which it is, so nobody later assumes the invariant is
  enforced where it isn't.

Worth recording in `DECISIONS.md` once confirmed — it is a domain rule, not an implementation
detail.

### 3.3 F05 — restore the returnable-line filter and the Add guard

Original invoice lines already present in this return are being offered again, and Add stays
enabled while returnable lines load and when none remain. Filter the options against the current
document's lines, and disable Add in both states. Backend rejection is not a substitute for a UI
constraint that previously existed.

Also restore the returnable quantity in the option label — the refactor dropped it, and it is what
tells the user how much is left before they type.

---

## 4. Definition of done

The eight, in Chrome, Arabic **and** English, reported individually:

1. Add persists across a reload.
2. Existing line edits and saves.
3. Delete removes the row and updates totals.
4. Cascade — change the original line; UOM, unit cost and quantity all update. Clear it; all three
   clear.
5. Missing required field produces a translated message.
6. Forced API failure preserves input, one translated toast, retry succeeds, no server `message` in
   the DOM.
7. Grid → Form and Form → Grid retain values.
8. Unsaved edits survive both view toggles.

Plus five for this page — these are the ones that matter here:

9. **Over-return is rejected.** Enter a quantity above the original line's returnable amount. It
   must not save. This rule was silently missing once already, so observe it rather than trust it.
10. **`uomId` is read-only and shows the original line's unit** in both create and edit — never an
    open picker, never blank.
11. **Already-returned original lines are not offered** in the picker.
12. **Add is disabled** while returnable lines load, and when none remain.
13. **`unitCost` is read-only and populated** in both create and edit — not a dash, not zero.
14. **Any pre-existing row with a divergent UOM still loads and displays correctly** — only if §3.2's
    query found some. If the count is zero, record that and skip.

Any item unconfirmed means returns has not passed and the asset migration does not start.

---

## 5. After this one

Assets is last and carries **F13** — five separate regressions (loading state discarded, no Add
control in Grid, new-line remaining quantity showing `—`, blank labels losing
`formatAssetLineLabel`, Save enabled when its handler no-ops) — plus the table-class fix that
revives the pinned-actions and horizontal-scroll CSS. Do not start it inside this pass.
