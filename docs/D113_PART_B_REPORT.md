# D113 Part B — Frontend expiry and age report

Verification date: 2026-09-02 (Africa/Cairo). Frontend: `http://localhost:5188`. Backend: `http://localhost:2020`.

## Task 0 — Find the files

### Paths

1. Batch list screen and table:
   - `src/pages/inventory/WarehouseDetailsPage.tsx` — warehouse detail screen that mounts the stock panel.
   - `src/pages/inventory/WarehouseStocksPanel.tsx` — warehouse/material stock rows, batch loading, cache, and expandable sub-row.
   - `src/pages/inventory/WarehouseStockBatchSubRow.tsx` — the batch table itself.
   - `src/services/inventoryStockService.ts` — `getStockBalanceBatches`, calling `/api/inventory/stock-balances/{balanceId}/batches`.
2. Batch API type: `src/types/inventoryStock.ts`, `StockBatchResponse`.
3. Purchase invoice line form/grid and request/response types:
   - `src/pages/inventory/purchase-invoices/PurchaseInvoiceFormPage.tsx` — controller, API payload construction, and response-to-form mapping.
   - `src/schemas/purchaseInvoiceLineSchema.ts` — purchase line fields used by both views.
   - `src/components/layout/DocumentLayout/SchemaDocumentLinesCard.tsx` — selects grid or form view.
   - `src/components/layout/DocumentLayout/SchemaLineGrid.tsx` — grid renderer.
   - `src/components/layout/DocumentLayout/SchemaLineFormView.tsx` — form renderer.
   - `src/hooks/useDocumentLines.ts` — shared line state, dependency cascades, validation, and saves.
   - `src/types/purchaseInvoice.ts` — `PurchaseInvoiceLineResponse`, `PurchaseInvoiceLineRequest`, and `UpdatePurchaseInvoiceLineRequest`.
4. Material type: `src/types/inventory.ts`, `MaterialResponse`. It did **not** carry `expiryTracked` before Task 1. The live material JSON already did.
5. Feature locale files: `src/i18n/locales/en/inventory.ts` and `src/i18n/locales/ar/inventory.ts`. Error locale files: `src/i18n/locales/en/errors.ts` and `src/i18n/locales/ar/errors.ts`.
6. API error translation:
   - `src/utils/errors.ts` — `translateApiError`; it reads `errorCode` and `params`, and deliberately excludes server `message` from its return value.
   - `src/i18n/locales/en/errors.ts` and `src/i18n/locales/ar/errors.ts` — `errors.<errorCode>` mappings.
7. Transfer-related frontend files found before deletion:
   - Dead shell: `src/app/router.tsx`, `src/pages/inventory/transfers/TransfersPage.tsx`, `src/pages/inventory/transfers/TransferFormPage.tsx`, `src/services/inventoryTransferService.ts`, the transfer DTO section in `src/types/inventoryOperations.ts`, transfer keys in both inventory locale files, and transfer-only selectors in `src/styles/inventory.css`.
   - Related but not part of the shell: `src/pages/inventory/InventoryTransactionsPage.tsx`, `src/types/inventoryStock.ts`, `src/utils/inventoryStockDisplay.ts`, and the two inventory locale files contain the backend ledger values `TRANSFER_IN`/`TRANSFER_OUT`; `src/i18n/locales/en/reports.ts` contains prose mentioning possible future inter-branch transfers. These were retained because they do not call or navigate to the nonexistent transfer API.
   - There were no standalone transfer component files beyond the two pages.

### Observed live batch JSON

Called `GET /api/inventory/stock-balances/2/batches` once against the running backend. The first row was:

```json
{
  "ageDays": 53,
  "daysRemaining": null,
  "expiryDate": null,
  "id": 2,
  "movementDate": "2026-07-11T00:00:00",
  "originalQuantity": 40.000000,
  "remainingQuantity": 34.835000,
  "sourceInvoiceId": 2,
  "sourceType": "PURCHASE",
  "status": "OPEN",
  "unitCost": 200.000000,
  "uomSymbol": "kg",
  "warehouseEntryDate": "2026-07-11"
}
```

Exact observed field names: `daysRemaining` for remaining days, `ageDays` for age, `expiryDate` for expiry date, and `warehouseEntryDate` for the warehouse entry date.

## Task 1 — Update the TypeScript types

Changed files and additions:

- `src/types/inventoryStock.ts`, lines 62–65: `warehouseEntryDate: string`, `expiryDate: string | null`, `daysRemaining: number | null`, and `ageDays: number | null` on `StockBatchResponse`.
- `src/types/purchaseInvoice.ts`, line 20: `expiryDate: string | null` on `PurchaseInvoiceLineResponse`.
- `src/types/purchaseInvoice.ts`, line 69: `expiryDate: string | null` on `PurchaseInvoiceLineRequest`.
- `src/types/purchaseInvoice.ts`, line 89: `expiryDate: string | null` on `UpdatePurchaseInvoiceLineRequest`.
- `src/types/inventory.ts`, line 119: `expiryTracked: boolean` on `MaterialResponse`.

