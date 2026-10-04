# S4 — Stock in (purchase invoice) + API contract

**Run date:** 2026-10-03 · **Operator:** Claude (finder role) · **Tenant:** A (`tagreba`, id 2)
**Database:** `restaurant_saas_mvp` @ Flyway v69

## Fixtures

Warehouse 1 `TAGREBA-WH-0001` (BRANCH, branch 1) · Supplier 1 `TAGREBA-SUP-0001` ·
Material 1 `TAGREBA-MAT-0001` Carrot, **stock UOM GRAM (1)**, display UOM KILOGRAM (4).

> All three codes were **auto-generated** with the tenant prefix. This is direct supporting
> evidence for **L042**: the system already knows how to generate `TAGREBA-XX-NNNN`, yet branch
> creation demands the user type the prefix by hand and returns an untranslatable error if they
> don't.

## UOM conversion on posting — correct, and a false alarm avoided

Bought 10 **KILOGRAM** @ 20 of a material whose **stock** UOM is GRAM. `stock_balance.quantity`
read `10.000000`, which looks like a 1000× error. It is not:

| Row | Quantity | UOM | Unit cost | Value |
|---|---|---|---|---|
| `inventory_transaction` | `entered 10` / **`stock_quantity 10000`** | entered 4 (KG) / **stock 1 (GRAM)** | `0.020000` | 200 |
| `stock_balance` | `10.000000` | **`uom_id = 4` (KG)** | `20.000000` | 200 |
| `stock_batch` | `10.000000` (inherits balance UOM) | — | `20.000000` | 200 |

`stock_balance` carries its **own `uom_id` column** set to the material's display UOM. Ledger is in
stock UOM, balance in display UOM, both self-labelled, value identical. `InventoryLedgerService.java:83`
does the conversion via `uomConversionService.convertToStockUom(...)`. **No finding** — recorded
because assuming the balance was denominated in stock UOM would have produced a false P0.

Lifecycle DRAFT → COMPLETE → POSTED all returned `200`, `postedToInventory: true`, total 200.

## L047 — A future-dated purchase invoice posts to inventory and corrupts today's average cost (P0)

### Repro

```bash
# 1. header dated four years out — accepted
POST /api/inventory/purchase-invoices
{"supplierId":1,"warehouseId":1,"invoiceDate":"2030-01-01","receiptDate":"2030-01-01"}
# => 201, id=2

# 2. the whole lifecycle then succeeds
POST /api/inventory/purchase-invoices/2/lines  {"materialId":1,"quantity":5,"uomId":4,"unitCost":30}  # 200
POST /api/inventory/purchase-invoices/2/complete                                                      # 200
POST /api/inventory/purchase-invoices/2/post                                                          # 200, posted=true
```

### Damage, read from the database

```
 quantity  | uom_id | average_cost | last_purchase_date
 15.000000 |      4 |    23.333333 | 2030-01-01 00:00:00

 id | original_qty | remaining | unit_cost |    movement_date    | warehouse_entry_date | status
  1 |           10 |        10 | 20.000000 | 2026-10-01 00:00:00 | 2026-10-01           | OPEN
  2 |            5 |         5 | 30.000000 | 2030-01-01 00:00:00 | 2030-01-01           | OPEN
```

1. **Today's average cost is wrong.** `23.333333` = (10×20 + 5×30)/15. PROJECT.md states average
   cost is derived from **OPEN batches only**; the 2030 batch is `OPEN`, so goods not yet owned
   price today's stock. This feeds COGS, stock valuation, shrinkage and loss-comparison.
2. **Stock quantity is wrong** — 15 KG on hand when 10 were received.
3. **`last_purchase_date` / `last_purchase_price`** now anchor the purchase-price-drift report to a
   2030 price.
4. **FIFO order is driven by `movement_date`**, which comes from the unvalidated `receiptDate`.

### A second, independent date hole on the same endpoint

```bash
{"supplierId":1,"warehouseId":1,"invoiceDate":"2026-10-01","receiptDate":"2025-01-01"}
# => 201
```

Goods received a year **before** the invoice was issued. Since `receiptDate` sets `movement_date`,
a backdated receipt inserts a batch *ahead of consumption that already happened* — the exact
situation `PurchaseInvoiceService`'s own `backdated-consumption-check` endpoint exists to detect.

### The platform already solves this correctly three times over

| Module | Future business date | Result |
|---|---|---|
| Waste document | `2030-01-01` | `400 VALIDATION_FAILED` |
| Physical count | `2030-01-01` | `400 VALIDATION_FAILED` |
| Expense | `2030-01-01` | `400 EXPENSE_DATE_IN_FUTURE` |
| **Purchase invoice** | `2030-01-01` | **`201`, posts to stock** |
| **Assets** (3 date fields) | `2030-01-01` | **`201`** (L044) |

So this is not an unconsidered case. Three modules enforce it; the two that touch the costing
engine and the fixed-asset register do not.

## L048 — Unknown JSON fields are silently ignored app-wide (P1)

No `FAIL_ON_UNKNOWN_PROPERTIES` setting exists anywhere in `src/main`, so Jackson's permissive
default applies to every endpoint.

### Proved on two modules

