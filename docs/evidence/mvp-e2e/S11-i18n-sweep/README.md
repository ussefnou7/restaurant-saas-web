# S11 — i18n coverage sweep (static)

**Run date:** 2026-10-03 · **Operator:** Claude (finder role)
**Method:** Phase 1 sweep 1.3 — extract every literal `t('…')` key from `src/**/*.{ts,tsx}`
(excluding `src/i18n/locales/`) and diff against the `en` and `ar` dictionaries.

This closes L014's standing caveat that *"coverage has never been measured."* It is now measured.

## Why a missing key is a user-visible defect here

`useTranslation` has **no `defaultValue`**. A key with no dictionary entry is echoed back
verbatim, so the UI renders the literal string `common.accessDenied` to the user.

## Dictionary symmetry — effectively complete

| | Count |
|---|---|
| `en` keys | 2,873 |
| `ar` keys | 2,872 |
| in `en`, missing from `ar` | **1** |
| in `ar`, missing from `en` | 0 |
| literal `t('…')` keys used in code | 2,029 |
| used keys present in `en` but not `ar` | **0** |

The single asymmetric key is `inventory.purchase.lines.notes` — the purchase-line notes label,
which PROJECT.md documents as a form-view-only field (`showIn: ['form']`). It renders raw in
Arabic.

This is a much better result than the module's reputation suggested. The gap is not broad
coverage; it is six specific keys.

## L045 — Six translation keys render raw to the user (P1)

### Five are absent from *both* dictionaries — they render raw in English *and* Arabic

| Key | Site | What the user sees |
|---|---|---|
| `common.accessDenied` | `ExpenseCategoriesPage.tsx:136` | inside `<div className="page-error-banner">` — an **error banner whose entire text is the literal key** |
| `expenses.categories.globalReadOnlyNotice` | `ExpenseCategoriesPage.tsx:279` | `title=` tooltip on every global category row |
| `orders.type.DINE_IN` | `SalesByHourReport.tsx:337` | `<option>` label in the order-type filter |
| `orders.type.TAKEAWAY` | `SalesByHourReport.tsx:338` | same dropdown |
| `orders.type.DELIVERY` | `SalesByHourReport.tsx:339` | same dropdown |

The sales-by-hour report's order-type filter therefore reads:

```
All order types
orders.type.DINE_IN
orders.type.TAKEAWAY
orders.type.DELIVERY
```

`SalesByHourReport.tsx:218` uses the same key template for the report's own summary line
(`t(`orders.type.${urlOrderType}`)`), so the broken label also appears in the report header once a
type is selected.

### One is absent from `ar` only

`inventory.purchase.lines.notes` — renders raw for Arabic users on the purchase-line form view.

### Severity note

The plan's P0 trigger is *"raw error text or a raw i18n key on a path a cashier hits."* These sit
on manager/admin surfaces — expense categories and sales reports — not a cashier path, so P1.
`common.accessDenied` is the closest to the P0 line: it is the **entire content of an error
banner**, so a manager denied access to expense categories is shown a dotted identifier instead of
an explanation.

### Relationship to L014

L014 records that enum values have no systematic translation keys (ROADMAP §6) and that coverage
was unmeasured. `orders.type.*` are three concrete confirmed instances of exactly that class.
L014's measurement caveat can now be dropped: the dictionaries are symmetric to within one key,
and the real exposure is the five keys above.

## Not covered by this sweep

- **Dynamic keys.** Only literal `t('…')` calls were extracted. Template-literal keys such as
  `t(`orders.type.${x}`)` are invisible to the scan — the three `orders.type.*` entries were found
  only because the same file also lists them literally. Other enum families built the same way
  would not be detected. A runtime sweep is the only way to close this.
- **Visual RTL.** Mirroring, the pinned actions column, number and date formatting, and clipped
  text are not checked here. See below.

## Visual RTL pass — completed 2026-10-03, clean

