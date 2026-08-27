# PROMPT — Remediation, in order

> For **Flash**. Source: `docs/reviews/INDEPENDENT_REVIEW_2026-08-21.md` (Sol) — 20 findings,
> 6 block, 8 browser-confirmed.
> **No new features until Step 2 is complete.** Four hard stops below; do not cross one without
> a human sign-off, and do not batch steps.

---

## 0. Two things before you start

**A browser is available.** Sol ran this checkout headlessly with `/usr/bin/google-chrome` at
`http://localhost:5173` against the local backend. The network-isolation failure was
`npx playwright install`, not Chrome itself. **Every runtime claim in this work must now be
observed, not inferred** — the D98 escape hatch of "marked unverified" no longer applies, because
verification is available.

**`npm run build` is not verification.** It has been offered as one five times in this line of
work. Do not offer it a sixth.

---

## Step 1 — The controller *(gate: decide, then report, then stop)*

### F10 — `useDocumentLines` has zero callers

This is first because it is the design's load-bearing claim and because five other findings
(F01, F02, F09, F11, F12) resolve differently depending on the answer.

The hook was introduced so that one controller owned state for all four documents. No page uses
it. Each page carries its own copy of the state, dependency dispatch, validation, and save/delete
logic — and those copies **already disagree with the hook**. There is no single source of truth;
there are four, plus a shadow.

**Two honest options. Pick one, state it, do not leave both.**

- **Wire the pages to the hook (recommended).** Restores the design as specified, and F01 largely
  resolves as a side effect because the hook's dispatch is already correct. More work, and it
  touches the save path of four documents.
- **Delete the hook.** Legitimate, but it means abandoning the single-source-of-truth claim: the
  abstraction becomes shared *rendering* only, and four behavioural copies are accepted
  permanently. If you choose this, say so plainly and record it as a decision — it is a real
  narrowing of the design, not a cleanup.

### If wiring — order matters

1. **Fix the hook before adopting it (F11).** As it stands it clears errors before mutating,
   swallows failures into a bare `false`, exposes no error state, treats a missing optional
   mutation callback as a *successful* save or delete, does not resync when `initialLines`
   changes, and guards concurrency with a render-lagging boolean instead of a ref. Wiring it
   as-is would propagate all of that to four documents at once.
   Required: mandatory mutation callbacks, retained translated error state (or rethrow), an
   immediate ref/token in-flight guard, stale-response rejection, `initialLines` sync.
2. **Then migrate one page. Verify it in the browser. Then the next.** Four-at-once is exactly
   how this feature reached its current state.
3. **F01 as you go:** delete the page-local `f.key === key` branch — that branch is why changing
   a UOM feeds the UOM id into a handler expecting a material id and wipes the selection — and
   move the purchase-return cascade onto the dependent fields (`dependsOn: ['originalLineId']`),
   not the changed field.

**Report the choice and stop.** Step 2 does not begin until the controller question is settled.

---

## Step 2 — Visible blocks

Independent of Step 1; can proceed in parallel once the controller is decided.

**F03 — 14 translation keys missing from *both* dictionaries.** Sol observed raw keys rendering on
screen in both languages: `inventory.common.grid`, `common.of`, the empty-state keys, and
`inventory.purchaseReturn.lines.notes` among them. `useTranslation` does not implement
`defaultValue` (`useTranslation.ts:29-44`), so the Arabic defaults in the code never display. Add
every key to `en` **and** `ar`, and either implement `defaultValue` once properly or stop passing
it anywhere.

**F06 — RTL prev/next is inverted.** The first button calls `handleNext` but is disabled on the
*previous* boundary, and vice versa. In Arabic you cannot advance from the first line. Derive
`canPrev` / `canNext` from the action each button invokes, never from which visual side or icon
hosts it. Verify in both directions — a one-line document masks this by disabling both.

**F02 — validation errors are set but never rendered.** All three inventory pages still populate
`fieldErrors.lineError`; nothing displays it. Asset validation is not invoked at all —
`handleSaveLine` returns silently on missing values (`AssetDetailPage.tsx:273-275`). Save appears
to do nothing and the user is told nothing. Render the line error in the shared card, and route
asset saves through the same validation path.

**F14 — three purchase-return fields share `key: 'quantity'`.** Both renderers use `field.key` as
the React sibling key; Sol saw the duplicate-key error in console. Introduce a schema field id
distinct from the bound data key.

---

## Step 3 — Migration regressions