```bash
POST /api/expenses
{"categoryId":1,"amount":11,"expenseDate":"2026-10-01","paymentSource":"BANK",
 "totallyFakeField":"xxx","amuont":99999,"branchID":9999}
# => 201   stored: amount = 11.0,  branchId = null
```

`amuont` (typo of `amount`) and `branchID` (wrong casing of `branchId`) were both discarded. The
caller asked for a branch expense of 99,999 and silently got a **tenant-level unbranched expense
of 11** — with a success response. That is L040's orphan state reached by accident.

```bash
POST /api/assets {"branchId":1,"name":"Typo Test","categorie":"FURNITURE","category":"FURNITURE","nonsense":{"a":1}}
# => 201
```

### Compounded by dead API surface

`PurchaseInvoiceRequest` declares `lines` and `invoiceNumber`. `grep -rn PurchaseInvoiceRequest src/main`
outside its own file returns **nothing** — the live endpoint binds `PurchaseInvoiceHeaderRequest`,
which has neither field. So a client written from that DTO posts an invoice with lines, receives
`201`, and creates an **empty invoice with zero totals**. Confirmed: `purchase_invoice_line` count
was `0` after my first create, and `PurchaseInvoiceService.create():113` comments *"No lines on
create — totals will be zero until lines are added."*

`invoiceNumber` is likewise generated server-side (`:112`, via `documentSequenceService`), and the
comment at `:419` confirms it is "system-generated on create() and preserved across updates". My
submitted `"INV-001"` was replaced by `PI/26/000001`.

## Unpost — the guard is excellent; one field is left stale

### Blocked correctly when the batch has been consumed

Batch 1 had 0.4 KG drawn by order consumption. `POST /api/inventory/purchase-invoices/1/unpost`:

```json
{ "errorCode": "UNPOST_BLOCKED_BATCH_CONSUMED",
  "params": { "entityType": "PurchaseInvoice", "invoiceId": 1,
              "consumedBatches": [{ "materialName": "Carrot", "batchId": 1, "consumedQuantity": 0.4 }] } }
```

`409`, a **named** error code, and structured `params` the UI can render into a specific sentence.
Both locales carry the key and `utils/errors.ts` has a dedicated `ConsumedBatch` renderer. This is
the exact opposite of L042's `LEGACY_ERROR` with `params: {}` — the pattern L042 should copy.

### Reverses the ledger-derived state correctly

Unposting invoice 2 (the 2030 one, batch untouched) → `200`, `status: COMPLETE`,
`postedToInventory: false`:

| Field | Before | After | Correct? |
|---|---|---|---|
| `stock_balance.quantity` | `14.600000` | `9.600000` | ✓ |
| `stock_balance.average_cost` | `23.424658` | `20.000000` | ✓ — L047's contamination fully reversed |
| `stock_batch` id 2 | present | **deleted** | ✓ |

## L049 — `unpost` leaves `last_purchase_price` / `last_purchase_date` stale (P1)

Same unpost, same row, the two denormalised fields were **not** recomputed:

```
 quantity | average_cost | last_purchase_price | last_purchase_date
 9.600000 |    20.000000 |           30.000000 | 2030-01-01 00:00:00
```

The only invoice still posted is id 1 — `PI/26/000001`, `receipt_date 2026-10-01`, 10 KG @ **20**:

```
 id | invoice_number |  status  | posted_to_inventory | invoice_date | receipt_date
  1 | PI/26/000001   | POSTED   | t                   | 2026-10-01   | 2026-10-01
  2 | PI/26/000002   | COMPLETE | f                   | 2030-01-01   | 2030-01-01
  3 | PI/26/000003   | DRAFT    | f                   | 2026-10-01   | 2025-01-01
```

So the balance reports a last purchase of 30 on 2030-01-01 sourced from a document that is no
longer posted. The pair is written on post and never recalculated from what remains posted —
the dates in this run made the discrepancy obvious but the mechanism is date-independent.

**Impact — corrected after testing the reports.** My first write-up named
`PurchasePriceDriftReport` as the victim. That was **wrong**, and the correction is recorded here
rather than quietly edited away:

```
GET /api/inventory/reports/purchase-price-drift
→ firstPrice 20.000000 · lastPrice 20.000000 · changePercent 0.000000
  firstPurchaseDate 2026-10-01 · lastPurchaseDate 2026-10-01
```

The report derives its prices from the **posted invoices**, not from these columns, so it is
correct. The stale pair surfaces on the **stock detail read** instead:

```
GET /api/inventory/warehouses/1/stocks/1
→ "lastPurchasePrice": 30.0,  "lastPurchaseDate": "2030-01-01T00:00:00"
```

That is a user-facing screen reporting a last purchase from a document that is no longer posted.
Severity is unchanged — a stored field contradicting posted reality on a screen a manager reads —
but the consumer is the stock screen, not the drift report.

Note the contrast that makes this fixable: `average_cost` *is* recomputed from OPEN batches on
unpost, so the engine already knows how to recover derived values. These two fields simply are not
part of that recovery.

> **Related gap, not filed as a defect:** `purchase_invoice` has **no column for the supplier's own
> invoice reference** — `invoice_number` holds the internal sequence. A tenant reconciling against
> a supplier's paper invoice has nowhere to record its number. The dead DTO suggests someone
> intended the field to be caller-supplied. Product decision, not a bug.
