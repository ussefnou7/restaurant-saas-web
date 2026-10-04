# Media attachments, and the remaining RTL screens

**Run date:** 2026-10-03 · **Operator:** Claude (finder role) · **Tenant:** A (`tagreba`, id 2)
**Database:** `restaurant_saas_mvp` @ Flyway v69 · Viewport 1440×900

---

## Media — 13/13 correct, no findings

Rules read from `MediaPurpose`: `PRODUCT_IMAGE` → owner `PRODUCT`, view `PRODUCTS_VIEW`, manage
`PRODUCTS_UPDATE`, **single-valued**, images only, **10 MB**, `DerivativeSet.FULL`.

### Upload validation

| Case | Result |
|---|---|
| valid 40×40 PNG → product 1 | `201`, `linkId 1`, `fileId 1` |
| second image to the same product | `201` — **replaces**, see cardinality below |
| text file sent with a **spoofed** `image/png` content type | `400 MEDIA_UNSUPPORTED_CONTENT_TYPE` |
| text file with its real `text/plain` | `400 MEDIA_UNSUPPORTED_CONTENT_TYPE` |
| 12 MB file against a 10 MB ceiling | `413 MEDIA_FILE_TOO_LARGE` |
| owner id 9999 | `404 MEDIA_OWNER_NOT_FOUND` |

The spoofed content type is the notable one — a declared `image/png` on a text payload is still
rejected, so the type is not taken on trust.

### Single-valued cardinality holds, and the replaced file is not leaked

After two uploads to product 1, `media_link` holds **one** row (id 2). Enforced by a partial
unique index:

```
uk_media_link_single  UNIQUE (owner_type, owner_id, purpose)
                      WHERE purpose IN ('PRODUCT_IMAGE','EMPLOYEE_PHOTO')
```

`media_file` holds only row 2; the superseded file's four storage keys were enqueued in
`media_deletion_queue` (`id, tenant_id, storage_key, enqueued_at`) for the deletion scheduler. Both
uuid folders are still on disk, which is expected — deletion is asynchronous.

### Derivatives and storage shape

| Variant | Dimensions | Bytes | Served as |
|---|---|---|---|
| `ORIGINAL` | 1200×1200 | 681,896 | `image/png` |
| `LARGE` | 1200×1200 | 287,273 | `image/jpeg` |
| `MEDIUM` | 800×800 | 165,162 | `image/jpeg` |
| `THUMB` | 200×200 | 18,939 | `image/jpeg` |

All four served `200` with correct content types; an unknown variant → `404`. Storage keys are
R2-shaped (`t2/product/<uuid>/original.png`) and **no URL is stored anywhere**, matching the
documented design.

### Permissions and tenant isolation

| Actor | Request | Result |
|---|---|---|
| cashier (no `PRODUCTS_UPDATE`) | upload | `403` |
| cashier (has `PRODUCTS_VIEW`) | `GET /api/media/2/THUMB` | `200` |
| tenant B | `GET /api/media/2/THUMB` | `404` |
| tenant B | upload to tenant A's product | `404` |
| tenant B | `GET /api/media/owners/PRODUCT/1` | `200` returning **`[]`** |
| tenant A | same request | full link with all four variants |

The `200 []` is correct — the query is tenant-scoped and simply finds nothing. Checked the body
specifically because a `200` on another tenant's owner id looked like a leak.

---

## RTL sweep — ten more screens

All `dir="rtl"`, **zero raw i18n keys on every one**:

| Route | Raw keys | Clipped |
|---|---|---|
| `/inventory` · `/inventory/stock-balances` | 0 | 0 |
| `/purchase` · `/purchase/invoices` | 0 | 0 |
| `/shifts` | 0 | 0 |
| `/expenses/categories` | 0 | 0 |
| `/sales` · `/orders` · `/menu` | 0 | 0 |
| **`/expenses`** | 0 | **4 — see L055** |

Combined with the six asset screens verified earlier, that is **16 screens** with no raw keys.

## L055 — the Void action is clipped out of the expenses list, and invisible in Arabic

### Cause

`styles/expenses.css:157-165`:

```css
.expenses-table__td--actions {
  position: sticky;
  inset-inline-end: 0;     /* correct — a logical property, works both directions */
  width: 110px;            /* the defect */
  white-space: nowrap;     /* prevents wrapping to a second line */
}
```

The cell renders at 150px; its two buttons need 234–247px.

### Measured

**Arabic / RTL** — cell spans `x 41 → 191`:

| Child | Position | Visible |
|---|---|---|
| `عرض التفاصيل` | `x 41 → 175`, w 133 | yes |
| **`إلغاء`** | **`x −41 → 41`**, w 82 | **none — entirely outside the cell, partly off-screen** |

**English / LTR** — cell spans `x 1249 → 1399`:

| Child | Position | Visible |
|---|---|---|
| `View Details` | `x 1266 → 1389`, w 123 | yes |
| **`Void`** | `x 1389 → 1468`, w 79 | **~10px of 79** |

So the bug exists in both directions and is **materially worse in RTL**, where the action is gone
entirely rather than reduced to a sliver.

### Why it matters

Void is the **only** correction mechanism for an expense — there is no edit and no delete. A
mis-entered expense cannot be corrected from the list it appears in.

**Workaround exists:** `ExpenseDetailPage` imports `ExpenseVoidModal` and `useCanVoidExpense`, so
the action is reachable by opening the expense. That keeps this at P1 rather than higher.

> The sticky-column mechanism itself is sound and uses the right logical property. Only the fixed
> `width` needs to accommodate both buttons — or the actions need to collapse into the `ActionMenu`
> component the codebase already has.
