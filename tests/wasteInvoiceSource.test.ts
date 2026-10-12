import assert from 'node:assert/strict'
import test from 'node:test'
import { createWasteDocumentLineSchema } from '../src/schemas/wasteDocumentLineSchema.ts'
import type { PurchaseInvoiceLineResponse } from '../src/types/purchaseInvoice.ts'
import { inventoryAr } from '../src/i18n/locales/ar/inventory.ts'
import { inventoryEn } from '../src/i18n/locales/en/inventory.ts'
import { errorsAr } from '../src/i18n/locales/ar/errors.ts'
import { errorsEn } from '../src/i18n/locales/en/errors.ts'

const invoiceLines: PurchaseInvoiceLineResponse[] = [
  { id: 11, materialId: 1, quantity: 10, uomId: 1, unitCost: 2, lineTotal: 20, expiryDate: '2026-10-01' },
  { id: 12, materialId: 1, quantity: 10, uomId: 1, unitCost: 3, lineTotal: 30, expiryDate: '2026-11-01' },
  { id: 13, materialId: 2, quantity: 10, uomId: 1, unitCost: 1, lineTotal: 10, expiryDate: null },
]
function sourceField(linked = true) {
  return createWasteDocumentLineSchema({
    lookups: { materials: [], uoms: [], invoiceLinked: linked, invoiceLines },
    locale: 'en', t: (key: string) => key, handlers: {},
  }).fields.find((field) => field.id === 'invoice-line')!
}
const context = {
  line: { materialId: '1', invoiceLineId: '', quantity: '1', uomId: '1' },
  lookups: { materials: [], uoms: [], invoiceLinked: true, invoiceLines },
  locale: 'en' as const, isNew: true,
}

test('same material in two invoice lines requires an explicit source selection', () => {
  const field = sourceField()
  assert.deepEqual(field.options?.(context).map((option) => option.value), ['11', '12'])
  assert.deepEqual(field.onDependencyChange?.('1', context), { invoiceLineId: '' })
  assert.equal(field.validate?.('', context), 'inventory.waste.validation.fieldRequired')
})

test('source options are labelled by expiry, quantity and price, not by row id', () => {
  // The two candidate lines differ only in expiry and unit cost, so the label has to carry
  // both for the choice to be makeable at all.
  const labels = sourceField().options?.(context).map((option) => option.label)
  assert.deepEqual(labels, [
    'inventory.waste.lines.invoiceLineOption',
    'inventory.waste.lines.invoiceLineOption',
  ])
  const interpolated = createWasteDocumentLineSchema({
    lookups: { materials: [], uoms: [], invoiceLinked: true, invoiceLines },
    locale: 'en',
    t: (key: string, params?: Record<string, unknown>) => `${key}:${JSON.stringify(params ?? {})}`,
    handlers: {},
  }).fields.find((field) => field.id === 'invoice-line')!.options?.(context) ?? []
  assert.match(interpolated[0].label, /"expiry":"2026-10-01"/)
  assert.match(interpolated[0].label, /"unitCost":"2"/)
  assert.match(interpolated[1].label, /"unitCost":"3"/)
  // No raw database id leaks into the label.
  assert.doesNotMatch(interpolated[0].label, /"id":/)
})

test('a unique matching source is selected and unrelated invoice lines never appear', () => {
  const field = sourceField()
  assert.deepEqual(field.onDependencyChange?.('2', context), { invoiceLineId: '13' })
  assert.deepEqual(field.onDependencyChange?.('999', context), { invoiceLineId: '' })
  assert.deepEqual(field.options?.({ ...context, line: { ...context.line, materialId: '999' } }), [])
})

test('ordinary unsourced waste does not require a purchase line', () => {
  const field = sourceField(false)
  assert.equal(field.visible?.(context), false)
  assert.equal(field.validate?.('', context), null)
})

test('invoice waste copy and blocking errors exist in both languages', () => {
  for (const key of Object.keys(inventoryEn).filter((key) => key.startsWith('inventory.waste.'))) {
    assert.ok(inventoryAr[key], key)
  }
  // BATCH_SHORTFALL is reachable from waste now that a sourced line is bounded by its own batch.
  for (const code of ['WASTE_INVOICE_REQUIRED', 'WASTE_INVALID_INVOICE_SOURCE', 'BATCH_SHORTFALL']) {
    assert.ok(errorsEn[`errors.${code}`], code)
    assert.ok(errorsAr[`errors.${code}`], code)
  }
  assert.ok(inventoryEn['inventory.waste.validation.invoiceRequiredForExpiry'])
  assert.ok(inventoryAr['inventory.waste.validation.invoiceRequiredForExpiry'])
})

test('consumption settlement copy is gone and must not come back', () => {
  // The waste post no longer drains consumption documents (D139 amendment 2026-10-10), so no
  // copy may imply that it does. Re-adding it needs a new decision, not a translation.
  for (const table of [inventoryEn, inventoryAr]) {
    assert.deepEqual(Object.keys(table).filter((key) => key.startsWith('inventory.waste.consumption.')), [])
  }
  for (const table of [errorsEn, errorsAr]) {
    assert.equal(table['errors.WASTE_CONSUMPTION_NOT_SETTLED'], undefined)
  }
})
