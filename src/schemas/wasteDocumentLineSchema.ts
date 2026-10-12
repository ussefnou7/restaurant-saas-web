import type { LineSchema, LineSchemaDeps } from '../types/lineSchema'
import type { MaterialResponse, UomResponse } from '../types/inventory'
import type { PurchaseInvoiceLineResponse } from '../types/purchaseInvoice'
import { getInventoryLocalizedName } from '../utils/inventoryDisplay'
import { formatQuantityWithUom, getCompatibleUoms, getLocalizedUomSymbol, resolveDisplayUomId } from '../utils/inventoryUom'

export interface WasteDocumentLineFormState {
  invoiceLineId?: string
  id?: number
  materialId: string
  quantity: string
  uomId: string
  notes?: string
}

export interface WasteDocumentLineLookups {
  invoiceLines?: PurchaseInvoiceLineResponse[]
  invoiceLinked?: boolean
  materials: MaterialResponse[]
  uoms: UomResponse[]
}

export function createWasteDocumentLineSchema(
  deps: LineSchemaDeps<WasteDocumentLineFormState, WasteDocumentLineLookups>,
): LineSchema<WasteDocumentLineFormState, WasteDocumentLineLookups> {
  const { lookups, locale, handlers, t } = deps

  return {
    fields: [
      {
        id: 'material',
        key: 'materialId',
        labelKey: 'inventory.waste.lines.material',
        type: 'lookup',
        required: true,
        readOnly: (ctx) => !ctx.isNew,
        showIn: ['grid', 'form'],
        tableWidth: '35%',
        options: () =>
          (lookups.materials || []).map((m) => ({
            value: String(m.id),
            label: getInventoryLocalizedName(m, locale),
          })),
        validate: (val, ctx) =>
          ctx.isNew && !val ? 'inventory.waste.validation.fieldRequired' : null,
      },
      {
        id: 'invoice-line',
        key: 'invoiceLineId',
        labelKey: 'inventory.waste.lines.invoiceLine',
        type: 'select',
        required: true,
        visible: () => Boolean(lookups.invoiceLinked),
        readOnly: (ctx) => !ctx.isNew,
        showIn: ['grid', 'form'],
        tableWidth: '20%',
        dependsOn: ['materialId'],
        onDependencyChange: (materialId) => {
          const lines = (lookups.invoiceLines ?? []).filter((line) => String(line.materialId) === String(materialId))
          return { invoiceLineId: lines.length === 1 ? String(lines[0].id) : '' }
        },
        // Two lines of the same material are told apart by expiry, quantity and price — never
        // by the row id, which means nothing to the person holding the stock.
        options: (ctx) => (lookups.invoiceLines ?? [])
          .filter((line) => String(line.materialId) === ctx.line.materialId)
          .map((line) => {
            const uom = (lookups.uoms || []).find((candidate) => candidate.id === line.uomId)
            return {
              value: String(line.id),
              label: t('inventory.waste.lines.invoiceLineOption', {
                expiry: line.expiryDate ?? t('inventory.waste.lines.noExpiry'),
                quantity: formatQuantityWithUom(
                  line.quantity, uom ? getLocalizedUomSymbol(uom, locale) : null, uom?.code),
                unitCost: line.unitCost.toLocaleString(undefined, {
                  minimumFractionDigits: 0, maximumFractionDigits: 4,
                }),
              }),
            }
          }),
        validate: (val) => lookups.invoiceLinked && !val ? 'inventory.waste.validation.fieldRequired' : null,
      },
      {
        id: 'quantity',
        key: 'quantity',
        labelKey: 'inventory.waste.lines.quantity',
        type: 'number',
        required: true,
        min: 0,
        dir: 'ltr',
        showIn: ['grid', 'form'],
        tableWidth: '15%',
        validate: (val) =>
          !String(val ?? '').trim() || Number.isNaN(Number(val)) || Number(val) <= 0
            ? 'inventory.waste.validation.quantityRequired'
            : null,
      },
      {
        id: 'uom',
        key: 'uomId',
        labelKey: 'inventory.waste.lines.uom',
        type: 'select',
        required: true,
        showIn: ['grid', 'form'],
        tableWidth: '15%',
        dependsOn: ['materialId'],
        onDependencyChange: (materialId) => {
          const material = (lookups.materials || []).find((m) => String(m.id) === String(materialId))
          return { uomId: material ? String(resolveDisplayUomId(material)) : '' }
        },
        options: (ctx) => {
          const anchorUomId = ctx.line.uomId ? Number(ctx.line.uomId) : undefined
          const compatible = anchorUomId
            ? getCompatibleUoms(lookups.uoms || [], anchorUomId)
            : (lookups.uoms || []).filter((u) => u.active)
          return compatible.map((u) => ({
            value: String(u.id),
            label: getLocalizedUomSymbol(u, locale) || getInventoryLocalizedName(u, locale),
          }))
        },
      },
      {
        id: 'notes',
        key: 'notes',
        labelKey: 'inventory.waste.lines.notes',
        type: 'textarea',
        showIn: ['grid', 'form'],
        tableWidth: '35%',
      },
    ],
    actions: [
      {
        key: 'edit',
        labelKey: 'inventory.waste.actions.editLine',
        icon: 'Pencil',
        onClick: (line) => handlers.onEditLine?.(line),
      },
      {
        key: 'delete',
        labelKey: 'inventory.waste.actions.removeLine',
        icon: 'Trash2',
        variant: 'danger',
        onClick: (line) => handlers.onDeleteLine?.(line),
      },
    ],
  }
}
