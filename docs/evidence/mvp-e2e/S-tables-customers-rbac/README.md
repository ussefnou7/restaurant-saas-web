# Tables, customers, and permissions

**Run date:** 2026-10-03 · **Operator:** Claude (finder role) · **Tenant:** A (`tagreba`, id 2)
**Database:** `restaurant_saas_mvp` @ Flyway v69

## L053 — Customer phone is never normalised or validated server-side, so one person becomes many customers (P1)

### The rule exists, but only in the browser

`restaurant-saas-web/src/utils/phoneValidation.ts`:

```ts
export const PHONE_LENGTH = 11
export const PHONE_PREFIX = '01'
export const EGYPT_PHONE_REGEX = /^01\d{9}$/
// normalizePhone() strips non-digits and handles +20 / 0020 prefixes
```

`grep -rn phone src/main/.../loyalty/ | grep -i "pattern|valid|regex"` → **nothing**. The backend
neither validates the format nor normalises the value.

### Repro — the same human, five customer records

Starting from customer id 2, `01012345678`:

| `POST /api/loyalty/customers` phone | Result |
|---|---|
| `+201012345678` | `201` → **new** customer id 4 |
| `00201012345678` | `201` → **new** customer id 5 |
| `0101 234 5678` | `201` → **new** customer id 6 |
| `01012345678 ` (one trailing space) | `201` → **new** customer id 7 |
| `not-a-phone` | `201` → customer id 3 |

```
 id |     phone      |    name
  2 | 01012345678    | محمد
  3 | not-a-phone    | س
  4 | +201012345678  | محمد
  5 | 00201012345678 | محمد
  6 | 0101 234 5678  | محمد
  7 | 01012345678    | محمد     ← trailing space
```

### A unique index exists and gives false comfort

```
uk_customer_tenant_phone  UNIQUE (tenant_id, phone)
```

It compares the **raw string**, so `01012345678` and `01012345678 ` are distinct values and both
rows were accepted. "Phone is unique per tenant" is true only for byte-identical input.

### Confirmed on the POS order path — the one that matters

Customer identity is the phone: PROJECT.md records that the backend *"does not accept a POS-local
`customerId` — it resolves the customer by phone/name."*

```
POST /api/orders  { "customerPhone": "+201012345678", "customerName": "محمد", … }
→ 201,  customerId = 4
```

The order was attached to the **duplicate**, not to id 2. A customer who orders once through the
admin web (normalised to `01012345678`) and once through the POS with a `+20` prefix has their
history split across two records. Loyalty, order history and customer lookup all fragment, and the
POS is a separate application that does not share the browser's `normalizePhone`.

## L054 — Two tables may carry the same name in the same section (P2)

```
POST /api/tables {"branchId":1,"name":"T1","sectionId":1,"capacity":4} → 201 id=1
POST /api/tables {"branchId":1,"name":"T1","sectionId":1,"capacity":2} → 201 id=2
```

Two tables called `T1` in the same hall. Orders bind by `tableId` so stored data stays correct,
but the floor plan and the dine-in table picker show two identical labels with no way to tell them
apart. Same shape as L041 (duplicate expense category names).

## What held up

**Tables and sections:**

| Case | Result |
|---|---|
| create section | `201` |
| create table | `201` |
| capacity `-5` | `400 VALIDATION_FAILED` |
| capacity `0` | `400 VALIDATION_FAILED` |
| non-existent `sectionId` | `404 SECTION_NOT_FOUND` |

**Customers:**

| Case | Result |
|---|---|
| empty phone | `400 VALIDATION_FAILED` |
| **re-posting an identical phone** | `201` returning the **same** customer id — an upsert, not a duplicate |

The upsert-by-phone behaviour is correct and is exactly why L053 matters: the matching key is
never canonicalised, so the upsert only works when the caller happens to send the identical string.

> Minor, not filed: re-posting an existing phone with a different `name` returns the stored name
> and silently discards the new one.

## Permissions — 20/20 correct, no findings

Actors: `OWNER` (99 permissions) · `BRANCH_MANAGER` user 5 granted exactly
`EXPENSES_VIEW`, `SHIFTS_VIEW`, `ORDERS_VIEW` · `CASHIER` user 4 (10 permissions).

**Enforcement — the granted permission works, everything else is denied:**

| Actor | Request | Result |
|---|---|---|
| branch manager | `GET /api/expenses` (**has** `EXPENSES_VIEW`) | `200` |
| branch manager | `POST /api/expenses` (no `EXPENSES_CREATE`) | `403` |
| branch manager | assets · materials · users · employees · branches · devices | `403` ×6 |
| cashier | expenses · assets · users · purchase invoices · sales report | `403` ×5 |

**Privilege escalation — every path blocked:**

| Attempt | Result |
|---|---|
| branch manager grants **himself** `USERS_CREATE`, `ASSETS_MANAGE`, `USER_PERMISSIONS_UPDATE` | `403 ACCESS_DENIED` |
| branch manager grants the cashier `ASSETS_MANAGE` | `403 ACCESS_DENIED` |
| branch manager rewrites the `OWNER` role's permissions | `404` — the roles route is not exposed to tenants |
| cashier grants himself `ASSETS_MANAGE` | `403 ACCESS_DENIED` |
| cashier creates a new user with `roleCode: OWNER` | `403 ACCESS_DENIED` |
| branch manager opens `/api/admin/tenants` | `403 ACCESS_DENIED` |
| **`OWNER` (99 permissions) creates a tenant** | **`403 ACCESS_DENIED`** |

The last row matters most: the most privileged account a tenant can hold still cannot cross into
system administration. The `isSysAdmin()` boundary holds, which is the same separation that
`AuthService.java:104-106` enforces on the login path.