No existing fields were renamed or removed. The batch names exactly match the live JSON in Task 0, including the non-assumed age name `ageDays`.

## Task 2 — Two columns on the batch list

Changed `src/pages/inventory/WarehouseStockBatchSubRow.tsx` and the existing batch-table styles in `src/styles/inventory.css`.

- Added primary **Remaining** / **المتبقي** from `daysRemaining`, and secondary **Age** / **العمر** from `ageDays`.
- Both nullable values render `—`.
- Remaining sorts numerically in both directions with explicit null-last branches before direction handling.
- The single small-positive threshold is `SMALL_DAYS_REMAINING_THRESHOLD = 3`.
- Negative values use `var(--color-danger)` and an `AlertTriangle`, so the overdue state does not rely on a minus sign or color alone. Values `1..3` use `var(--color-warning)`. Age is uncoloured and unsorted.
- The sort control uses the existing `Button` and Lucide icons.

Browser-extracted order:

- Ascending: `[-1, 30, —, —]`.
- Descending: `[30, -1, —, —]`.
- `—` was last in both directions: confirmed `true` / `true`.

Screenshots:

- [English batch table](evidence/d113-part-b/task7-batches-en.png)
- [Arabic batch table](evidence/d113-part-b/task7-batches-ar.png)

## Task 3 — Expiry field on the purchase invoice line

Changed:

- `src/schemas/purchaseInvoiceLineSchema.ts` — added optional `expiryDate` form state and one date field shared by grid/form; its visibility resolves the selected material and requires `expiryTracked === true`. Its material dependency clears the date on material change.
- `src/pages/inventory/purchase-invoices/PurchaseInvoiceFormPage.tsx` — maps response dates into line state and sends `expiryDate` on both add and update.
- `src/types/lineSchema.ts` — added a conditional `visible` predicate.
- `src/components/layout/DocumentLayout/SchemaLineGrid.tsx` — conditionally includes the column and suppresses the field for untracked rows.
- `src/components/layout/DocumentLayout/SchemaLineFormView.tsx` — omits the entire field for an untracked active line.
- `src/hooks/useDocumentLines.ts` — skips validation for an invisible field.

There is no expiry-date validator and no client-side draft blocker.

Live draft-save evidence from invoice 44:

```json
{
  "request": {
    "quantity": 1,
    "uomId": 4,
    "unitCost": 200,
    "expiryDate": null
  },
  "httpStatus": 200,
  "returnedInvoiceStatus": "DRAFT"
}
```

Material-change interaction evidence in both locales: selecting tracked Butter changed the expiry input count to `1`; changing the same new line to untracked Chicken Breast changed it to `0`.

Screenshots:

- Grid: [tracked English](evidence/d113-part-b/task7-tracked-line-en.png), [untracked English](evidence/d113-part-b/task3-untracked-line-en.png), [tracked Arabic](evidence/d113-part-b/task7-tracked-line-ar.png), [untracked Arabic](evidence/d113-part-b/task3-untracked-line-ar.png).
- Form: [tracked English](evidence/d113-part-b/task3-form-tracked-en.png), [untracked English](evidence/d113-part-b/task3-form-untracked-en.png), [tracked Arabic](evidence/d113-part-b/task3-form-tracked-ar.png), [untracked Arabic](evidence/d113-part-b/task3-form-untracked-ar.png).

## Task 4 — Locale strings

Added matching keys to `src/i18n/locales/en/inventory.ts` and `src/i18n/locales/ar/inventory.ts`:

| Key | English | Arabic |
|---|---|---|
| `inventory.warehouses.stocks.batches.col.daysRemaining` | Remaining | المتبقي |
| `inventory.warehouses.stocks.batches.col.ageDays` | Age | العمر |
| `inventory.purchase.lines.expiryDate` | Expiry Date | تاريخ انتهاء الصلاحية |
| `inventory.warehouses.stocks.batches.sortAscending` | Sort remaining days ascending | رتّب الأيام المتبقية تصاعديًا |
| `inventory.warehouses.stocks.batches.sortDescending` | Sort remaining days descending | رتّب الأيام المتبقية تنازليًا |

No helper or empty-state text was introduced.

