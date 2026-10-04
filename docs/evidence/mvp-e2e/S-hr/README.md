# HR — salaries and salary adjustments

**Run date:** 2026-10-03 · **Operator:** Claude (finder role) · **Tenant:** A (`tagreba`, id 2)
**Database:** `restaurant_saas_mvp` @ Flyway v69

Scope note: HR is **out of MVP** under M2 and the product owner decided on 2026-10-03 to hide it
from the first release. Tested anyway at their request, to decide whether it could ship.
PROJECT.md:74 records that `SalaryService` and `SalaryAdjustmentService` have **no test
references** — this pass is their first exercise of any kind.

**Fixtures:** job 1 `Chef` / `طباخ` · employee 1 `Ahmed` / `أحمد`, branch 1, hired `2026-01-01`,
starting salary 5,000.

## L050 — An employee's salary can never be changed after the first one (P0 if HR ships)

### Repro — every date fails, past, present and future

First salary posts fine (nothing to supersede):

```
POST /api/hr/employees/1/salaries {"salaryAmount":6000,"effectiveFrom":"2026-03-01"} → 201
```

Every subsequent change fails, whatever the date (today is 2026-10-03):

| `effectiveFrom` | Result |
|---|---|
| `2026-06-01` (valid, past) | `409 DATA_INTEGRITY_VIOLATION` |
| `2026-09-01` (valid, past) | `409 DATA_INTEGRITY_VIOLATION` |
| `2026-10-02` (yesterday) | `409 DATA_INTEGRITY_VIOLATION` |
| `2026-10-04` (tomorrow) | `409 DATA_INTEGRITY_VIOLATION` |
| `2026-11-01` | `409 DATA_INTEGRITY_VIOLATION` |
| `2027-01-01` | `409 DATA_INTEGRITY_VIOLATION` |
| `2030-01-01` | `409 DATA_INTEGRITY_VIOLATION` |

The table still holds exactly one row. A raise, a cut, a correction — none can be recorded.

### Cause

The index:

```
ux_employee_salaries_active
  UNIQUE (tenant_id, employee_id) WHERE (active = true)
```

`SalaryService.createSalary()` (`:52-70`):

1. loads the current active salary and mutates it via `closeCurrentSalary()` — `effective_to =
   newEffectiveFrom.minusDays(1)`, `active = false`. A JPA dirty update, flushed at commit.
2. `salaryRepository.save(newSalary)` with `active = true` — an **INSERT**.

Hibernate's default flush ordering runs **INSERTs before UPDATEs**, so the new `active = true` row
hits the partial unique index while the old row is still `active = true` in the database. The
first salary succeeded only because there was no prior row to collide with — the employee's
starting 5,000 lives on the employee record, not in `employee_salaries`.

*Labelled as inference:* the ordering explanation is deduced from the evidence (first insert
succeeds, every later one fails on the only applicable constraint, regardless of date) rather than
read from a Hibernate log.

### The other guards are correct

These are rejected cleanly by the service, before the database:

| Case | Result |
|---|---|
| effective date **before** the current active salary's | `400 VALIDATION_FAILED` — `closeCurrentSalary():74-78` |
| the **same** effective date | `400 VALIDATION_FAILED` |
| before the hire date | `400 VALIDATION_FAILED` |
| amount `0` | `400 VALIDATION_FAILED` |
| amount `-500` | `400 VALIDATION_FAILED` |

So the validation layer is sound; the write path is broken.

## L051 — Salary adjustments accept impossible amounts and dates (P1 if HR ships)

Employee 1's active salary is 6,000.

| Request | Result |
|---|---|
| `ADDITION` 500, dated `2026-10-01` | `201` |
| `DEDUCTION` 200, dated `2026-10-01` | `201` |
| **`DEDUCTION` 999,999 against a 6,000 salary** | **`201`** — no cap of any kind |
| `DEDUCTION` 0 | `400 VALIDATION_FAILED` |
| `DEDUCTION` −100 | `400 VALIDATION_FAILED` |
| **`ADDITION` dated `2030-01-01`** | **`201`** — four years in the future |
| **`ADDITION` dated `2025-01-01`** | **`201`** — a year before the hire date of `2026-01-01` |

Three independent holes:

1. **No relationship to the salary.** A deduction may exceed it without limit. There is no payroll
   engine today (PROJECT.md: no pay run, no payslip), so nothing computes a negative net pay *yet*
   — which is precisely why this is cheap to fix now and expensive later.
2. **Future-dated adjustments** are accepted.
3. **Adjustments predating employment** are accepted.

Points 2 and 3 are the same family as L044 (assets) and L047 (purchase invoices): the codebase
validates business dates in waste, physical counts and expenses, and does not in assets, purchase
invoices, or HR adjustments.

## Leave balances and requests — mostly correct

Fixtures: leave type `ANNUAL` / `سنوية`, 21 default days. Generated balance for employee 1:
`assignedDays 21`, `usedDays 0`, `remainingDays 21`, year 2026.

**Eight checks passed:**

| Case | Result |
|---|---|
| 5-day request `2026-11-01→11-05` | `201`, `APPROVED` (requests default to approved, as documented) |
| balance after it | `usedDays 0 → 5`, `remainingDays 21 → 16` — **correct** |
| 30-day request against 16 remaining | `400 INSUFFICIENT_LEAVE_BALANCE`, balance untouched |
| `toDate` before `fromDate` | `400 VALIDATION_FAILED` |
| `daysCount: 99` for a 3-day range | `400 VALIDATION_FAILED` |
| **cancel an approved request** | `200 CANCELLED`, and `usedDays 5 → 0`, `remainingDays 16 → 21` — **the reverse path restores the balance** |
| new 3-day request | `201`, `usedDays 0 → 3` |
| `APPROVED → REJECTED` | `400 UNSUPPORTED_OPERATION`, balance unchanged |

`LeaveRequestStatus` carries `PENDING, APPROVED, REJECTED, CANCELLED`, but with requests defaulting
to `APPROVED` and no self-service submission path (PROJECT.md), `PENDING` and `REJECTED` look
unreachable in practice. Noted, not filed.

## L052 — Overlapping leave requests are approved, and the balance is charged for each (P1 if HR ships)

Request 2 (`2026-12-01 → 12-03`, 3 days) was already `APPROVED`:

| Request | Dates | Result |
|---|---|---|
| id 3 | **`2026-12-01 → 12-03` — identical** | `201 APPROVED` |
| id 4 | `2026-12-02 → 12-04` — overlapping | `201 APPROVED` |

`usedDays` went **3 → 9** for **4 distinct calendar days** (Dec 1–4). The employee is recorded as
on leave three times over the same dates, and 5 days of entitlement are consumed for days never
taken. No conflict check exists on either the same-type or any-type path.

> **Side observation, not filed:** leave dated `2025-01-01` (before the `2026-01-01` hire date) and
> `2030-01-01` both return `404 RESOURCE_NOT_FOUND`. They are rejected — but *accidentally*, because
> no balance row exists for those years, and the message points at a missing resource rather than an
> out-of-range date.

## Verdict for the ship decision

The owner asked whether HR could ship if it tested well. **It does not.** The single most basic
operation in the module — changing someone's pay — fails every time with a raw database
constraint error, and the money fields accept values that cannot be true. This is the strongest
possible support for the decision already taken to hide HR from the first release, and it is
exactly the risk PROJECT.md flagged when it recorded that these two services have no tests.
