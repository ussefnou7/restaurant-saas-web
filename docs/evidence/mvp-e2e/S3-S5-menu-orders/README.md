# S3 / S5 — Menu, recipes, and the POS order surface

**Run date:** 2026-10-03 · **Operator:** Claude (finder role) · **Tenant:** A (`tagreba`, id 2)
**Actor:** cashier `kashier1` (user 4) on device 1 · **Database:** `restaurant_saas_mvp` @ v69

## Orders — all three types, cancellation, and idempotency

| Case | Result |
|---|---|
| `DINE_IN` / `CASH` / 2 × 50 | `201`, `shiftId` **derived from the device's open shift** |
| `TAKEAWAY` / `CASH` / 1 × 50 | `201` |
| `DELIVERY` / `CARD` / 3 × 50 + customer phone & name | `201` |
| `CANCELLED` with stage + reason | `201` |
| `CANCELLED`, reason `OTHER`, **no note** | `400 CANCELLATION_NOTE_REQUIRED_FOR_OTHER` |
| `CANCELLED` with no `cancellationStage` | `400 CANCELLATION_DETAILS_REQUIRED` |
| `CANCELLED` with no `cancellationReason` | `400 CANCELLATION_DETAILS_REQUIRED` |
| **Replay of a used `idempotencyKey`** | `201` returning **the same order id**, no duplicate row |

The idempotency replay is the offline outbox's safety net — the POS generates the key before the
first attempt and retries on reconnect. It holds.

### Cancelled orders create no consumption — confirmed in the database

```
 id | order_type |  status   | payment_method | total  | shift_id        order_consumption_line
  1 | DINE_IN    | COMPLETE  | CASH           | 100.00 |        2        doc 1 ← order 1
  2 | TAKEAWAY   | COMPLETE  | CASH           |  50.00 |        3        doc 2 ← order 2
  3 | DELIVERY   | COMPLETE  | CARD           | 150.00 |        3        doc 2 ← order 3
  4 | DINE_IN    | CANCELLED | CASH           |  50.00 |        3        (none)
```

Order 4 has **no** consumption line. Orders 2 and 3 were correctly **batched into one warehouse
document**, which is the documented staging model.

### Shift cash math discriminates correctly

Shift 3: opening 100, one `CASH` order (50), one `CARD` order (150), one `CANCELLED` cash order (50).

```
cashSales = 50.0
salesByPaymentMethod = {CARD: 150.0, CASH: 50.0}
expected_cash = 150.000000   variance = 0.000000
```

Card revenue and the cancelled order are both excluded from the drawer while still visible to the
manager in `salesByPaymentMethod` and the orders list. `100 + 50 = 150`, closed at 150, variance 0.

## Recipes

`POST /api/menu/products/{id}/recipes` takes a **bare JSON array**, not an object. Correct shape →
`201` with `isActive: true`. Three malformed bodies — `{"items":[]}`, a bare string, and a type
mismatch on `materialId` — all returned **`500`**, which is documented open item **O30**
(*"Spring request-binding failures return HTTP 500 with a stack trace, app-wide"*). Confirmed E2E
on a real MVP path; not filed, since O30 already owns it.

## Variants and add-ons — the model works, one error message misleads

**Variants are separate products attached to a parent, not products sharing a name.** My first
attempt created two products both named `Juice` and got `409 DUPLICATE_PRODUCT_NAME`, because
`ProductService.assertNameAvailable` checks `existsByNameAndTenantId` — flat and tenant-wide.
That is **not** a defect: `ProductVariantsTab.tsx` only ever calls `updateProduct`, so the real
flow is *create a standalone product, then attach it* with `parentProductId` + `variantLabel`.
Redone correctly:

```
Juice Small (4) → PUT parentProductId=2, variantLabel=Small  → 200
Juice Large (5) → PUT parentProductId=2, variantLabel=Large  → 200
```

**Add-on host rule:** attaching `Mint` to variant 5 → `400 ADDON_HOST_MUST_BE_PARENT_ELIGIBLE`.
Attaching it to the parent (2) and to a standalone product (1) both → `201`. Add-ons bind at the
group level, not per variant. Correct.

**A variant-group parent can never be sold** — defence in depth, but diagnosed badly:

| Attempt | Result |
|---|---|
| order parent product 2 | `400 PRODUCT_HAS_NO_ACTIVE_RECIPE` |
| give parent 2 a recipe | `409` — refused |
| order parent 2 again | `400 PRODUCT_HAS_NO_ACTIVE_RECIPE` |

The parent cannot hold a recipe, so it can never pass the recipe gate. The outcome is right. But
`PARENT_PRODUCT_NOT_ORDERABLE` exists at `ProductService.java:195` and is **not** what the order
path reports — a cashier or integrator is told "no active recipe" when the real answer is "pick a
variant". Not filed as a defect (nothing incorrect is stored, and no bad path is reachable);
recorded because the diagnosis cost is real.

## Product-scope observation — every sellable item needs a recipe

`OrderService.resolveActiveRecipe()` (`:429-443`) is **unconditional**: every order line must
resolve an active recipe or the entire order is rejected. Verified — ordering `Mint`, a plain
resale product, returns `400 PRODUCT_HAS_NO_ACTIVE_RECIPE`.

This means **bottled water, canned soft drinks, packaged snacks and cigarettes cannot be sold**
until each is given a recipe. Those are ordinary restaurant revenue lines with nothing to cook.

**Not filed as a defect** — it is defensible design. A resale item modelled as a 1:1 recipe against
its own material gets stock tracking and COGS for free, which is consistent with the consumption
pipeline. It is recorded here because:

1. Nothing in the error text tells an operator that a 1:1 recipe is the intended answer.
2. It is a real onboarding burden that no document currently states, and the product owner should
   decide whether it is acceptable before a client is onboarded.