The earlier block is resolved. Route round: the repo's own `web-verify` config runs on **5189**,
which is **not in the backend's CORS allowlist** (`CorsConfig.java:20` permits
`5180, 5188, 5173, 192.168.1.28:5173, 192.168.100.34:5188, 192.168.100.34:5174`), so the app there
cannot reach the API at all. Ran on **5180** instead and seeded the session by calling
`/api/auth/login` from inside the page, writing `accessToken` / `authUser` / `tenantCode` and
`app-locale: ar` to `localStorage`.

> Two dev-config observations, not filed: `web-verify` ships pointing at a port the backend
> rejects, and the CORS default bakes in two **hardcoded private LAN addresses**. Same family as
> L034 (`.env.example` advertising port 8080).

**Result — `dir="rtl"`, `lang="ar"`, title `RestorO | الأصول`:**

| Check | Result |
|---|---|
| Sidebar and nav | mirrored to the **right**, icons right of their labels |
| Headings, breadcrumb, search, filters | right-aligned; placeholder `بحث`, magnifier on the right |
| Assets list headers | `الاسم · الفرع · التصنيف · الحالة · البنود · القيمة الحالية` |
| Enum values | `أثاث`, `معدات مطبخ`, `نشط`, `متخلص منه جزئيًا`, `متخلص منه بالكامل` — all translated |
| Number formatting | `6,050` with separator; arithmetic correct (17 chairs × 350 + 100) |
| Raw keys in visible text | **none** on the hub or the list |
| Clipped text at 1440×900 | **none** — no element with `scrollWidth > clientWidth` |
| Table overflow at 1440 | none. The assets *list* carries no pinned actions column; that convention applies to document **line** tables, not checked here |

### L045 confirmed live, not just by grep

On `/expenses/categories` the raw key is served to the user as a tooltip:

```
titleAttrs: [ "Internet & phone", "إنترنت وتليفون",
              "expenses.categories.globalReadOnlyNotice",   ← raw key, rendered
              "Rent", "إيجار", "إيجار تاني", "تعديل التصنيف", "تعطيل" ]
```

### L041 confirmed live

The same page lists both categories:

| اسم التصنيف (بالإنجليزية) | بالعربية | النوع | الحالة |
|---|---|---|---|
| `Rent` | `إيجار` | افتراضي عام | نشط |
| `Rent` | `إيجار تاني` | تصنيف مخصص | نشط |

**Mitigating detail:** the *list* page carries a `النوع` column distinguishing `افتراضي عام` from
`تصنيف مخصص`. The ambiguity that matters is the **creation dropdown**.

**Gap closed from source** (the dropdown would not open under automation).
`ExpenseCreatePage.tsx:89-94` builds every option as:

```ts
label: getExpenseCategoryDisplayName(c, locale)
```

and `utils/expenseDisplay.ts:3-13` returns **`nameAr` or `name` only**. No `global` flag, no type
marker — the very column the list page uses to disambiguate is absent from the picker.

Consequence, and it is worse than first assumed:

| Locale | Global id 1 | Tenant id 15 | Distinguishable? |
|---|---|---|---|
| `en` | `Rent` | `Rent` | **no — byte-identical** |
| `ar` | `إيجار` | `إيجار تاني` | only because the test gave it a different `nameAr` |

A tenant creating `Rent` / `إيجار` — the natural thing to type — produces two options that read
identically in **both** locales. This raises confidence in L041 rather than softening it.

## Previously blocked (superseded by the section above)

The browser-driven login could not be completed: values set on the three login inputs appear in
the DOM but React's controlled state does not pick them up, so clicking **Sign In** fires no
request to `/api/auth/login` (verified via the network log — no POST appears). No console errors,
button not disabled. This is harness friction, not an application defect, and no finding is filed
for it.

The visual RTL pass over the asset and expense screens therefore remains **outstanding** and needs
either an interactive browser session or a seeded `localStorage` token.
