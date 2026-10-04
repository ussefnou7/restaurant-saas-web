# S7 — Shift open / resume / blind close surface

**Run date:** 2026-10-03 · **Operator:** Claude (finder role) · **Tenant:** A (`tagreba`, id 2)
**Database:** `restaurant_saas_mvp` @ Flyway v69

## Fixtures

| | |
|---|---|
| Device | id 1, `Cashier Terminal 1`, branch 1. Raw secret returned once on create |
| Cashier | user 4, `kashier1`, role `CASHIER`, branch 1, **10 permissions** — `SHIFTS_ACCESS`, `SHIFTS_OPEN`, `SHIFTS_CLOSE`, `SHIFTS_VIEW`, and **not** `SHIFTS_VIEW_VARIANCE` |
| Shift | id 1, device 1, business date 2026-10-03, `openingCount` 1000, status `OPEN` |
| Linked expense | id 5, 250, `CASH_DRAWER`, `paidFromShiftId: 1`, `recordedAfterShiftClose: false` |

## L003 is fixed — the blind-count disclosure does not reproduce

This is the headline result. L003 is a **P0** that the ledger re-confirmed as `OPEN` on 2026-10-02.
It does not reproduce against a running stack.

### The same endpoint, two callers

`GET /api/shifts/1`:

| Field | `OWNER` (99 perms) | `CASHIER` (no `SHIFTS_VIEW_VARIANCE`) |
|---|---|---|
| `shift.openingCount` | `1000.0` | **absent from the object entirely** |
| `cashSales` | `0.0` | **`null`** |
| `expenses` | 1 row, amount `250.0`, category, payee, `recordedByName` | **`[]`** — despite expense 5 existing and being linked |
| `salesByPaymentMethod` | `{}` | `{}` |
| `orders` | `[]` | `[]` |
| `expensesAtClose` / `lateExpenses` / `explainedVariance` | `null` (shift still open) | `null` |

Every input L003 named as a reconstruction path — orders, payment methods, expenses, opening
count, cash sales — is withheld.

### The mechanism is a real server-side check

`ShiftQueryService.java` — its own javadoc at `:35` states *"**Variance visibility is decided
once, here.** `SHIFTS_VIEW_VARIANCE` is read at the…"*:

```java
:45  private static final String VIEW_VARIANCE = "SHIFTS_VIEW_VARIANCE";
:65  boolean canViewVariance = securityService.hasPermission(VIEW_VARIANCE);   // list
:75  boolean canViewVariance = securityService.hasPermission(VIEW_VARIANCE);   // detail
:88  List<ShiftOrderProjection>   orders   = canViewVariance ? … : …
:91  List<ShiftExpenseProjection> expenses = canViewVariance ? … : …
:110 ShiftListItemResponse.from(header, canViewVariance)
:111 canViewVariance ? salesByPaymentMethod(id, tenantId) : Map.of()
:112 canViewVariance ? scaled(orderRepository.sumCompletedCashByShift(…)) : null
:113 canViewVariance ? header.getExpensesAtClose() : null
:114 canViewVariance ? lateExpenses : null
:115 canViewVariance ? explainedVariance(header.getVariance(), lateExpenses) : null
```

Seven response fields plus the header projection, all gated on one server-side permission read.

### Why the ledger had it wrong

L003's 2026-10-02 re-confirmation cites `shiftAccess.ts:19-28` — a **frontend comment** — as
evidence. That comment is stale and is filed separately below. A code read of the wrong file is
not a scenario run; this is the exact failure mode MVP_HARDENING_PLAN warns about.

## L046 — A stale comment asserts the opposite of the code, and three artefacts depend on it (P2)

`src/utils/shiftAccess.ts:18-23` states:

> *"Variance is a display-only grant: **no endpoint enforces `SHIFTS_VIEW_VARIANCE`, the server
> sends the figures regardless.** Hiding the columns is a courtesy, not a control — which is also
> why the code is checked directly rather than through `hasPermission`, whose `PermissionCode` type
> only admits codes some endpoint enforces."*

Both sentences are false, as `ShiftQueryService.java:65,75` and the table above show. The wrong
belief has propagated into three places:

1. **`shiftAccess.ts:24-29`** deliberately bypasses `hasPermission` and reads
   `user.permissions.includes('SHIFTS_VIEW_VARIANCE')` directly, *because* the comment claims no
   endpoint enforces it. The consequence is real: the code escapes the `PermissionCode` type, so
   the compiler-as-drift-test that `screen-map.ts` describes does not cover it. If the backend
   renamed or dropped the gate, nothing would break the build.
2. **`screen-map.ts:12-15`** excludes `SHIFTS_VIEW_VARIANCE` from the screen map on the same
   premise — *"seeded but gate no endpoint … the server sends the value regardless"*.
3. **`MVP_LEAK_LEDGER.md` L003** was re-confirmed `OPEN` as a **P0** on the strength of (1).

Filed P2 because there is no user-facing defect — the control works. The cost is a misdiagnosed
P0 and a permission code outside the type system.

## Shift lifecycle guards

