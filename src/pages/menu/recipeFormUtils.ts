import type { MaterialResponse } from '../../types/inventory'
import type { RecipeItemView } from '../../types/menu'

export type EditableRecipeRow = {
  key: string
  materialId: string
  quantity: string
  uomId: string
}

export function getMaterialStockUomId(material: MaterialResponse): number | undefined {
  return material.stockUomId ?? material.defaultUomId
}

export function serializeRows(rows: EditableRecipeRow[]): string {
  return JSON.stringify(
    rows.map((row) => ({
      materialId: row.materialId,
      quantity: row.quantity,
      uomId: row.uomId,
    })),
  )
}

export function createRow(partial?: Partial<EditableRecipeRow>): EditableRecipeRow {
  return {
    key: partial?.key ?? `row-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    materialId: partial?.materialId ?? '',
    quantity: partial?.quantity ?? '',
    uomId: partial?.uomId ?? '',
  }
}

export function rowsFromRecipeItems(items: RecipeItemView[]): EditableRecipeRow[] {
  return items.map((item, index) =>
    createRow({
      key: `prefill-${item.materialId}-${index}`,
      materialId: String(item.materialId),
      quantity: String(item.quantity),
      uomId: String(item.uomId),
    }),
  )
}

export function formatRecipeVersionDate(value: string, locale: string): string {
  const intlLocale = locale === 'ar' ? 'ar-EG' : 'en-US'
  return new Date(value).toLocaleString(intlLocale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
