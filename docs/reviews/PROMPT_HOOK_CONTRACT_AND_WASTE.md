# PROMPT — Settle the hook contract, then migrate waste

> Two contract items first. They cost ten minutes now and 4× that after four call sites exist.
> Then the first page migration, with an explicit definition of done.
> Chrome is available at `/usr/bin/google-chrome` — runtime claims must be observed.

---

## 1. `initialLines` sync — confirm or implement

Sol's F10 recorded that the hook "does not sync changed `initialLines`". The F11 report lists five
fixes and this is not among them. Say which it is: already handled, or still open.

It matters on a path the save flow does not cover. Navigating between documents reuses the same
hook instance with new `initialLines`; without a sync the previous document's lines stay on
screen. The same applies after any external refetch.

If implemented, sync must not clobber in-progress edits — resetting a user's unsaved line because
a background refetch landed is a worse bug than the one being fixed. State the rule you chose.

---

## 2. One failure channel, not two

As reported, the hook now has two:

> "API failures now propagate to callers" — throws
> "Validation errors still return `false` through `fieldErrors`" — returns

So every caller must check the return value **and** wrap the call in `try/catch`. Miss either in
one of four pages and that page fails silently. This is the same divergence the hook exists to
eliminate, relocated into its contract — and it is far cheaper to fix before the first caller than
after the fourth.

Collapse it to one channel:

```ts
type LineOpResult =
  | { ok: true; line: Line }
  | { ok: false; kind: 'validation' }
  | { ok: false; kind: 'api'; errorCode: string; params?: Record<string, unknown> }
```

One `switch`, exhaustive, type-checked. No "did I remember the catch".

### The D12 question attached to it

If API errors reach the pages, **who translates them?** Four pages each calling
`translateApiError` their own way is four implementations again.

**Check what already exists before deciding.** Sol's report referenced "current page/global-
interceptor paths" — find out whether the axios interceptor already surfaces a translated toast
for failed mutations. Then pick one and state it:

- The interceptor already shows the error → the hook returns the failure so the caller can keep
  the form open, and pages render nothing extra.
- It does not → the hook returns `errorCode` + `params`, and **one** shared piece of UI in the
  lines card renders it through `translateApiError`. Not per page.

Either way the server `message` is never rendered (D12).

**Report both decisions and the interceptor finding, then continue to §3 without stopping.**

---

## 3. Migrate waste documents

First and simplest: `materialId`, `quantity`, `uomId`, `notes`, and one cascade
(`materialId → uomId`).

While migrating, delete the page-local dependency dispatch — including the `f.key === key` branch
that feeds a UOM id into a handler expecting a material id (F01). The hook's dispatch is already
correct; the page's copy is what is wrong.

**This migration is also the hook's verification.** The hook has no callers, so nothing about F11
or §1–§2 can be observed until now. Once waste passes, the hook is treated as proven and later
failures are page problems.

**Stop condition:** if the migration reveals the hook needs a shape change, **stop and report** —
do not patch the hook to suit waste. Per-page hook patches rebuild the drift problem inside the
hook, which is worse than four honest copies.

### Definition of done — all eight, observed in Chrome, in Arabic **and** English

1. **Add** a line → saves, and the correct values survive a page reload.
2. **Edit** an existing line → saves.
3. **Delete** a line → disappears, totals update.
4. **Cascade** → change the material; the UOM resets to the new material's default, or clears when
   the material is cleared.
5. **Failed validation** → save with a required field empty. A **translated** message appears.
   Silence is a failure of this item.
6. **Failed API save** → force one. Entered values are preserved, one translated message appears,
   retry works.
7. **Both views agree** → edit in Grid, switch to Form, the value is there. And the reverse.
8. **Unsaved edit survives the view toggle** — the stated payoff of state living in the hook.

Any item you cannot confirm means waste has not passed, and the invoice migration does not start.

Report the eight results individually — not "verified". `npm run build` is not among them.
