# D113 frontend remediation report

Verification date: 2026-09-02 (Africa/Cairo). Frontend: `http://localhost:5188`. Backend: `http://localhost:2020`. Tenant: 2.

## Task 1 — Shared line-schema regression gate

The blocking browser check passed: the shared `visible` predicate and invisible-field validation skip did not regress Purchase Return, Waste, or Assets. I exercised both grid and form views in English and Arabic against the real backend.

### Purchase Return

- Fixture: draft purchase return 16, created through the browser from posted invoice `EDR-PINV-2026-0002`.
- Grid, English: an empty new line showed `Select a line to return.`; a valid line saved; clearing the required return quantity on an existing line showed `Return quantity must be greater than 0.`; restoring it saved the edit.
- Form, English: the same add and edit saves succeeded, with the same required-field messages.
- Grid, Arabic: an empty new line showed `اختر البند المراد إرجاعه.`; clearing an existing line's quantity showed `الكمية المرتجعة يجب أن تكون أكبر من صفر.`; both valid saves succeeded.
- Form, Arabic: the same add and edit saves and validation checks succeeded.
- Visible field IDs were unchanged: grid showed `original-line`, `original-quantity`, `returnable-quantity`, `return-quantity`, `uom`, `unit-cost`, and `line-total`; form showed those seven plus the form-only `notes` field. No unexpected field appeared.
- Evidence: [English grid](evidence/d113-remediation/task1-purchase-return-grid-validation-en.png), [English form](evidence/d113-remediation/task1-purchase-return-form-validation-en.png), [Arabic grid](evidence/d113-remediation/task1-purchase-return-grid-validation-ar.png), and [Arabic form](evidence/d113-remediation/task1-purchase-return-form-validation-ar.png).

### Waste

- Fixture: existing draft waste document 3.
- Grid, English: an empty new line showed `This field is required.`; a valid line saved; clearing quantity on an existing line showed `Quantity must be greater than zero.`; restoring it saved the edit.
- Form, English: the same add and edit saves succeeded, with the same required-field messages.
- Grid, Arabic: an empty new line showed `هذا الحقل مطلوب.`; clearing an existing line's quantity showed `الكمية يجب أن تكون أكبر من صفر.`; both valid saves succeeded.
- Form, Arabic: the same add and edit saves and validation checks succeeded.
- All four intended fields remained visible in both views: `material`, `quantity`, `uom`, and `notes`. No unexpected field appeared.
- Evidence: [English grid](evidence/d113-remediation/task1-waste-grid-validation-en.png), [English form](evidence/d113-remediation/task1-waste-form-validation-en.png), [Arabic grid](evidence/d113-remediation/task1-waste-grid-validation-ar.png), and [Arabic form](evidence/d113-remediation/task1-waste-form-validation-ar.png).

### Assets

- Fixture: existing asset 2.
- Grid, English and Arabic: the intentionally blank unit cost showed `Unit cost is required and must be greater than zero.` / `تكلفة الوحدة مطلوبة ويجب أن تكون أكبر من صفر.`; filling it saved the new line.
- Form, English and Arabic: the same validation messages remained visible and valid new lines saved.
- All six intended fields remained visible in both views: `label`, `quantity`, `remaining-quantity`, `unit-cost`, `purchase-date`, and `status`. No unexpected field appeared.
- Existing asset lines cannot be edited in either view: `AssetDetailPage` supplies `onAddLine` and `onDeleteLine` but deliberately supplies no `onUpdateLine` or edit action, while quantity, unit cost, and purchase date are read-only for non-new rows. I therefore could not perform the requested existing-line edit/save on this screen. This behavior predates the D113 shared-schema change; it is not a Task 1 regression, so work continued under the prompt's stop condition.
- Evidence: [English grid](evidence/d113-remediation/task1-assets-grid-validation-en.png), [English form](evidence/d113-remediation/task1-assets-form-validation-en.png), [Arabic grid](evidence/d113-remediation/task1-assets-grid-validation-ar.png), and [Arabic form](evidence/d113-remediation/task1-assets-form-validation-ar.png).

All Task 1 browser pages had empty application `console.error` and uncaught page-error captures.

## Task 2 — `expiryTracked` on the material form

Changed:

- `src/pages/inventory/MaterialOverviewPanel.tsx`: added `expiryTracked` to create/edit state and response mapping, rendered an existing design-system `StatusSwitch`, added the permitted helper text, and included the boolean in create/update payloads.
- `src/types/inventory.ts`: added the required `expiryTracked: boolean` property to `CreateMaterialRequest`; `UpdateMaterialRequest` inherits it.
- `src/i18n/locales/en/inventory.ts` and `src/i18n/locales/ar/inventory.ts`: added matching label and helper keys.

The control appears on both active page modes. A new material defaults to expiry tracking off. The English helper reads `Requires an expiry date on purchase invoice lines for this material.` and the Arabic helper reads `يجعل تاريخ الصلاحية مطلوبًا في بنود فاتورة الشراء لهذه المادة.`

Live browser round trip using Butter (material 5):

1. Opened the English edit form with the toggle on, switched it off, and saved. The PUT returned HTTP 200 with `expiryTracked: false` in both request and response. A fresh page load showed the toggle off.
2. Opened the Arabic edit form with the toggle off, switched it on, and saved. The PUT returned HTTP 200 with `expiryTracked: true` in both request and response. A fresh page load showed the toggle on.

No direct material API write or database edit was used. Browser application-console captures were empty. Butter was deliberately left with expiry tracking on for Task 7.

Evidence: [English create form](evidence/d113-remediation/task2-material-create-en.png), [Arabic create form](evidence/d113-remediation/task2-material-create-ar.png), [English persisted-off edit form](evidence/d113-remediation/task2-material-edit-en-off.png), and [Arabic persisted-on edit form](evidence/d113-remediation/task2-material-edit-ar-on.png).
