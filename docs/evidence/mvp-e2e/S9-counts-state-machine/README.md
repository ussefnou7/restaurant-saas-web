# S9 — Physical count shortfall, state machine, branch scope, concurrent close

**Run date:** 2026-10-03 · **Operator:** Claude (finder role) · **Tenant:** A (`tagreba`, id 2)
**Database:** `restaurant_saas_mvp` @ Flyway v69

## Physical count — shortfall path correct

Count 2 froze at `expected_quantity = 6.200000`, was counted at `6.0`, and reconciled to a
shortfall of 0.2 KG valued at the current average:

```
COUNT_ADJUSTMENT | OUT | 200.000000 g | unit_cost 0.020000 | total_cost 4.000000
stock_balance: 6.200000 → 6.000000     average_cost 20.000000 (unchanged)
```

### A 1 KG discrepancy that was not one

The balance read `7.0` before this count and `6.0` after — a 1 KG move against a 0.2 KG
adjustment. Chasing it to the ledger explained it fully:

```
 8 | CONSUMPTION_SUMMARY | OUT | 800.000000 g | 16.000000 | 14:29:49.738
 9 | COUNT_ADJUSTMENT    | OUT | 200.000000 g |  4.000000 | 14:29:49.809
```

Consumption doc 2 posted in the same window — 800 g for orders 2 and 3 (1 plate + 3 plates ×
200 g). So `7.0 − 0.8 = 6.2`, which is exactly the frozen `expected_quantity`, then `−0.2` to
`6.0`. Every figure reconciles.

| Count | `expected_quantity` | `counted_quantity` | Adjustment |
|---|---|---|---|
| 1 | `6.600000` | `7.000000` | `IN` 400 g / 8.00 — surplus opened batch 3 at the average |
| 2 | `6.200000` | `6.000000` | `OUT` 200 g / 4.00 — shortfall valued at the average |

Both match the posted balance at their freeze moments. **No finding** — recorded because the
apparent mismatch would have been filed as a P0 without tracing the ledger. Third time this pass
that careful reading prevented a false positive (the others: `stock_balance.uom_id`, and the
purchase-price-drift consumer in L049).

## State machine — 7/7 illegal transitions blocked

| Document | Attempt | Result |
|---|---|---|
| Waste `POSTED` | `uncomplete` | `409 INVALID_STATE_TRANSITION` |
| Waste `POSTED` | `cancel` | `409 INVALID_STATE_TRANSITION` |
| Purchase invoice `POSTED` | `uncomplete` | `409 INVALID_STATE_TRANSITION` |
| Purchase invoice `POSTED` | `cancel` | `409 INVALID_STATE_TRANSITION` |
| Purchase invoice `POSTED` | `DELETE` | `409 INVALID_STATE_TRANSITION` |
| Physical count `RECONCILED` | `revert-to-draft` | `409 INVALID_STATE_TRANSITION` |
| Physical count `RECONCILED` | `cancel` | `409 INVALID_STATE_TRANSITION` |
| Purchase invoice `DRAFT` | `DELETE` | **`204`** — the one legal case, allowed |

## Branch scope — answers an open question, and compounds L040

A `BRANCH_MANAGER` (user 5) scoped to branch 1:

1. **Out of the box the seeded role holds no expense permission at all** — `GET /api/expenses` →
   `403 ACCESS_DENIED`. A tenant expecting branch managers to record expenses must grant it
   manually.
2. After granting `EXPENSES_VIEW`, the manager sees **only** the two branch-1 rows:

| Viewer | Rows |
|---|---|
| `OWNER` | `(6, br1, 100) (5, br1, 250) (3, —, 500) (2, —, 2300.5) (7, —, 11) (1, —, 15000)` |
| `BRANCH_MANAGER` @ branch 1 | `(6, br1, 100) (5, br1, 250)` |

Hiding company-level overhead — rent 15,000, electricity 2,300.50 — from a branch manager is
defensible. What is not is row **3: a `CASH_DRAWER` expense of 500 with no branch and no shift**
(L040). Cash left a till, and the person who reconciles that till cannot see the record at all.
Filed as a compounding note on L040, not as a separate row.

## L007 — concurrent close attempt, supporting but not conclusive

Two closes on shift 4 fired as concurrent background requests with different counts:

```
closingCount 777 → 200   (DB kept closing_count = 777.000000, status CLOSED, closed_by 4)
closingCount 999 → 409 SHIFT_ALREADY_CLOSED
```

The row lock at `ShiftService.java:163` held, and `:174` decided already-closed against committed
state. **The ledger row stays OPEN.** Parallel `curl` cannot be shown to have interleaved inside
the critical window, so a pass is weak evidence where a failure would have been conclusive —
exactly the distinction SHIFT_REVIEW_FOLLOWUP draws. A deterministic latch-based test is still
required.