There is no locale-lint command in `package.json`. I ran `npm run lint`: zero errors and one pre-existing `react-hooks/exhaustive-deps` warning in `src/pages/tables/TableLayoutPage.tsx:199`. I also ran an exact source key-set comparison. All keys added in this task match, but the repository-wide sets do **not** match exactly because the pre-existing, unused English-only key `inventory.purchase.lines.notes` has no Arabic counterpart. Adding an unrelated dead key or deleting it would violate this task's fixed scope, so exact whole-repository parity is reported as blocked rather than falsely confirmed.

## Task 5 — Post-rejection error message

The needed mapping was already present in uncommitted workspace changes before this pass, in `src/i18n/locales/en/errors.ts` and `src/i18n/locales/ar/errors.ts`. It uses `{{materialName}}`, which is present in the live backend params:

- English: `Enter an expiry date for {{materialName}} before posting the purchase invoice.`
- Arabic: `أدخل تاريخ انتهاء الصلاحية للمادة {{materialName}} قبل ترحيل فاتورة الشراء.`

I forced the real failure by saving invoice 43 with tracked Butter and `expiryDate: null`, completing it, and posting it. The actual network body was:

```json
{
  "errorCode": "PURCHASE_INVOICE_EXPIRY_DATE_REQUIRED",
  "message": "Expiry date is required before posting purchase invoice line 65",
  "params": {
    "entityType": "PurchaseInvoiceLine",
    "invoiceId": 43,
    "lineId": 65,
    "materialId": 5,
    "materialName": "Butter",
    "field": "expiryDate"
  },
  "status": 409,
  "timestamp": "2026-09-02T23:17:05.762894001",
  "path": "/api/inventory/purchase-invoices/43/post",
  "fieldErrors": null
}
```

Rendered text checks in both locales returned `false` for all three leak probes: the server `message`, response `path`/URL, and string `409` were not found anywhere in `body.innerText`. The rendered toast text was:

- English: `Enter an expiry date for Butter before posting the purchase invoice.`
- Arabic: `أدخل تاريخ انتهاء الصلاحية للمادة Butter قبل ترحيل فاتورة الشراء.`

Screenshots:

- [English post rejection](evidence/d113-part-b/task5-post-rejection-en.png)
- [Arabic post rejection](evidence/d113-part-b/task5-post-rejection-ar.png)

## Task 6 — Delete the dead transfer frontend

Deleted files:

- `src/pages/inventory/transfers/TransfersPage.tsx`
- `src/pages/inventory/transfers/TransferFormPage.tsx`
- `src/services/inventoryTransferService.ts`

Deleted route entries from `src/app/router.tsx`:

- `/inventory/transfers`
- `/inventory/transfers/new`
- `/inventory/transfers/:id`

Removed from `src/types/inventoryOperations.ts`: `TransferStatus`, `InventoryTransferLineResponse`, `InventoryTransferResponse`, `CreateTransferLineRequest`, `CreateInventoryTransferRequest`, `UpdateInventoryTransferRequest`, and `TransferListParams`.

Removed 72 shell/navigation locale keys from each of `src/i18n/locales/en/inventory.ts` and `src/i18n/locales/ar/inventory.ts`, including `inventory.nav.transfers`, page titles, states, actions, confirmations, form fields, line labels, and validation text. Removed transfer-only CSS and shared-selector entries from `src/styles/inventory.css`.

A residue scan found no `inventory.transfers`, `/inventory/transfers`, `inventoryTransferService`, dead transfer DTO, or transfer CSS selector reference. No current navigation source references a transfer path. Generic inventory transaction values `TRANSFER_IN` and `TRANSFER_OUT` were deliberately retained; they are backend ledger vocabulary, not the deleted one-document UI shell.

`npm run build` passed: ESLint zero errors (one pre-existing warning), TypeScript passed, and Vite produced the production bundle. Vite also reported its pre-existing large-chunk advisory.

## Task 7 — Browser verification, both locales

1. Batch list, English: [screenshot](evidence/d113-part-b/task7-batches-en.png). Remaining and Age are present; rows include danger-icon `-1`, positive `30`, and `—`.
2. Batch list, Arabic: [screenshot](evidence/d113-part-b/task7-batches-ar.png). Browser extraction returned `؜-١`, `٣٠`, `—`, `—`; Arabic-Indic digit detection passed. The document direction was `rtl`, computed cell alignment was logical `start`, and geometry measured the value 17 px from the right versus 67 px from the left. The negative value had the danger token's computed colour and one warning icon.
3. Tracked purchase line: [English grid](evidence/d113-part-b/task7-tracked-line-en.png), [Arabic grid](evidence/d113-part-b/task7-tracked-line-ar.png), [English form](evidence/d113-part-b/task3-form-tracked-en.png), [Arabic form](evidence/d113-part-b/task3-form-tracked-ar.png). The date input was visible in every tracked edit check.
4. Post rejection: [English](evidence/d113-part-b/task5-post-rejection-en.png), [Arabic](evidence/d113-part-b/task5-post-rejection-ar.png). Both name Butter and render only translated `errorCode`/`params` content.
5. Console capture: batch and line screens had empty console-error arrays in both locales, with no page exceptions. On each forced rejection, Chrome logged only its expected network diagnostic `Failed to load resource: the server responded with a status of 409`; there were no React errors, uncaught exceptions, missing-i18n warnings, or application `console.error` entries. Because the requested scenario intentionally produces HTTP 409, a literal claim of “no console errors” on that screen would be inaccurate.

