# PROMPT — L056: no empty state when a tenant has no expense categories

> For **Flash**. Repo: `restaurant-saas-web`. Ledger row **L056**.
> Self-contained — you do not need the testing session's context.

## What happens today

A brand-new tenant has **zero** expense categories. Verified against a running stack: created a
fresh tenant and its owner, then `GET /api/expense-categories` returned `0`.

The owner opens **New expense** and sees a category dropdown rendering only its placeholder
(`expenses.create.categoryPlaceholder` → `"اختر التصنيف"` / `"Select category"`) with **no
options**. Nothing is disabled, nothing explains why the list is empty, and nothing links to the
categories page. `categoryId` is required by the API, so the form cannot be submitted — the user
is stuck with no signal about what to do.

## This is deliberate on the data side — do not "fix" it by seeding defaults

Expense categories used to include 13 seeded global defaults. They were deliberately removed when
categories became tenant-owned (backend commit `8e20e94`). The product owner's reasoning, recorded
2026-10-03: forcing a fixed taxonomy is wrong, because a tenant may legitimately file gas,
electricity and water together under a single "operations" heading. Categories being entered by
the tenant is the intended design.

**Scope is the empty state only.** Do not add seed data, do not restore globals, do not
auto-create a category.

## What to build

`src/pages/expenses/ExpenseCreatePage.tsx` — when the loaded category list is empty:

- Replace or accompany the dropdown with a clear empty state explaining that the tenant has no
  categories yet and that one must be created first.
- Link to the categories page (`/expenses/categories`), gated on the permission that page already
  requires — a user without `EXPENSES_CATEGORY_MANAGE` should be told to ask someone who has it,
  not shown a link they cannot use. `src/utils/expenseAccess.ts` has the hooks.
- Disable submit, so the failure is visible before the user fills the whole form.

Check `ExpensesListPage` and the expense creation **modal** path for the same gap — the list page
already has `filterEmptyTitle` / `filterEmptyDescription` wiring you can follow, and
`src/components/ui/EmptyState.tsx` exists.

## i18n

New keys go in **both** `src/i18n/locales/en/expenses.ts` and `src/i18n/locales/ar/expenses.ts`.
`useTranslation` has **no `defaultValue`** — a key present in one locale and missing from the
other renders as the raw dotted string to the user. There is a related open row (L045) about
exactly that, so do not add to it.

## Done when

- On a tenant with zero categories, `/expenses/new` shows an explanatory empty state, submit is
  disabled, and a permitted user gets a working link to create one.
- A user **without** `EXPENSES_CATEGORY_MANAGE` sees guidance rather than a dead link.
- Once one category exists, the form behaves exactly as it does today — no regression to the
  normal path.
- Both locales carry every new key.