**F18 / table class — do this one first; it is one change that revives a lot.**
The shared renderer emits only `pi-form-lines-table`. `.asset-lines-table` no longer exists in the
DOM, so **every selector from the sticky-actions and horizontal-scroll work now matches nothing**:
the pinned actions column, `--lines-actions-width`, `scroll-padding-inline-end`, the per-table
`min-width` floors, the header-cell background, the border seam. The CSS is intact and inert.
Let the schema or the card supply a document-specific table class, then confirm in the browser
that the asset table is sticky and scrollable again. Also collapse the nested
`pi-form-lines__table-wrap` — `DocumentLinesCard` and `SchemaLineGrid` both add one.

**F04 — purchase-return UOM options collapsed to the original UOM only.** The previous renderer
used `getCompatibleUoms`; the request contract and the validation still support conversion.
Restore compatible options anchored on the original line's UOM. Keep `unitCost` read-only — the
add/update requests do not accept it.

**F05 — returnable-line filtering and the Add guard were dropped.** Already-returned original
lines are offered again, and Add stays enabled while returnable lines load and when none remain.
Restore both; backend rejection is not a replacement for a UI constraint that existed.

**F13 — asset regressions.** Loading value discarded so the card renders mid-request; Grid view
has no Add control (`onStartAddLine` reaches only Form view); new-line remaining quantity shows
`—` instead of mirroring quantity; blank labels lost `formatAssetLineLabel`; Save is enabled when
its handler will silently no-op.

**F16 — row-click is mouse-only.** A `<tr>` with only `onClick`: no role, no `tabIndex`, no key
handler. This is now the primary way into Form view. Use a real link or button in a cell, or
implement the full keyboard pattern. Also decide consciously — do not leave undecided — whether
new rows belong first (current) or last (previous), and whether waste's material-code secondary
line comes back.

---

## Step 4 — Contracts and cleanup

| ID | What |
|---|---|
| F19 | `as unknown as never[]` and `any` at the card boundary are hiding a real mismatch: the purchase-return form has no `unitCost` while its schema requires one, so edit mode shows a dash and a zero total. Give the card real types and remove the escapes |
| F15 | Form view hardcodes `ج.م` on every money value and `dir="rtl"` for all locales; Grid formats the same numbers differently. One locale-aware formatter, shared by both views, app direction from the app |
| F08 | Normalize `?line=` — an invalid or deleted id strands the user in an empty state while lines exist |
| F12 | Row actions do not know `isEditingHeader`; waste's Add ignores `addingLine`/`editingLineId`. One page-level interaction lock passed into the card |
| F09 | Dirty tracking covers header edits via the custom Back button only. Line edits are unguarded against browser Back, row selection, picker, view toggle |
| F07 | Three schema memos omit `handleDeleteLine`; ESLint confirms. May resolve with Step 1 — recheck after, don't fix twice |
| F17 | Hex/rgba fallbacks and inline styles violate the `--color-*` and plain-CSS conventions |

---

## Step 5 — Needs a human answer, not a fix

1. **F20 — line discount and tax.** Both are editable, both feed the live computed total, and both
   are **discarded by the payload builders**; the response type has no such fields. Users enter
   values, watch a total, and the server returns a different one. Predates Phase B, but it is
   live. Recommendation: **remove them from the line form** until the API supports them — a field
   that silently discards input is worse than an absent one. Confirm before acting.
2. **Invalid or deleted `?line=`** — should selection fall to the next line, the previous line, or
   always the first?
3. **D98 is already taken.** The repo's `DECISIONS.md` uses D98 for loss reports. The layout-width
   decision needs the next free number, and every reference to "D98" in the review docs and in
   `docs/reviews/LAYOUT_AUDIT_2026-08-21.md` needs updating to match.

---

## Step 6 — Process

The review documents Sol was told to reconcile against live in the claude.ai project, not in the
repo, so it could not read them and its "Confirmed" bucket came back empty for the wrong reason.
Copy them into `docs/reviews/` so future agents can actually reach them:

`REVIEW_PHASE2`, `REVIEW_R1_R5`, `REVIEW_PHASE21_PHASE3`, `REVIEW_PHASE31_PHASE4`,
`REVIEW_PHASE5`, `VISUAL_TEST_RESULTS`, `REVIEW_FORM_VIEW_PHASE_A`,
`REVIEW_FORM_VIEW_PHASES_BD`, `REVIEW_VALIDATION_DIFF`, and the prompts
`PROMPT_FORM_VIEW`, `PROMPT_PHASE5_PIN_ACTIONS`.

---

## How this goes wrong

- Running Steps 1–4 in one pass. That is how twenty findings accumulated.
- Migrating four pages at once again. One, verified, then the next.
- Wiring the hook before fixing F11 — that ships its defects to four documents simultaneously.
- Reporting runtime behaviour as observed without opening Chrome. It is installed and it works.
- Answering Step 5 by choosing for the human.