Visual defects observed and not changed:

- In the Arabic purchase grid, the existing narrow UOM header is visibly truncated (`وحدة القيا...`).
- Existing date/quantity columns in the Arabic batch table continue to use Latin digits; the newly added Remaining and Age columns correctly use Arabic-Indic digits.
- The native date input placeholder remains `mm/dd/yyyy` under Arabic Chrome.
- The Arabic error toast visually clips the far end of the long sentence at its fixed existing width, although DOM text contains the full translated message and the visible part names Butter.

## Closing

### Unable to complete exactly

- Whole-repository locale key parity: blocked by the pre-existing English-only dead key `inventory.purchase.lines.notes`; no repository locale-lint command exists. The task's five new keys match exactly.
- Literal zero browser console errors on the forced post rejection: Chrome emits the expected failed-resource diagnostic for the deliberately produced 409. All non-rejection screens and all application/page error captures were clean.

### Wrong but out of scope

- `src/pages/tables/TableLayoutPage.tsx:199` has the existing missing-hook-dependency lint warning.
- The Arabic visual issues listed in Task 7 affect existing shared table/date/toast presentation beyond this fixed D113 scope.
- Vite reports an existing output chunk over 500 kB.
- The referenced repository file `claude/PROMPT_EXPIRY_AND_AGE.md` / `.claude/PROMPT_EXPIRY_AND_AGE.md` was absent; the attached expanded prompt and D113 were used.

### Live verification data created

The requested real-backend checks used tenant 2. Material 5 (Butter) was set to `expiryTracked: true`. Invoices 41 and 42 were posted to create the `-1` and `30` batches, invoice 43 remains `COMPLETE` after the intentionally rejected null-expiry post, and invoice 44 remains `DRAFT` with tracked and untracked lines. These records were left in place so the screenshots remain reproducible; no database row was deleted or rewritten directly.

### Files changed or deleted for this work

Changed implementation files:

- `src/app/router.tsx`
- `src/components/layout/DocumentLayout/SchemaLineFormView.tsx`
- `src/components/layout/DocumentLayout/SchemaLineGrid.tsx`
- `src/hooks/useDocumentLines.ts`
- `src/i18n/locales/ar/inventory.ts`
- `src/i18n/locales/en/inventory.ts`
- `src/pages/inventory/WarehouseStockBatchSubRow.tsx`
- `src/pages/inventory/purchase-invoices/PurchaseInvoiceFormPage.tsx`
- `src/schemas/purchaseInvoiceLineSchema.ts`
- `src/styles/inventory.css`
- `src/types/inventory.ts`
- `src/types/inventoryOperations.ts`
- `src/types/inventoryStock.ts`
- `src/types/lineSchema.ts`
- `src/types/purchaseInvoice.ts`

Deleted files:

- `src/pages/inventory/transfers/TransferFormPage.tsx`
- `src/pages/inventory/transfers/TransfersPage.tsx`
- `src/services/inventoryTransferService.ts`

Added report/evidence files:

- `docs/D113_PART_B_REPORT.md`
- `docs/evidence/d113-part-b/task3-form-tracked-ar.png`
- `docs/evidence/d113-part-b/task3-form-tracked-en.png`
- `docs/evidence/d113-part-b/task3-form-untracked-ar.png`
- `docs/evidence/d113-part-b/task3-form-untracked-en.png`
- `docs/evidence/d113-part-b/task3-untracked-line-ar.png`
- `docs/evidence/d113-part-b/task3-untracked-line-en.png`
- `docs/evidence/d113-part-b/task5-post-rejection-ar.png`
- `docs/evidence/d113-part-b/task5-post-rejection-en.png`
- `docs/evidence/d113-part-b/task7-batches-ar.png`
- `docs/evidence/d113-part-b/task7-batches-en.png`
- `docs/evidence/d113-part-b/task7-tracked-line-ar.png`
- `docs/evidence/d113-part-b/task7-tracked-line-en.png`

The two Task 5 error locale files contain required pre-existing uncommitted mappings and were verified but not edited by this pass. Other unrelated dirty-worktree files were preserved.
