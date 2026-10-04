# S12 — Tenant isolation

**Run date:** 2026-10-03 · **Operator:** Claude (finder role)
**Database:** `restaurant_saas_mvp` @ Flyway v69

## Result: PASS — zero cross-tenant reads, zero cross-tenant writes, zero tenant writes to globals

**No findings filed.** This scenario satisfies the Phase 6 exit criterion *"S12 passes with zero
cross-tenant reads and zero tenant writes to global reference data"* outright.

## Fixtures — two fully independent tenants

| | Tenant A | Tenant B |
|---|---|---|
| id / code | 2 / `tagreba` | 3 / `tanya` |
| owner | `weaktest` (user 2), 99 perms | `ownerb` (user 3), 99 perms |
| branch | 1 (`TAGREBA-BR-01`) | 2 (`TANYA-BR-01`) |
| assets | 1 `Oven`, 2 `Wood Chair` · lines 1–4 | 3 `B Fridge` · line 5 |
| expenses | 1, 2, 3 | 4 |
| tenant expense categories | 14, 15 | 16 |

Both actors are `OWNER` — the maximum-privilege role, holding every active permission. Nothing
below is explained by a missing grant.

## Cross-tenant reads by id — 9/9 blocked

| Actor | Request | Result |
|---|---|---|
| A | `GET /api/branches/2` | `404 RESOURCE_NOT_FOUND` |
| A | `GET /api/assets/3` | `404 RESOURCE_NOT_FOUND` |
| A | `GET /api/assets/3/lines` | `404 RESOURCE_NOT_FOUND` |
| A | `GET /api/assets/3/lines/5` | `404 RESOURCE_NOT_FOUND` |
| A | `GET /api/expenses/4` | `404 EXPENSE_NOT_FOUND` |
| B | `GET /api/branches/1` | `404 RESOURCE_NOT_FOUND` |
| B | `GET /api/assets/1` | `404 RESOURCE_NOT_FOUND` |
| B | `GET /api/assets/1/lines/2` | `404 RESOURCE_NOT_FOUND` |
| B | `GET /api/expenses/2` | `404 EXPENSE_NOT_FOUND` |

`404` rather than `403` is the right answer — it does not confirm the id exists.

## Cross-tenant writes — 6/6 blocked

All attempted by A against B's rows:

| Request | Result |
|---|---|
| `POST /api/assets/3/lines/5/disposals` — dispose B's asset | `404 RESOURCE_NOT_FOUND` |
| `POST /api/assets/3/lines/5/maintenance` | `404 RESOURCE_NOT_FOUND` |
| `POST /api/assets/3/lines` — add a line to B's asset | `404 RESOURCE_NOT_FOUND` |
| `POST /api/expenses` with `branchId: 2` (B's branch) | `404 BRANCH_NOT_FOUND` |
| `POST /api/expenses` with `categoryId: 16` (B's private category) | `404 EXPENSE_CATEGORY_NOT_FOUND` |
| `POST /api/expenses/4/void` — void B's expense | `404 EXPENSE_NOT_FOUND` |

The fourth and fifth matter most: a *foreign-key field inside the payload* is validated against
the caller's tenant, not merely the path.

## List endpoints — correctly scoped in both directions

| Endpoint | A sees | B sees |
|---|---|---|
| `/api/assets` | `[2, 1]` | `[3]` |
| `/api/expenses` | `[3, 2, 1]` | `[4]` |
| `/api/assets/disposals` (flat, cross-asset) | 6 rows, all A's | 0 rows |
| `/api/assets/maintenance` (flat, cross-asset) | 3 rows, all A's | — |
| `/api/branches` | `[1]` | `[2]` |

The two flat cross-asset reads are the ones D51 calls out as deliberately not nested, so they
were the most likely place for a tenant filter to be forgotten. They hold.

## Reports — scoped, and arithmetically exact

| | A | B |
|---|---|---|
| `totalOriginalInvestment` | `55100.000000` | `9000.000000` |
| `totalCurrentValue` | `6050.000000` | `9000.000000` |

B's figures equal its single asset line exactly (1 × 9,000), with no trace of A's 55,100.

## Global reference data — readable, not writable

| Attempt (as tenant A `OWNER`) | Result |
|---|---|
| `PUT /api/inventory/material-categories/1` (global) | `403 ACCESS_DENIED` |
| `PATCH /api/inventory/material-categories/1/deactivate` | `403 ACCESS_DENIED` |
| `DELETE /api/uom/1` (global UOM) | `409 GLOBAL_UOM_NOT_DELETABLE` |
| `PATCH /api/uom/1/deactivate` | `403 ACCESS_DENIED` |
| `PUT /api/expense-categories/1` (global) | `409 EXPENSE_CATEGORY_IS_GLOBAL` |
| `PATCH /api/expense-categories/1/deactivate` | `409 EXPENSE_CATEGORY_IS_GLOBAL` |

### And the denial is scoped to *global* rows, not to the endpoint

Checked explicitly, because a blanket `403` would have meant a broken feature rather than a
working guard:

| Attempt | Result |
|---|---|
| `POST /api/inventory/material-categories` (tenant-owned) | `201`, `global: false` |
| `PUT` that tenant-owned row | `200` |
| `PATCH …/deactivate` that tenant-owned row | `200` |

So a tenant manages its own reference rows normally and only the shared catalogue is frozen.
That is the documented model in PROJECT.md → Vision.

## `X-Tenant-Id` cannot override the token

The earlier S8 check of this was weak because the rows involved were global. Repeated against
tenant-owned rows with a forged header:

| Header on A's token | `/api/assets` returns |
|---|---|
| *(omitted)* | `[2, 1]` |
| `X-Tenant-Id: 3` (B's real id) | `[2, 1]` |
| `X-Tenant-Id: 0` (system tenant) | `[2, 1]` |
| `X-Tenant-Id: 999` | `[2, 1]` |

Same for `/api/expenses` (`[3, 2, 1]` regardless). The header is ignored entirely; identity comes
from the signed JWT. Closed.
