# PROMPT — Final pass: close the remaining findings

> All four documents are migrated. This closes what is left, then the line of work is done.
> Chrome at `/usr/bin/google-chrome`. Results reported individually.

---

## Part 1 — Decision taken: asset lines are immutable after creation

**Signed off.** There is no update endpoint because an asset line represents an actual acquisition;
editing its quantity or cost after the fact rewrites the asset's book value with no audit trail.
Create and delete are the intended operations. Delete-and-recreate is the correction path.

The problem today is not the missing endpoint — it is that the UI offers an edit affordance that
cannot save. Remove the affordance, not the capability:

- Persisted asset lines render **read-only** in both Grid and Form view. Use the existing idiom —
  `readOnly: (ctx) => !ctx.isNew` — so a new line is still fully editable while being entered.
- No edit control on a persisted line, and no Save/Cancel footer in Form view for one. A detail
  view with dead buttons is the same false affordance in a different place.
- Delete stays as-is, with the `LINE_HAS_CHILD_RECORDS` guard already wired.
- Record it in `DECISIONS.md`. This is a domain rule someone will otherwise "fix" as a missing
  endpoint in six months.

---

## Part 2 — The five remaining findings, in this order

### 2.1 F15 — hardcoded direction and currency *(most visible)*

Form view sets `dir="rtl"` for every locale, so English users get a mirrored layout. It also
appends `ج.م` to every money and computed value, while Grid formats the same numbers without it —
two views disagreeing about the same field.

- Direction comes from the app, never a literal.
- **One money formatter, used by both views.** If no currency is configured anywhere in the tenant
  model, a single central constant is acceptable; a currency literal inside a generic renderer is
  not.

### 2.2 F09 — unsaved line edits are unguarded *(loses user work)*

Dirty tracking covers header edits reached through the custom Back button only. A user can type
into a line and lose it to browser Back, router navigation, a document change, the line picker, or
row selection.

- Dirty state belongs in `useDocumentLines` — it is the controller now.
- Guard with the router's navigation blocker plus `beforeunload`, and apply the same check to
  in-app line selection and document changes.
- **Do not warn on the view toggle.** State survives it by design — that was the stated payoff of
  state living in the hook. Warning there would punish the one transition that is safe.

### 2.3 F08 — normalize `?line=`

An invalid, deleted, or foreign line id leaves `selectedIndex = -1` forever: the picker shows the
first option while the detail area says nothing is selected.

On line-list or document change, validate the id. **Recommended rule:** fall to the nearest
surviving line by index; clear the parameter entirely when there are zero lines. Override it if you
have a better reason, but state which rule you implemented.

### 2.4 F16 — Grid rows are mouse-only

A `<tr>` carrying only `onClick` — no role, no `tabIndex`, no key handler — is now the primary way
into Form view.

Prefer a real button or link inside a cell over making the whole row a control: rows already
contain inline inputs and action buttons, and a row-level click target competes with them. If you
do keep the whole row clickable, implement the complete keyboard pattern, not just `tabIndex`.

### 2.5 F17 — conventions

Hex and rgba fallbacks (`var(--color-surface, #ffffff)`) violate `CONVENTIONS.md`, and a fallback
also defeats the checks written to catch an unresolved token — a guard that cannot fail is not a
guard. Move the schema's inline column widths into the `<colgroup>` mechanism that already exists,
and take the asset empty state's inline presentation into a class.

---

## Part 3 — Loose ends never confirmed closed

**3.1 Unused surface on the shared abstraction.** You reported that the card owns query-string
selection while the hook exposes URL state nobody consumes. That is how `useDocumentLines` became
a zero-caller module in the first place — an unused surface that looked implemented.

Pick one owner and delete the other. Then sweep for the rest of it: Sol's §5 named `header`,
`canEdit`, `canDelete`, optional no-op mutation callbacks, and unused dependency fields. Remove
anything with no current caller. An abstraction earns its keep by what it does, not by what it
could do.

**3.2 The D98 collision.** The repo's `DECISIONS.md` already used D98 for loss reports before the
layout-width decision was drafted against that number. Confirm the layout decision has its own free
number, and that every reference to "D98" in `docs/reviews/` points at the right one. The
verification standard quoted throughout this work is only enforceable if it has a stable id.

**3.3 Review docs are not in the repo.** Sol's reconciliation came back empty because the review
documents live in the claude.ai project, not in the checkout. Copy them into `docs/reviews/` so the
next agent can actually read them.

---

## Part 4 — Definition of done

In Chrome, Arabic **and** English, each reported individually:

1. **English Form view is LTR** and money renders in the app's format — no `ج.م` literal, no
   mirrored layout.
2. **Grid and Form display the same number identically** for the same field.
3. **A persisted asset line has no edit control** and no dead Save/Cancel, in both views.
4. **A new asset line is still fully editable** while being entered.
5. **Typing into a line then navigating away warns**, via browser Back and via an in-app document
   change.
6. **Toggling Grid ↔ Form does not warn**, and the edit survives.
7. **`?line=` with an invalid id** lands on a real line or clears, never on the stranded empty
   state.
8. **A Grid row can be opened from the keyboard**, and Tab order through a row remains sane.
9. **`rg 'var\(--color-[^)]*,' src`** returns nothing, and no inline `style` remains on schema
   cells.

Then report what is left, if anything. If nothing is, say so — this feature has been open long
enough to deserve a clean close.
