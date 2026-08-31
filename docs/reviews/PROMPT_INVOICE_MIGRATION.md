# PROMPT — Invoice migration (page 2 of 4)

> Waste is signed off. The hook is now considered proven; failures from here are page problems.
> Two carry-overs first, then the invoice.
> Chrome at `/usr/bin/google-chrome`. Results reported individually, never as "verified".

---

## 1. Carry-overs from waste

**1.1 — Deferred snapshot ordering.** The new rule is: sync `initialLines` while idle, defer during
an operation. Confirm what happens to a snapshot that arrived **during** a mutation and is applied
**after** it succeeds.

That snapshot was captured before the mutation reached the server, so it does not contain the
change. Applying it afterwards reverts the line the user just saved. The rule needs to be
recency-based, not order-based: a deferred snapshot older than the completed operation's result is
**discarded**, or replaced by a fresh refetch. If that is already the behaviour, say so and move
on. If it is time-of-arrival based, it is a race that only shows on a slow network — fix it now.

**1.2 — Cascade clear path.** Item 4 was reported for the change path only (UOM `4 → 95`). The
schema also specifies that clearing the material clears the UOM. Confirm that path on waste before
starting the invoice; it is the same dispatch the invoice will rely on.

---

## 2. Decision taken — F20: remove line discount and tax

**Signed off: remove them from the line form.** They are editable, they feed the displayed total,
and both add and update payload builders discard them — the response type has no such fields. A
field that silently drops what the user typed is worse than an absent one.

- Remove `lineDiscount` and `lineTax` from `purchaseInvoiceLineSchema`.
- Remove them from the computed `lineTotal`, which becomes quantity × unit cost.
- Remove the now-dead i18n keys from **both** dictionaries, and any CSS that only served them.
- Record the backend gap as a separate item so the intent is not lost — this is a deferral, not a
  cancellation.

---

## 3. Migrate purchase invoices

Same pattern as waste: adopt the hook for state, validation, mutations, and dependency dispatch;
delete the page-local dispatch including the `f.key === key` branch.

The invoice adds two things waste did not exercise:

### 3.1 The first computed field

`lineTotal` is the first `compute` to go through the shared renderer. Sol's diff notes the previous
renderer displayed the **server's** `lineTotal`, while the current one recomputes client-side.

With discount and tax gone the two should agree — but confirm it rather than assume: after a
successful save, the displayed total must equal the value the server returned. If they can ever
diverge, prefer the server's value; the client's arithmetic is a preview, not the record.

### 3.2 Two things to settle while you are in this file

Both are Sol findings that live in this page. Doing them during the migration avoids touching it
twice — but they are decisions, so state what you chose.

- **F12 — header edit lock.** The old invoice renderer disabled row edit/delete while the header
  was being edited; the shared renderer does not. Pass one page-level interaction lock into the
  card and apply it to row actions, the line form, and Add.
- **F16 — new row placement.** New rows previously rendered after existing rows; they now render
  first. Pick one deliberately and apply it consistently across all four documents. Do not leave
  it as an accident of the refactor.

---

## 4. Definition of done

The same eight, observed in Chrome, in Arabic **and** English, each reported with its own result:

1. Add persists across a reload.
2. Existing line edits and saves.
3. Delete removes the row and updates totals.
4. Cascade — change the material, UOM resets; **clear** the material, UOM clears.
5. Missing required field produces a translated message, not silence.
6. Forced API failure preserves input, shows exactly one translated toast, retry succeeds, and no
   server `message` reaches the DOM.
7. Grid → Form and Form → Grid retain edited values.
8. Unsaved edits survive both view toggles.

Plus two for this page:

9. After save, the displayed `lineTotal` equals the server's returned value.
10. With the header in edit mode, row actions, the line form, and Add are all locked.

Any item you cannot confirm means the invoice has not passed, and the purchase-return migration
does not start.

---

## 5. Reminder about the page after this one

Purchase returns is the hardest of the four, and **F14** (three fields sharing `key: 'quantity'`)
and **F19** (form state missing `unitCost`, hidden behind `as unknown as never[]`) are
prerequisites for it, not follow-ups. Do not start that migration until both are closed — migrating
a page whose types are lying cannot be type-checked.
