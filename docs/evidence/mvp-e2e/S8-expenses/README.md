# S8 — Expenses

**Run date:** 2026-10-03 · **Operator:** Claude (finder role) · **Tenant:** `tagreba` (id 2)
**Database:** `restaurant_saas_mvp` @ Flyway v69 · **Actor:** `weaktest` (OWNER, 99 permissions)

Scope note: this pass covers the **unlinked** expense paths (`BANK`, `CASH_ON_HAND`) and the
category/void/validation surface. The `CASH_DRAWER`-with-shift path needs a branch, device,
cashier and open shift and is deferred to the S7 build-up. The expense/close race (L008) is a
millisecond window and is not hand-reproducible — it needs the concurrency test, not this pass.

> **Correction recorded:** an earlier plan draft asserted expenses were untestable without a
> shift. That was wrong. `ExpenseService.java:231` returns early when `shiftId == null`, `branch_id`
> is nullable (`V54__expenses.sql:18`), and `CreateExpenseRequest.paidFromShiftId` is documented
> *"Optional — most expenses never come out of a drawer."* Rent/electricity/internet are the
> ordinary case, not an edge case. The product owner caught this.

## What held up

Recording the passes matters as much as the failures — this module has **one** integration test,
so none of the below was previously known to work against a real database.

**Validation — 7/7 rejected correctly, each with a named error code:**

| Case | Result |
|---|---|
| negative amount | `400 EXPENSE_INVALID_AMOUNT` |
| zero amount | `400 EXPENSE_INVALID_AMOUNT` |
| 7 decimal places | `400 VALIDATION_FAILED` |
| expense date in 2030 | `400 EXPENSE_DATE_IN_FUTURE` |
| category id 9999 | `404 EXPENSE_CATEGORY_NOT_FOUND` |
| branch id 9999 | `404 BRANCH_NOT_FOUND` |
| shift id 9999 | `404 EXPENSE_SHIFT_NOT_FOUND` |

**Void semantics — 4/4 correct.** Valid reason → `200 VOIDED` with the Arabic reason stored
verbatim. Missing `reason` field → `400 EXPENSE_VOID_REASON_REQUIRED`. Empty string → same.
Second void → `409 EXPENSE_ALREADY_VOIDED`.

> `VoidExpenseRequest.reason` carries only `@Size(max=500)` with no `@NotBlank`, which looked like
> the documented "reasoned void" was unenforced. It is enforced in the service instead. Concern
> dropped, not filed.

**Global category immutability — 2/2 correct.** `PUT /api/expense-categories/1` and
`PATCH /1/deactivate` on a global row both → `409 EXPENSE_CATEGORY_IS_GLOBAL`.

**Error-code translation — 6/6 present in both `en` and `ar`.** Checked against
`src/i18n/locales/{en,ar}/`; relevant because `useTranslation` has no `defaultValue`, so a missing
key renders raw.

**Unlinked expense creation works as designed.** Rent 15,000 via `BANK` with no branch and no
shift → `201`. Electricity 2,300.50 via `CASH_ON_HAND` with no branch → `201`.

**`X-Tenant-Id` header is not trusted.** Values `0`, `1` and `999` all returned the caller's own
data; tenant identity comes from the signed JWT. (Weak test — the rows involved were global.
Needs a second tenant with owned rows to close properly, in S12.)

## L040 — `CASH_DRAWER` expense accepted with no branch and no shift (P1)

### Repro

```bash
curl -s -X POST http://localhost:2020/api/expenses \
  -H "Authorization: Bearer $OWNER" -H 'Content-Type: application/json' \
  -d '{"categoryId":13,"amount":500,"expenseDate":"2026-10-02","paymentSource":"CASH_DRAWER"}'
```

→ `HTTP 201`, `{"id":3,"paymentSource":"CASH_DRAWER","branchId":null,"paidFromShiftId":null}`

### Why it matters

`paymentSource: CASH_DRAWER` is a claim that the cash came out of a till. A till belongs to a
branch and a till session is a shift. With both null the expense is **unreconcilable**: it enters
no shift's frozen expense sum and no branch's cash count can explain it. The drawer comes up
short at close with nothing pointing at the cause.

### Not an API-only hole — the UI produces it

- Backend: `grep -rn "CASH_DRAWER" src/main` returns **only the enum declaration**
  (`ExpensePaymentSource.java:4`). There is no backend logic coupling it to a branch or shift.
- Frontend: `ExpenseCreatePage.tsx:125-126` validates only that `paymentSource` is non-empty.
  Branch is never required. Line 154 sends `paidFromShiftId` only when `CASH_DRAWER` **and** a
  branch are selected — so choosing `CASH_DRAWER` and leaving the branch blank submits exactly
  this state.

## L041 — A tenant category may duplicate a global category's name exactly (P1)

### Repro

```bash
# global category id 1 is 'Rent' / 'إيجار', tenant_id NULL
curl -s -X POST http://localhost:2020/api/expense-categories \
  -H "Authorization: Bearer $OWNER" -H 'Content-Type: application/json' \
  -d '{"name":"Rent","nameAr":"إيجار تاني"}'
# => HTTP 201, id=15, global=false

# but a collision with the tenant's OWN row is caught:
  -d '{"name":"rENT","nameAr":"x"}'
# => HTTP 409 EXPENSE_CATEGORY_NAME_EXISTS
```

The category list the manager picks from now contains:

```
id=1   name=Rent   nameAr=إيجار        global=True
id=15  name=Rent   nameAr=إيجار تاني   global=False
```

### Cause

Both uniqueness indexes are **partial and non-overlapping**, verified against the live database:

```
uk_expense_category_global_name  ON (lower(name))            WHERE tenant_id IS NULL
uk_expense_category_tenant_name  ON (tenant_id, lower(name)) WHERE tenant_id IS NOT NULL
```

Global names are unique among globals. Tenant names are unique within the tenant. Neither index
spans both scopes, so the cross-scope duplicate is permitted.

### Why it matters

Two indistinguishable `Rent` entries in the creation dropdown. Expenses split across both, and
any per-category expense total silently reports rent in two halves. Rent is the single most
predictable recurring expense a restaurant has.
