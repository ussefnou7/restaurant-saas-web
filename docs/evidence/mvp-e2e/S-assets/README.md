# Assets — full manual pass

**Run date:** 2026-10-03 · **Operator:** Claude (finder role) · **Tenant:** `tagreba` (id 2)
**Database:** `restaurant_saas_mvp` @ Flyway v69 · **Branch:** id 1 (`TAGREBA-BR-01`)

Scope note: assets were **out of MVP** under M2. The product owner moved them in scope on
2026-10-03. This is the module's first exercise against a real database — its 53 existing tests
are all Mockito + controller-security with **zero `@SpringBootTest`**.

## Fixtures built

| Asset | Lines |
|---|---|
| id 1 — `Oven` / `فرن`, KITCHEN_EQUIPMENT | line 1 `Oven - North` qty 2 × 15,000 · line 2 `Oven - South` qty 1 × 18,000 |
| id 2 — `Wood Chair` / `كرسي خشب`, FURNITURE | line 3 `Chairs batch 1` qty 20 × 350 |

Derived values correct on creation: `totalCost = quantity × unitCost` (30,000 / 18,000 / 7,000),
`remainingQuantity` initialised to `quantity`, `status = ACTIVE`.

## Status derivation — correct through every transition

`asset.status` is documented as *"derived from aggregate line state, not written directly"*
(ASSETS.md). Verified by reading the DB columns directly after each disposal:

| Step | `asset#1` | `line1` | `line2` |
|---|---|---|---|
| initial | `ACTIVE` | `ACTIVE` (rem 2) | `ACTIVE` (rem 1) |
| dispose 1 of line 1 | `PARTIALLY_DISPOSED` | `PARTIALLY_DISPOSED` (rem 1) | `ACTIVE` (rem 1) |
| dispose line 1's last unit | `PARTIALLY_DISPOSED` | `FULLY_DISPOSED` (rem 0) | `ACTIVE` (rem 1) |
| dispose 1 of line 2 | `FULLY_DISPOSED` | `FULLY_DISPOSED` (rem 0) | `FULLY_DISPOSED` (rem 0) |

The third row is the aggregation case that matters — one line fully disposed while another is
still active correctly keeps the parent at `PARTIALLY_DISPOSED`. This is the module's hardest
logic and it holds.

## Guards — 8/8 correct

| Case | Result |
|---|---|
| disposal with `assetId=1` but `lineId=3` (belongs to asset 2) — D51 | `400 LINE_ASSET_MISMATCH` |
| dispose 5 from a line with 1 remaining — D48 | `409 DISPOSAL_EXCEEDS_REMAINING` |
| dispose from a line with 0 remaining | `409 DISPOSAL_EXCEEDS_REMAINING` |
| disposal quantity `0` | `400 VALIDATION_FAILED` |
| disposal quantity `-3` | `400 VALIDATION_FAILED` |
| delete an asset that has lines — D50 | `409 ASSET_HAS_LINES` |
| delete a line that has disposals — D50 | `409 LINE_HAS_CHILD_RECORDS` |
| delete a line that has maintenance — D50 | `409 LINE_HAS_CHILD_RECORDS` |

**D49 — maintenance never touches quantity: confirmed.** Recorded 1,200 maintenance against
line 3; `remaining_quantity` read `20.000000` before and `20.000000` after.

**D110 — no line update: confirmed.** `PUT /api/assets/1/lines/1` → `404`. (Returns
`RESOURCE_NOT_FOUND` rather than `405 Method Not Allowed`; cosmetic, not filed.)

## L043 — Asset audit columns are 100% null, and attribution is provably spoofable (P1)

This is **O29 territory, not a new defect class.** DECISIONS.md → O29 already states that
`createdBy`/`updatedBy` are hand-populated, that ~40% of services never do it, and that most
services read `userId` from `X-User-Id`, *"an optional, client-controlled header that is never
validated against the JWT"*. O29 is deliberately deferred behind the security work of sourcing
identity from the token. **Filed here only for the two parts this run adds.**

### Part 1 — proven exploitable, not just asserted

```bash
curl -s -X POST http://localhost:2020/api/assets/2/lines/3/disposals \
  -H "Authorization: Bearer $OWNER" -H 'X-User-Id: 999' \
  -H 'Content-Type: application/json' \
  -d '{"assetId":2,"assetLineId":3,"quantityDisposed":1,"reason":"SOLD","disposalDate":"2026-09-25"}'
```

→ `HTTP 201`. Database: `asset_disposal` id 4 carries `created_by = 999` — a user id that does
not exist in any tenant. The write-off is attributed to a phantom.

### Part 2 — for assets the column is not patchy, it is always empty

O29 describes partial coverage. For assets it is total:

```
 t           | id | created_by
-------------+----+------------
 disposal    |  1 |
 disposal    |  2 |
 disposal    |  3 |
 disposal    |  4 |        999   <- the spoofed one
 maintenance |  1 |
 expense     |  1 |          2
 expense     |  2 |          2
 expense     |  3 |          2
```

