import type { LineSchema, LineSchemaDeps } from '../types/lineSchema'
import type { UomResponse } from '../types/inventory'
import type { ReturnableLineResponse } from '../types/purchaseReturn'
import { getInventoryLocalizedName } from '../utils/inventoryDisplay'
import { getLocalizedUomSymbol } from '../utils/inventoryUom'

export interface PurchaseReturnLineFormState {
  id?: number
  originalLineId?: string
  quantity: string
  uomId: string
  unitCost: string
  lineTotal?: number
  notes?: string
  materialName?: string | null
  materialNameAr?: string | null
  materialCode?: string | null
  uomSymbol?: string | null
}

export interface PurchaseReturnLineLookups {
  returnableLines: ReturnableLineResponse[]
  uoms: UomResponse[]
}

export function createPurchaseReturnLineSchema(
  deps: LineSchemaDeps<PurchaseReturnLineFormState, PurchaseReturnLineLookups>,
): LineSchema<PurchaseReturnLineFormState, PurchaseReturnLineLookups> {
  const { lookups, locale, handlers } = deps

  return {
    fields: [
      {
        id: 'original-line',
        key: 'originalLineId',
        labelKey: 'inventory.purchaseReturn.lines.material',
        type: 'select',
        required: true,
        readOnly: (ctx) => !ctx.isNew,
        showIn: ['grid', 'form'],
        tableWidth: '25%',
        options: (ctx) => {
          const options = (lookups.returnableLines || [])
            .filter(
              (line: ReturnableLineResponse) =>
                !ctx.isNew ||
                !(ctx.allLines || []).some(
                  (existing) =>
                    String(existing.originalLineId) === String(line.originalLineId),
                ),
            )
            .map((line: ReturnableLineResponse) => {
              const material = getInventoryLocalizedName(
                {
                  name: line.materialName ?? '',
                  code: line.materialCode ?? undefined,
                },
                locale,
              )
              const uomObj = (lookups.uoms || []).find((u) => u.id === line.uomId)
              const symbol = uomObj ? getLocalizedUomSymbol(uomObj, locale) || '' : ''
              return {
                value: String(line.originalLineId),
                label: `${material} · ${line.returnableQuantity}${symbol ? ` ${symbol}` : ''}`,
              }
            })
          const selectedIsMissing =
            ctx.line.originalLineId &&
            !options.some((option) => option.value === String(ctx.line.originalLineId))
          if (selectedIsMissing) {
            options.push({
              value: String(ctx.line.originalLineId),
              label: getInventoryLocalizedName(
                {
                  name: ctx.line.materialName ?? '',
                  nameAr: ctx.line.materialNameAr ?? undefined,
                  code: ctx.line.materialCode ?? undefined,
                },
                locale,
              ),
            })
          }
          return options
        },
        validate: (val, ctx) =>
          ctx.isNew && !val ? 'inventory.purchaseReturn.validation.lineRequired' : null,
      },
      {
        id: 'original-quantity',
        key: 'quantity',
        labelKey: 'inventory.purchaseReturn.lines.originalQuantity',
        type: 'computed',
        dir: 'ltr',
        showIn: ['grid', 'form'],
        tableWidth: '12%',
        compute: (ctx) => {
          const matched = (lookups.returnableLines || []).find(
            (item: ReturnableLineResponse) => String(item.originalLineId) === String(ctx.line.originalLineId),
          )
          return matched ? matched.originalQuantity : '—'
        },
      },
      {
        id: 'returnable-quantity',
        key: 'quantity',
        labelKey: 'inventory.purchaseReturn.lines.returnableQuantity',
        type: 'computed',
        dir: 'ltr',
        showIn: ['grid', 'form'],
        tableWidth: '13%',
        compute: (ctx) => {
          const matched = (lookups.returnableLines || []).find(
            (item: ReturnableLineResponse) => String(item.originalLineId) === String(ctx.line.originalLineId),
          )
          if (!matched) return '—'
          const uomObj = (lookups.uoms || []).find((u) => u.id === matched.uomId)
          const symbol = uomObj ? getLocalizedUomSymbol(uomObj, locale) || '' : ''
          return `${matched.returnableQuantity}${symbol ? ` ${symbol}` : ''}`
        },
      },
      {
        id: 'return-quantity',
        key: 'quantity',
        labelKey: 'inventory.purchaseReturn.lines.returnQuantity',
        type: 'number',
        required: true,
        min: 0,
        dir: 'ltr',
        showIn: ['grid', 'form'],
        tableWidth: '12%',
        dependsOn: ['originalLineId'],
        onDependencyChange: () => ({ quantity: '' }),
        validate: (val, ctx) => {
          const numVal = Number(val)
          if (!String(val ?? '').trim() || Number.isNaN(numVal) || numVal <= 0) {
            return 'inventory.purchaseReturn.validation.returnQuantityRequired'
          }
          const matched = (lookups.returnableLines || []).find(
            (item: ReturnableLineResponse) => String(item.originalLineId) === String(ctx.line.originalLineId),
          )
          if (matched) {
            const otherDraftQuantity = (ctx.allLines || [])
              .filter((line) => String(line.id) !== String(ctx.line.id))
              .filter(
                (line) => String(line.originalLineId) === String(ctx.line.originalLineId),
              )
              .reduce((sum, line) => sum + (Number(line.quantity) || 0), 0)
            const maxQuantity = Math.max(0, matched.returnableQuantity - otherDraftQuantity)
            if (numVal > maxQuantity + 1e-6) {
              return 'inventory.purchaseReturn.validation.returnQuantityExceeded'
            }
          }
          return null
        },
      },
      {
        id: 'uom',
        key: 'uomId',
        labelKey: 'inventory.purchaseReturn.lines.uom',
        type: 'select',
        required: true,
        readOnly: () => true,
        showIn: ['grid', 'form'],
        tableWidth: '12%',
        dependsOn: ['originalLineId'],
        onDependencyChange: (originalLineId) => {
          const matched = (lookups.returnableLines || []).find(
            (item) => String(item.originalLineId) === String(originalLineId),
          )
          return { uomId: matched ? String(matched.uomId) : '' }
        },
        options: (ctx) => {
          const matched = (lookups.returnableLines || []).find(
            (item: ReturnableLineResponse) => String(item.originalLineId) === String(ctx.line.originalLineId),
          )
          const matchedUom = matched
            ? (lookups.uoms || []).find((u) => u.id === matched.uomId)
            : undefined
          const matchedSymbol = matchedUom
            ? getLocalizedUomSymbol(matchedUom, locale) || String(matchedUom.id)
            : (matched ? String(matched.uomId) : '')
          const options = matched
            ? [{ value: String(matched.uomId), label: matchedSymbol }]
            : []
          const storedUomId = String(ctx.line.uomId || '')
          if (storedUomId && !options.some((option) => option.value === storedUomId)) {
            const storedUom = (lookups.uoms || []).find((uom) => String(uom.id) === storedUomId)
            options.push({
              value: storedUomId,
              label: storedUom ? getLocalizedUomSymbol(storedUom, locale) || storedUomId : storedUomId,
            })
          }
          return options
        },
      },
      {
        id: 'unit-cost',
        key: 'unitCost',
        labelKey: 'inventory.purchaseReturn.lines.unitCost',
        type: 'money',
        required: true,
        readOnly: () => true,
        dir: 'ltr',
        showIn: ['grid', 'form'],
        tableWidth: '13%',
        dependsOn: ['originalLineId'],
        onDependencyChange: (originalLineId) => {
          const matched = (lookups.returnableLines || []).find(
            (item) => String(item.originalLineId) === String(originalLineId),
          )
          return { unitCost: matched ? String(matched.unitCost) : '' }
        },
      },
      {
        id: 'line-total',
        key: 'lineTotal',
        labelKey: 'inventory.purchaseReturn.lines.lineTotal',
        type: 'computed',
        dir: 'ltr',
        showIn: ['grid', 'form'],
        tableWidth: '13%',
        compute: (ctx) => {
          const qty = Number(ctx.line.quantity) || 0
          const cost = Number(ctx.line.unitCost) || 0
          const preview = qty * cost
          const isEditingThisLine =
            ctx.editingLineId != null && String(ctx.line.id) === String(ctx.editingLineId)
          return ctx.isNew || isEditingThisLine || ctx.line.lineTotal == null
            ? preview
            : ctx.line.lineTotal
        },
      },
      {
        id: 'notes',
        key: 'notes',
        labelKey: 'inventory.purchaseReturn.lines.notes',
        type: 'textarea',
        showIn: ['form'],
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
