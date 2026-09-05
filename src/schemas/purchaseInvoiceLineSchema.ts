import type { LineSchema, LineSchemaDeps } from '../types/lineSchema'
import type { MaterialResponse, UomResponse } from '../types/inventory'
import { calcLineTotal } from '../utils/purchaseInvoiceDisplay'
import { getInventoryLocalizedName } from '../utils/inventoryDisplay'
import { getCompatibleUoms, getLocalizedUomSymbol, resolveDisplayUomId } from '../utils/inventoryUom'

export interface PurchaseInvoiceLineFormState {
  id?: number
  materialId: string
  quantity: string
  uomId: string
  unitCost: string
  expiryDate: string
  lineTotal?: number
}

export interface PurchaseInvoiceLineLookups {
  materials: MaterialResponse[]
  uoms: UomResponse[]
}

export function createPurchaseInvoiceLineSchema(
  deps: LineSchemaDeps<PurchaseInvoiceLineFormState, PurchaseInvoiceLineLookups>,
): LineSchema<PurchaseInvoiceLineFormState, PurchaseInvoiceLineLookups> {
  const { lookups, locale, handlers } = deps

  return {
    fields: [
      {
        id: 'material',
        key: 'materialId',
        labelKey: 'inventory.purchase.lines.material',
        type: 'lookup',
        required: true,
        readOnly: (ctx) => !ctx.isNew,
        showIn: ['grid', 'form'],
        tableWidth: '34%',
        columnClass: 'pi-form-lines-table__col--material',
        options: () =>
          (lookups.materials || []).map((m) => ({
            label: getInventoryLocalizedName(m, locale),
            value: String(m.id),
          })),
        validate: (val, ctx) =>
          ctx.isNew && !val ? 'inventory.purchase.validation.fieldRequired' : null,
      },
      {
        id: 'quantity',
        key: 'quantity',
        labelKey: 'inventory.purchase.lines.quantity',
        type: 'number',
        required: true,
        min: 0,
        dir: 'ltr',
        showIn: ['grid', 'form'],
        tableWidth: '10%',
        columnClass: 'pi-form-lines-table__col--qty',
        validate: (val) =>
          !String(val ?? '').trim() || Number.isNaN(Number(val)) || Number(val) <= 0
            ? 'inventory.purchase.validation.quantityRequired'
            : null,
      },
      {
        id: 'uom',
        key: 'uomId',
        labelKey: 'inventory.purchase.lines.uom',
        type: 'select',
        required: true,
        showIn: ['grid', 'form'],
        tableWidth: '10%',
        columnClass: 'pi-form-lines-table__col--uom',
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
        validate: (val) => (!val ? 'inventory.purchase.validation.uomRequired' : null),
      },
      {
        id: 'unit-cost',
        key: 'unitCost',
        labelKey: 'inventory.purchase.lines.unitCost',
        type: 'money',
        required: true,
        dir: 'ltr',
        showIn: ['grid', 'form'],
        tableWidth: '14%',
        columnClass: 'pi-form-lines-table__col--cost',
        validate: (val) =>
          String(val ?? '').trim() === '' || Number.isNaN(Number(val)) || Number(val) <= 0
            ? 'inventory.purchase.validation.unitCostRequired'
            : null,
      },
      {
        id: 'expiry-date',
        key: 'expiryDate',
        labelKey: 'inventory.purchase.lines.expiryDate',
        type: 'date',
        dir: 'ltr',
        showIn: ['grid', 'form'],
        tableWidth: '16%',
        columnClass: 'pi-form-lines-table__col--expiry-date',
        visible: (ctx) => {
          const material = (lookups.materials || []).find(
            (item) => String(item.id) === String(ctx.line.materialId),
          )
          return material?.expiryTracked === true
        },
        dependsOn: ['materialId'],
        onDependencyChange: () => ({ expiryDate: '' }),
      },
      {
        id: 'line-total',
        key: 'lineTotal',
        labelKey: 'inventory.purchase.lines.lineTotal',
        type: 'computed',
        dir: 'ltr',
        showIn: ['grid', 'form'],
        tableWidth: '18%',
        columnClass: 'pi-form-lines-table__col--total',
        compute: (ctx) => {
          const preview = calcLineTotal(
            Number(ctx.line.quantity) || 0,
            Number(ctx.line.unitCost) || 0,
          )
          const isEditingThisLine =
            ctx.editingLineId != null && String(ctx.line.id) === String(ctx.editingLineId)
          return ctx.isNew || isEditingThisLine || ctx.line.lineTotal == null
            ? preview
            : ctx.line.lineTotal
        },
      },
    ],
    actions: [
      {
        key: 'edit',
        labelKey: 'inventory.purchase.actions.editLine',
        icon: 'Pencil',
        onClick: (line) => handlers.onEditLine?.(line),
      },
      {
        key: 'delete',
        labelKey: 'inventory.purchase.lines.delete',
        icon: 'Trash2',
        variant: 'danger',
        onClick: (line) => handlers.onDeleteLine?.(line),
      },
    ],
  }
}
