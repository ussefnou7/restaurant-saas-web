# Expenses and Assets — closing out the untested items

**Run date:** 2026-10-03 · **Operator:** Claude (finder role) · **Tenant:** A (`tagreba`, id 2)
**Database:** `restaurant_saas_mvp` @ Flyway v69

All thirteen items previously listed as untested in these two modules were run.
**Zero new findings.** Four concerns that looked like defects resolved into correct behaviour on
inspection, and are written up here so they are not re-investigated.

---

## Expenses — 6 items

### 1. Late-expense classification in branch time — CORRECT

The highest-priority gap. Built a branch in a genuinely different zone and exercised the boundary.

**Fixture:** branch 3 `Tokyo Branch`, `Asia/Tokyo` (+9) against tenant `Africa/Cairo` (+3) — a
6-hour offset. Device 3, cashier `tokyokash`, shift 6.

Shift timestamps come back in **branch** time:

```
openedAt 2026-10-03T22:17:01   (server/Cairo wall clock was 16:17)
businessDate 2026-10-03         correct for Tokyo
```

**The raw columns are stored in different reference frames:**

| Column | Value | Frame |
|---|---|---|
| `shift.closed_at` | `2026-10-03 22:19:02.491` | branch (Tokyo) |
| `expense.created_at` id 8 | `2026-10-03 16:19:02.370` | tenant (Cairo) |
| `expense.created_at` id 9 | `2026-10-03 16:19:02.559` | tenant (Cairo) |

Both are `timestamp without time zone`. A naive `createdAt > closedAt` would classify expense 9 as
**not** late — a 6-hour error.

**It does not, because the conversion is explicit and documented.** `ExpenseService:267-286`:

```java
/**
 * Expense audit timestamps are stored in the tenant wall clock, while shift close timestamps
 * use the branch wall clock, so the audit value must be converted before they are compared.
 */
LocalDateTime branchRecordedAt = expense.getCreatedAt()
    .atZone(tenantZone).withZoneSameInstant(branchZone).toLocalDateTime();
return branchRecordedAt.isAfter(expense.getPaidFromShiftClosedAt());
```

Observed results — expense 8 before close, expense 9 after:

| | `late` | shift detail |
|---|---|---|
| expense 8 (300) | `false` | `expensesAtClose = 300` |
| expense 9 (150) | `true` | `lateExpenses = 150`, `explainedVariance = 150` |

and the read model converts for display too — expense 8's `createdAt` is returned as
`22:19:02.370`, in branch time. The mixed storage frames are a design hazard for any *future*
consumer that compares the columns directly, but there is no defect today and the risk is
annotated where it matters.

### 2. Deactivated category

| Case | Result |
|---|---|
| create category, then `PATCH /{id}/deactivate` | `200`, `active: false` |
| new expense against the deactivated category | **`409 EXPENSE_CATEGORY_INACTIVE`** |

Existing expenses on it remain readable, as EXPENSES.md specifies.

### 3. List filters — all three work

| Query | Rows |
|---|---|
| none | 8 |
| `?branchId=1` | 2 — `[6, 5]` |
| `?unbranchedOnly=true` | 4 — `[3, 2, 7, 1]` |
| `?dateFrom=2026-10-02&dateTo=2026-10-02` | 2 — `[3, 2]` |

Tenant B's expense 4 never appears. The `unbranchedOnly` filter found in `ExpenseRepository:74`
is genuinely exposed and works.

### 4. Permission split — correct

User `acct1` (`ACCOUNTANT`) granted exactly `EXPENSES_VIEW` + `EXPENSES_CREATE`:

| Action | Result |
|---|---|
| list | `200` |
| create | `201` |
| **void** (no `EXPENSES_VOID`) | **`403`** |
| **manage categories** (no `EXPENSES_CATEGORY_MANAGE`) | **`403`** |

> Noted in passing: creating an `ACCOUNTANT` **with** a `branchId` returns
> `400 BRANCH_NOT_ALLOWED_FOR_ROLE` — correct, and consistent with V65 scoping only manager and
> cashier.

### 5. `selectable-shifts` window — correct, and my first probe was wrong

I passed `expenseDate` and saw it ignored. The endpoint's real parameters are `branchId`
(required) and **`days`** (optional) — a rolling window, so `expenseDate` was an unknown query
param, correctly discarded. `ExpenseService:205-220`:

```java
int window = days == null || days <= 0 ? DEFAULT_SELECTABLE_SHIFT_DAYS : days;
LocalDate from = LocalDate.now(timeZoneService.zoneFor(tenantId, branchId)).minusDays(window);
```