Cause: `AssetDisposalController.java:88` and `AssetMaintenanceController.java:88` take the actor
from `X-User-Id`, and the admin web app sends that header from only three services —
`physicalCountService.ts:27`, `inventoryService.ts:284`, `wasteDocumentService.ts:25`. `assetService`
does not. So every disposal and maintenance row written by the real UI has `created_by = NULL`.

By contrast `ExpenseService.java:152` sets it from `currentTenantProvider.getActorUserId()` — the
authenticated principal — and expense rows are correctly attributed.

### Why it matters for the MVP specifically

ASSETS.md documents `created_by BIGINT` on both tables as part of the schema, so the field reads
as populated. A disposal is a write-off: value leaving the books with a reason of `DAMAGED`,
`LOST`, `OBSOLETE` or `SOLD`. "Who wrote off this oven?" is unanswerable today, and nothing in the
UI indicates the information was never captured. For a product shipping a `LOSS_PREVENTION.md`,
an unattributable write-off is a hole in the core proposition.

## Observation — a code comment cites the wrong decision

`ShiftController.java:33-36` documents the correct pattern and scopes the fix:

> *"**No `X-User-Id` and no device parameter.** Both actors come from the signed token. The header
> is still whitelisted in CORS and still read by other controllers, so it is removed here only —
> the wider migration is out of scope (D123)."*

**D123 is "Expected figures and variances are never shown to the cashier"** (DECISIONS.md:4519) —
blind counts, nothing to do with actor identity. The wider header migration is tracked under
**O29** (DECISIONS.md:6187). A maintainer following that citation lands on the wrong decision and
would conclude the migration is tied to the blind-count work. One-word fix; not ledger-filed.

## Blast radius for context

`grep -rn 'X-User-Id' src/main` → **~65 `@RequestHeader` declarations across 17 controllers**,
including every inventory document path: `PurchaseReturnController` (10),
`PurchaseInvoiceController` (7), `WasteController` (9), `PhysicalCountController` (6). One of them,
`WarehouseController.java:168`, declares it **without** `required = false`.

Consistent with O29's own count of *"the 75 existing manual call sites."*

## Reports — both figures cross-check against raw SQL

ASSETS.md describes a single *"total-asset-value report"*. The endpoint actually returns **two**
figures, and both matched raw SQL exactly:

| `GET /api/assets/reports/summary` | SQL |
|---|---|
| `totalCurrentValue: 6650.0` | `SUM(remaining_quantity * unit_cost)` = `6650.000000` |
| `totalOriginalInvestment: 55000.0` | `SUM(total_cost)` = `55000.000000` |

This closes the "unspecified behaviour after partial disposal" question raised earlier — current
value *is* proportional to remaining quantity, and original investment is retained separately.
The doc undersells the endpoint; no defect.

`GET /api/assets/reports/disposals` is internally consistent: 350 + 18,000 + 15,000 + 15,000 =
48,350, and 55,000 − 48,350 = 6,650.

> The disposals report carries `assetName`, `assetLineLabel`, `quantityDisposed`, `reason`,
> `disposalDate` and `value` — and **no actor field at all**. So even the spoofed
> `created_by = 999` from L043 is not surfaced anywhere: the write-off history cannot answer
> "who" even when the column happens to hold a value.

## L044 — No chronological validation on any asset date; both report figures are corrupted (P1)

### Repro — five cases, all accepted

Line 3 was purchased `2026-02-01`.

| Request | Result |
|---|---|
| disposal dated `2025-01-01` — a year **before** the line was purchased | `201` |
| disposal dated `2030-01-01` — four years in the future | `201` |
| maintenance dated `2025-01-01` — before the asset existed | `201` |
| maintenance dated `2030-01-01` | `201` |
| **new asset line with `purchaseDate: 2030-01-01`** | `201` |

### The reports then report fiction

After adding a line purchased in 2030 for 100:

```json
{ "totalCurrentValue": 6050.0, "totalOriginalInvestment": 55100.0 }
```

Both figures include an asset the tenant does not own yet. Confirmed in SQL:

```
أسطر تاريخ شرائها مستقبلي: 1 بقيمة 100.000000
إخلاصات قبل تاريخ الشراء: 1
```

### `INVALID_DATE_RANGE` does not cover this

`AssetErrorCode.INVALID_DATE_RANGE` exists and is thrown twice, but
`AssetDisposalService.java:110-116` shows what it actually guards:

```java
private void validateDateRange(LocalDate dateFrom, LocalDate dateTo) {
    if (dateFrom != null && dateTo != null && dateFrom.isAfter(dateTo)) { … }
}
```

That is a **from/to filter pair** on the list endpoints. Nothing validates a stored
`disposal_date`, `maintenance_date` or `purchase_date` against the asset's own history or
against today.

### The platform already has this concept

Expenses reject a future business date with `EXPENSE_DATE_IN_FUTURE` — verified in the same
session (`expenseDate: 2030-01-01` → `400`). Assets do not apply the equivalent rule to any of
their three dates.

## Not yet covered

- Cross-tenant reads by id (S12, needs a second tenant).
- Arabic/RTL pass over the 7 asset screens.
- UI-level walk — everything above is API + database.