| Case | Result |
|---|---|
| open with a device-bound cashier token, `openingCount: 1000` | `201`, shift 1, `openedByUserId: 4` |
| open with a cashier token carrying **no** `deviceId` | `403 DEVICE_IDENTITY_REQUIRED` |
| second `POST /api/shifts/open` on the same device | `200` returning **the same shift** (resume, not a duplicate) |
| `openingCount: -50` | `400` |
| `GET /api/shifts/current` | `200`, returns shift 1 |

**`openedByUserId` comes from the token, not a header** — `ShiftController.java:33-36` documents
this and the run confirms it: user 4 is recorded with no `X-User-Id` sent. This is the module that
was migrated off the spoofable header (cf. L043 / O29).

### Resume does not overwrite the counted opening cash

The second open was sent with `openingCount: 2000`. The database still reads:

```
 id | device_id | status | opening_count | closing_count | opened_by_user_id | business_date
  1 |         1 | OPEN   |   1000.000000 |               |                 4 | 2026-10-03
عدد الورديات = 1
```

One row, `1000.000000` preserved, the `2000` discarded. A cashier re-opening cannot rewrite their
own counted figure.

### Two deliberate absences, both documented in the DTO

`CloseShiftRequest` is `closingCount` and nothing else:

- **No `pendingCount`** — D126's empty-queue precondition lives in the device's local storage and
  exposes no watermark, so *"a field the server cannot check reads as a verification and is not
  one."*
- **No `forcedClose`** — derived from `closedBy != openedBy` (D122), never accepted from the client.

## Close and the frozen sum — arithmetic exact, no findings

Closed as the opening cashier (user 4) with `closingCount: 700`. `forcedClose` correctly derived
as `false` since `closedBy == openedBy` (D122).

| Figure | Value | Check |
|---|---|---|
| `openingCount` | 1000 | as counted at open |
| `cashSales` | 0 | no orders in this shift |
| `expensesAtClose` | **250** | frozen at the one linked expense |
| `expectedCash` | **750** | `1000 + 0 − 250` ✓ |
| `closingCount` | 700 | as counted at close |
| `variance` | **−50** | `700 − 750` ✓ |

All six persisted to `shift` columns, verified in SQL — not merely computed in the response.

## The documented closed-shift guarantee holds

EXPENSES.md asserts: *"Closed shifts remain selectable and are labelled as links that **will not
rewrite the recorded close variance**."* This is the module's most explicit claim and was
unverified. It holds:

1. `GET /api/expenses/selectable-shifts` still returns shift 1 with `status: CLOSED` — selectable,
   and labelled as closed.
2. `POST /api/expenses` 100 against the closed shift → `201`, `paidFromShiftId: 1`,
   **`recordedAfterShiftClose: true`**.
3. The frozen columns are **untouched** — re-read from SQL after the late expense:

```
 opening_count | closing_count | expected_cash |  variance  | expenses_at_close
   1000.000000 |    700.000000 |    750.000000 | -50.000000 |        250.000000
```

`expenses_at_close` stayed `250`, not `350`. `variance` stayed `−50`.

### The derived reconciliation figure is coherent

| Field | Value |
|---|---|
| `variance` (frozen) | `−50.0` |
| `expensesAtClose` (frozen) | `250.0` |
| `lateExpenses` | `100.0` |
| `explainedVariance` | **`50.0`** |
| `expenses` | `[(5, 250.0, late=False), (6, 100.0, late=True)]` |

`explainedVariance = variance + lateExpenses` = `−50 + 100 = 50`. Reads correctly: the drawer was
50 short against the count, and 100 left it after the count was taken, so once the late record is
accounted for the drawer is 50 **over**. A manager gets both the immutable figure and the
reconciled one, and the two expenses are individually flagged.

## The cashier is blind after close too

Same `GET /api/shifts/1` with the cashier token, post-close:

```
closingCount = None   expectedCash = None   variance = None
openingCount = None   expensesAtClose = None   expenses = []
```

Nothing. So L003 is closed on both sides of the lifecycle — blind while open *and* blind after
close. A cashier cannot return to a settled shift and reconcile it.

> **Observed inconsistency, not filed.** The `POST /{id}/close` *response* does echo
> `openingCount: 1000.0` and `closingCount: 700.0` back to the closing cashier, while the detail
> `GET` hides both. Here it discloses nothing — this cashier typed both numbers. It would matter
> only if a *different* cashier resumed the device and closed, seeing an opening count they never
> entered. That case needs a second cashier on one device and is untested; recorded as a question
> rather than a defect because showing the closer what they are confirming may well be intended.

## Not yet covered

- `recordedAfterShiftClose` classification in **branch time**, with a branch in a timezone
  different from the tenant's (SHIFT_REVIEW_FOLLOWUP finding 5 territory).
- Force close by a second actor (`closedBy != openedBy` → `forcedClose = true`, needs
  `SHIFTS_FORCE_CLOSE`), and the second-cashier-resume-then-close case noted above.
- Two competing closes (L007) — needs concurrency evidence, not a hand run.
- The expense/close race (L008) — a millisecond window, not hand-reproducible.
- Orders in a shift: every figure above was checked with `cashSales = 0`. The arithmetic needs
  re-checking once real cash orders exist.
