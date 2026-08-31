import type { LineSchema, LineSchemaDeps } from '../types/lineSchema'
import type { MaterialResponse, UomResponse } from '../types/inventory'
import { getInventoryLocalizedName } from '../utils/inventoryDisplay'
import { getCompatibleUoms, getLocalizedUomSymbol, resolveDisplayUomId } from '../utils/inventoryUom'

export interface WasteDocumentLineFormState {
  id?: number
  materialId: string
  quantity: string
  uomId: string
  notes?: string
}

export interface WasteDocumentLineLookups {
  materials: MaterialResponse[]
  uoms: UomResponse[]
}

export function createWasteDocumentLineSchema(
  deps: LineSchemaDeps<WasteDocumentLineFormState, WasteDocumentLineLookups>,
): LineSchema<WasteDocumentLineFormState, WasteDocumentLineLookups> {
  const { lookups, locale, handlers } = deps

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
