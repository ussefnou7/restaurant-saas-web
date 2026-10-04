# PROMPT — L053: the POS and the admin web normalise phone numbers differently

> For **Flash**. Repos: **`restaurant-pos`** (primary) and `restaurant-saas-web` (reference).
> Ledger row **L053**. Evidence: `docs/evidence/mvp-e2e/S-tables-customers-rbac/README.md`.
> Self-contained — you do not need the testing session's context.

## Why this matters more than it looks

Customer identity **is** the phone number. The backend refuses a POS-local `customerId` and
resolves the customer by phone — recorded in `restaurant-saas/docs/PROJECT.md` → POS boundary. So
two clients that canonicalise a number differently create **two customers for one person**, and the
order history splits.

## The two implementations do not agree

**Admin web** — `restaurant-saas-web/src/utils/phoneValidation.ts`:

```ts
export const PHONE_LENGTH = 11
export const PHONE_PREFIX = '01'
export const EGYPT_PHONE_REGEX = /^01\d{9}$/
// normalizePhone(): strips non-digits, converts +20 / 0020 to a leading 0, caps at 11 digits
```

**POS** — `restaurant-pos/src/pos/usePos.tsx:1983`:

```ts
const normalizePhone = (phone: string) => phone.replace(/\D/g, '');
```

Non-digits only. No `+20` handling, no length rule.

| Input | Admin web | POS |
|---|---|---|
| `+201012345678` | `01012345678` | `201012345678` |
| `00201012345678` | `01012345678` | `00201012345678` |

Note also `src/pos/buildOrderRequest.test.ts:60`, whose fixture uses `customerPhone: '0100'` — a
four-digit value — which suggests nothing enforces length on what the POS actually sends.

## Proven against a running backend

Starting from customer id 2 = `01012345678`, these each created a **new** customer:
`+201012345678` → id 4 · `00201012345678` → id 5 · `0101 234 5678` → id 6 ·
**`01012345678 ` with one trailing space** → id 7. `not-a-phone` was accepted too.

Then `POST /api/orders` with `customerPhone: "+201012345678"` returned **`customerId = 4`** — the
duplicate, not the original.

The database has `uk_customer_tenant_phone UNIQUE (tenant_id, phone)`, but it compares the **raw
string**, so it offers no protection against any of the above.

## The work

1. **Find where the POS actually populates `customerPhone`** on the outgoing order. `usePos.tsx`
   uses `normalizePhone` for local lookup and matching, but I did not establish whether the
   normalised value or the raw keypad value is what reaches the request. Settle that first — it
   determines how much of this is real.
2. **Share one canonicalisation.** The admin web's version is the correct one (it handles the
   Egyptian country-code forms and caps the length). Port that behaviour into the POS rather than
   writing a third variant, and apply it at the point the value enters the order payload — not only
   at lookup time.
3. **Trim.** The trailing-space case produced a duplicate against an otherwise identical number.
   Whatever else changes, the value must be trimmed before it is sent or compared.

## Say this out loud in your commit message

The product owner's position, recorded 2026-10-03, is that the POS keypad enforces the format, so
this is being closed client-side. **That leaves the backend accepting any string**, including from
a future client, an integration, or a direct API call — the server neither validates nor
canonicalises. Fixing the POS removes the reachable path; it does not remove the hole. Make that
explicit so it stays a conscious decision rather than a forgotten one.

## Done when

- The POS and the admin web produce the **same** canonical string for `01012345678`,
  `+201012345678`, `00201012345678`, `0101 234 5678`, and a value with leading/trailing spaces.
- The canonical value is what goes into the order payload, not just what is used for local matching.
- A POS order for a customer the admin web already created resolves to the **existing**
  `customerId`, not a new one.
- The POS test suite stays green (`npm test` — 23 files, run by `.github/workflows/test.yml`), and
  the `'0100'` fixture is reviewed: either it is a valid case the code must still accept, or it
  should be corrected.
