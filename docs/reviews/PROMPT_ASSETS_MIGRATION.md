# PROMPT — F03 + F06, then assets (page 4 of 4)

> Two app-wide blocks first — they are on screen in production right now. Then the last page.
> Chrome at `/usr/bin/google-chrome`. Results reported individually.

---

## Part 1 — The two Step 2 blocks that were skipped

These were listed in the remediation order and never reported. They are not asset problems; they
affect Form view on all four documents.

### F03 — missing translation keys are rendering raw

Confirmed on screen in the invoice Form view:

| Should read | Actually renders |
|---|---|
| فورم · جريد | `inventory.common.form` · `inventory.common.grid` |
| بند 1 | `inventory.common.item 1` |
| **بند 1 من 2** | **`inventory.common.item 1 common.of 2`** |

The counter concatenates two raw keys, in the middle of the screen. Surrounding text
("بنود الفاتورة") translates fine, so this is specific to the keys this feature introduced.

Add all 14 to **both** `en` and `ar`: `common.next`, `common.of`, `common.prev`, `common.select`,
`common.view`; `inventory.common.form`, `formView`, `grid`, `gridView`, `item`, `newLine`,
`noItems`, `noItemsSelected`; `inventory.purchaseReturn.lines.notes`.

`useTranslation` does not implement `defaultValue` (`useTranslation.ts:29-44`), so the fallbacks
written in the code never display. Either implement it once, properly, or remove every
`defaultValue` argument so nobody relies on it again. Do not leave it half-supported.

### F06 — settle the prev/next boundary, then fix if needed

Sol reported the buttons cross-wired: the first calls `handleNext` but is disabled on the
*previous* boundary, and vice versa. A screenshot at item 1 of 2 is consistent with either correct
or broken behaviour, so **observe it before changing anything**:

> On a document with 2+ lines, in Arabic, sitting on **item 1**: click the enabled navigation
> button. If the counter goes to 2, the boundaries are correct. If it stays on 1, the enabled
> button is `handlePrev` and the one that would advance is wrongly disabled — meaning Arabic users
> are stuck on the first line.

If broken: derive `canPrev` / `canNext` from the action each button invokes, never from which
visual side or icon hosts it. Then verify at the first line, the last line, and with exactly one
line (which masks the bug by disabling both).

**Report both, then continue to Part 2 without stopping.**

---

## Part 2 — Assets

The last page, and the one carrying the most debt.

### 2.1 Table class — do this first

The shared renderer emits only `pi-form-lines-table`. `.asset-lines-table` is absent from the DOM,
so every selector from the pinned-actions and horizontal-scroll work matches nothing: the sticky
actions column, `--lines-actions-width`, `scroll-padding-inline-end`, the table's `min-width`
floor, the header-cell background, and the border seam. The CSS is intact and inert.

Let the schema or the card supply a document-specific table class, then confirm in the browser that
the asset table is sticky and scrollable again. This is the single highest-value change in this
pass — it restores three weeks of work with one edit.

Also collapse the duplicated scroll wrapper: `DocumentLinesCard` and `SchemaLineGrid` each add
`pi-form-lines__table-wrap`, producing nested scroll containers. Keep exactly one.

### 2.2 The migration

Adopt the hook as before; remove the page-local dispatch and its `f.key === key` branch.

This is the **first page whose row actions go through the schema** — the other three have none, so
that path is untested. Expect it to need attention rather than assuming it works.

### 2.3 F13 — five regressions

1. The loading value is discarded, so the card renders while requests are still pending. Restore an
   explicit loading state.
2. **Grid view has no Add control** — `onStartAddLine` is consumed only by Form view. Expose Add in
   both.
3. A new line's remaining quantity shows `—`; it should mirror the entered quantity.
4. Blank labels lost `formatAssetLineLabel` and now render a dash instead of the line-number
   fallback.
5. Save is enabled when its handler will silently return. Drive the disabled state from schema
   validity, so the button never lies.

### 2.4 Actions — confirm the Phase 7 decisions survived

These were decided **before** the Form view feature. A refactor can revert a decision silently —
that is exactly what happened to `.asset-lines-table`. Check each against the rendered page, not
against the schema config:

- Actions render **icon-only**, no text labels. This is what resolved the LTR clipping, where
  *Dispose* was cut to "Disp" inside a pinned column that scrolling could not reveal.
- Dispose uses **`PackageX`**, not a trash can. The action creates a disposal document; it does not
  delete the line. A trash icon tells the user something that does not happen.
- Delete uses **`Trash2`** with the danger variant.
- **No confirmation on dispose.** Confirmation **on delete**, using the corrected Arabic string:
  `هل أنت متأكد من حذف هذا العنصر؟`
- `--lines-actions-width` is back to the icon-only width (~120px), and `scroll-padding-inline-end`
  follows it from the same variable.

Also remove the dead key `assets.lines.cannotDeleteWithOperations` — or wire it, per 2.5.

### 2.5 The delete guard — answer, do not assume

The schema disables delete when `status !== 'ACTIVE'`. That is not the same question as "does this
line have documents against it".

An **ACTIVE** line can still carry completed maintenance history. Deleting it would orphan those
records. Check what the backend actually does on delete for such a line — this codebase guards this
shape elsewhere (`SECTION_HAS_ORDERS`, D78/D81).

If the backend blocks it, the button should be disabled with a translated reason — which is
probably what `assets.lines.cannotDeleteWithOperations` was written for. If the backend allows it,
say so plainly; that is a data-integrity question for the human, not something to patch in the UI.

---

## Part 3 — Definition of done

The eight, in Chrome, Arabic **and** English, each with its own result:

1. Add persists across a reload.
2. Existing line edits and saves.
3. Delete removes the row and updates the asset's current value.
4. Cascade — assets have no field cascade; state that and skip, do not report a false pass.
5. Missing required field produces a translated message.
6. Forced API failure preserves input, one translated toast, retry succeeds, no server `message` in
   the DOM.
7. Grid → Form and Form → Grid retain values.
8. Unsaved edits survive both view toggles.

Plus eight for this page:

9. **The actions column is pinned again** — sticky at the inline end, in both directions, with an
   opaque background nothing scrolls through.
10. **Horizontal scroll engages** once the window is narrow enough, and the seam renders.
11. **Tab across a scrolled row** never leaves a focused field underneath the pinned column.
12. **Add is present in Grid view** as well as Form view.
13. **Loading state** shows before the lines card renders.
14. **A new line's remaining quantity mirrors the entered quantity**, and a blank label falls back
    to the line number.
15. **Save is disabled** while the line is invalid — never enabled-but-inert.
16. **Delete asks for confirmation; dispose does not.** Dispose shows `PackageX`, delete shows
    `Trash2`, neither shows a text label.

---

## Part 4 — After this

With four of four migrated, report the state of what remains from Sol's list: **F08** (URL
normalization), **F09** (dirty tracking), **F15** (hardcoded `ج.م` and `dir="rtl"`), **F16**
(row-click keyboard access), **F17** (hex fallbacks and inline styles). Several may have resolved
during the migrations — say which, rather than carrying stale items forward.

Also confirm **F07** is now zero hook warnings, and that the shared card no longer needs any page
to keep a parallel controller.