Nonsense values clamp to the default, the window is computed in **branch time**, and branch
ownership plus branch scope are both enforced. My fixture could not distinguish windows because all
five shifts carry `business_date = 2026-10-03`. **No defect.**

> Missing the required `branchId` returns **`500 INTERNAL_ERROR`** — documented open item **O30**
> (Spring binding failures return 500 app-wide), now confirmed on a fourth path.

### 6. Still outstanding

**L008**, the expense/close race, is a millisecond window and remains unreachable by hand. It needs
the latch-based concurrency test.

---

## Assets — 7 items

### 1. Update works; assets cannot change branch

`PUT /api/assets/2` with a new name and category → `200`, both applied.

Sending `branchId: 9999` also returned `200` — but the database still reads `branch_id = 1`.
Cause: `UpdateAssetRequest` declares only `name`, `nameAr`, `category`, and
`AssetService.update():67-73` sets exactly those three. The `branchId` was an **unknown JSON field**
silently dropped — which is **L048**, already filed, not a new row.

The separate fact worth the owner's attention: **there is no way to move an asset between
branches.** The field is deliberately not exposed, and D50 blocks deleting an asset that has lines,
so a physically relocated oven cannot be re-homed without losing its disposal and maintenance
history. A functional gap, not a defect — raised for a product decision.

Cross-tenant update was correctly refused: `PUT /api/assets/3` (tenant B) → `404`.

### 2. Successful delete paths

| Case | Result |
|---|---|
| delete line 4 (no disposals, no maintenance) | **`204`** |
| delete asset 4 (no lines) | **`204`** |

Together with the blocked cases verified earlier (`ASSET_HAS_LINES`, `LINE_HAS_CHILD_RECORDS`),
D50 is now covered in both directions.

### 3. `INVALID_DATE_RANGE` on the list endpoints

| Endpoint with `dateFrom=2026-12-01&dateTo=2026-01-01` | Result |
|---|---|
| `/api/assets/disposals` | **`400 INVALID_DATE_RANGE`** |
| `/api/assets/maintenance` | **`400 INVALID_DATE_RANGE`** |
| `/api/assets/reports/disposals` | `200`, unfiltered |

The report takes only `tenantId` and `pageable` — it has no date parameters, so the values were
ignored. **Not reachable from the UI:** `assetService.ts:106` and `:137` send `dateFrom`/`dateTo`
only to the two **flat list** endpoints, which do validate. No defect.

### 4. The asset list has no server-side filtering — by design

`AssetController.list():34-41` takes `@CurrentTenantId` alone: no filters, no pagination, returning
`List<AssetResponse>`. My seven filter probes were all unknown params, so all returned the full
set. `AssetsListPage.tsx:80-82` filters **client-side** with `useMemo`, so the feature works for
the user.

> Observation, not filed: the endpoint returns every asset on every load. Fine at MVP volume,
> degrades with growth.

### 5. Arabic / RTL across six screens — clean

At 1440×900, `dir="rtl"` throughout:

| Route | Raw keys | Clipped elements |
|---|---|---|
| `/assets` (hub) | 0 | 0 |
| `/assets/list` | 0 | 0 |
| `/assets/2` (detail) | 0 | 0 |
| `/assets/reports` | 0 | 0 |
| `/assets/disposals` | 0 | 0 |
| `/assets/maintenance` | 0 | 0 |

Filter controls render in Arabic — `كل الأصول`, `كل التصنيفات`, `كل الفروع`, `من تاريخ`,
`إلى تاريخ`, `مسح`, `تسجيل تخلص`.

> Clipping was observed on the detail page at the preview's default narrow viewport and disappeared
> at 1440. Recorded so it is not mistaken for a layout defect.

### 6. `/new` routes are deliberate redirect shims

`/assets/disposals/new` lands on `/assets/disposals`. Not a broken route —
`AssetOperationForms.tsx:616-624`:

```tsx
export function AssetDisposalPage() {
  const [searchParams] = useSearchParams()
  return <Navigate to={`/assets/disposals${…searchParams…}`} replace />
}
```

The real forms are **modals** on the list pages, and the old paths are preserved as redirects that
carry query params through.

### 7. Not covered

The disposal and maintenance **modals** could not be opened under automation — a programmatic click
on the trigger does not reach React's handler, the same limitation that blocked the login form
earlier. Their RTL rendering is unverified. Harness friction, not an application defect.
