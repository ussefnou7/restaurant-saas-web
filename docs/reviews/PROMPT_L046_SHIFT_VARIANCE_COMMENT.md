# PROMPT — L046: a comment asserts the opposite of the code, and three things depend on it

> For **Flash**. Repo: `restaurant-saas-web`. Ledger row **L046**.
> Self-contained — you do not need the testing session's context.

## The false claim

`src/utils/shiftAccess.ts:18-23`:

> *"Variance is a display-only grant: **no endpoint enforces `SHIFTS_VIEW_VARIANCE`, the server
> sends the figures regardless.** Hiding the columns is a courtesy, not a control — which is also
> why the code is checked directly rather than through `hasPermission`, whose `PermissionCode` type
> only admits codes some endpoint enforces."*

**Both sentences are false.** The backend enforces it, in one place, deliberately —
`restaurant-saas/.../pos/shift/ShiftQueryService.java`:

```java
:35   // javadoc: "Variance visibility is decided once, here."
:45   private static final String VIEW_VARIANCE = "SHIFTS_VIEW_VARIANCE";
:65   boolean canViewVariance = securityService.hasPermission(VIEW_VARIANCE);   // list
:75   boolean canViewVariance = securityService.hasPermission(VIEW_VARIANCE);   // detail
:88   orders        = canViewVariance ? … : …
:91   expenses      = canViewVariance ? … : …
:110  ShiftListItemResponse.from(header, canViewVariance)
:111  canViewVariance ? salesByPaymentMethod(…) : Map.of()
:112  canViewVariance ? cashSales : null
:113  canViewVariance ? header.getExpensesAtClose() : null
:114  canViewVariance ? lateExpenses : null
:115  canViewVariance ? explainedVariance(…) : null
```

Confirmed end to end against a running stack: a `CASHIER` without the permission calling
`GET /api/shifts/{id}` receives `openingCount` **absent**, `cashSales: null`, `expenses: []` —
while an `OWNER` on the same shift sees a linked 250 expense in full. Blind while the shift is open
*and* after it closes.

## What the false belief caused

1. **`shiftAccess.ts:24-29`** bypasses `hasPermission` and reads
   `user.permissions.includes('SHIFTS_VIEW_VARIANCE')` directly — *because* the comment says no
   endpoint enforces it. The real cost is type safety: the code escapes `PermissionCode`, so the
   compiler-as-drift-test that `screen-map.ts:7-10` describes does not cover it. If the backend
   renamed or dropped the gate, nothing would break the build.
2. **`src/access/screen-map.ts:12-15`** excludes the code from the map on the same premise —
   *"seeded but gate no endpoint … the server sends the value regardless."*
3. **Ledger row L003** was re-confirmed as a **P0** on the strength of (1), by someone reading this
   frontend comment instead of the backend. It has since been dropped. That is the real cost of
   leaving this in place.

## The work

- Correct the comment in `shiftAccess.ts` to describe what the server actually does.
- Route `SHIFTS_VIEW_VARIANCE` through `hasPermission` so it re-enters the `PermissionCode` type.
  Check `src/access/permissions.generated.ts` — the code is generated from the backend's
  `@PreAuthorize` gates, so confirm whether `SHIFTS_VIEW_VARIANCE` appears there. If it does not,
  find out why before widening any type: the generator may key off `@PreAuthorize` annotations only,
  and this gate lives in a service `hasPermission(...)` call instead. Say what you find — that
  distinction is worth recording either way.
- Update the `screen-map.ts:12-15` note so it no longer states the opposite of the code. Whether
  the code belongs *in* the map is a separate question: it hides fields within a screen rather than
  a screen itself, so leaving it out may still be right — just not for the stated reason.

## Explicitly out of scope

Do not change `ShiftQueryService` or any backend file. The server behaviour is correct. This is a
frontend comment, a type bypass, and a stale note.

## Done when

- No comment in the repo claims `SHIFTS_VIEW_VARIANCE` is unenforced.
- The permission is read through the type-checked path, or there is a written reason in the file
  explaining precisely why it cannot be.
- `npm run build` is clean — it runs lint and `tsc -b`.
