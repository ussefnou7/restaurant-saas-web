import type { Locale } from '../i18n/types'
import type { MaterialCatalogResponse, MaterialResponse, UomResponse } from '../types/inventory'
import type { StockBalanceResponse } from '../types/inventoryStock'
import { getInventoryLocalizedName } from './inventoryDisplay'

export type MaterialUomSource = Pick<
  MaterialResponse,
  | 'stockUomId'
  | 'displayUomId'
  | 'defaultUomId'
  | 'stockUomCode'
  | 'displayUomCode'
  | 'defaultUomCode'
  | 'stockUomName'
  | 'displayUomName'
  | 'defaultUomName'
  | 'stockUomSymbol'
  | 'displayUomSymbol'
  | 'defaultUomSymbol'
>

export type CatalogUomSource = Pick<
  MaterialCatalogResponse,
  | 'stockUomId'
  | 'displayUomId'
  | 'defaultUomId'
  | 'stockUomCode'
  | 'displayUomCode'
  | 'defaultUomCode'
  | 'stockUomName'
  | 'displayUomName'
  | 'defaultUomName'
  | 'stockUomSymbol'
  | 'displayUomSymbol'
  | 'defaultUomSymbol'
>

export function resolveStockUomId(source: MaterialUomSource | CatalogUomSource): number {
  return source.stockUomId ?? source.defaultUomId ?? 0
}

export function resolveDisplayUomId(source: MaterialUomSource | CatalogUomSource): number {
  return source.displayUomId ?? source.defaultUomId ?? 0
}

export function getDisplayUomLabel(
  source: MaterialUomSource | CatalogUomSource,
  locale: Locale,
  uoms?: UomResponse[],
): string {
  const displayId = resolveDisplayUomId(source)
  const uom = uoms?.find((item) => item.id === displayId)
  if (uom) {
    const name = getInventoryLocalizedName(uom, locale)
    return uom.symbol ? `${name} (${uom.symbol})` : name
  }
  return (
    source.displayUomSymbol ??
    source.displayUomName ??
    source.displayUomCode ??
    source.defaultUomSymbol ??
    source.defaultUomName ??
    source.defaultUomCode ??
    '—'
  )
}

export function getStockUomLabel(
  source: MaterialUomSource | CatalogUomSource,
  locale: Locale,
  uoms?: UomResponse[],
): string {
  const stockId = resolveStockUomId(source)
  const uom = uoms?.find((item) => item.id === stockId)
  if (uom) {
    const name = getInventoryLocalizedName(uom, locale)
    return uom.symbol ?? name
  }
  return (
    source.stockUomSymbol ??
    source.stockUomName ??
    source.stockUomCode ??
    source.defaultUomSymbol ??
    source.defaultUomName ??
    source.defaultUomCode ??
    '—'
  )
}

export function getCompatibleUoms(uoms: UomResponse[], anchorUomId: number | string): UomResponse[] {
  const active = uoms.filter((u) => u.active)
  const anchor = active.find((u) => u.id === Number(anchorUomId))
  if (!anchor?.type) return active
  return active.filter((u) => u.type === anchor.type)
}

export function convertUomQuantity(
  quantity: number,
  fromUom: UomResponse,
  toUom: UomResponse,
): number | null {
  if (fromUom.type && toUom.type && fromUom.type !== toUom.type) return null
  const fromFactor = fromUom.factorToBase ?? 0
  const toFactor = toUom.factorToBase ?? 0
  if (fromFactor <= 0 || toFactor <= 0) return null
  const inBase = quantity * fromFactor
  return inBase / toFactor
}

export function formatQuantityWithUom(quantity: number, symbol?: string | null, code?: string | null): string {
  const formatted = quantity.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  })
  const unit = symbol ?? code
  return unit ? `${formatted} ${unit}` : formatted
}

export type BalanceDisplayView = {
  primary: string
  stockSecondary: string | null
}

export function getBalanceDisplayView(
  row: StockBalanceResponse,
  uoms: UomResponse[],
  storedAsLabel: string,
): BalanceDisplayView {
  if (row.displayQuantity != null) {
    const primary = formatQuantityWithUom(
      row.displayQuantity,
      row.displayUomSymbol,
      row.displayUomCode,
    )
    const stockSecondary =
      row.quantity != null && row.uomSymbol
        ? `${storedAsLabel} ${formatQuantityWithUom(row.quantity, row.uomSymbol, row.uomCode)}`
        : null
    return { primary, stockSecondary }
  }

  const stockUom = uoms.find((u) => u.id === row.uomId)
  const displayUomId = row.displayUomId
  const displayUom = displayUomId ? uoms.find((u) => u.id === displayUomId) : undefined

  if (stockUom && displayUom) {
    const displayQty = convertUomQuantity(row.quantity, stockUom, displayUom)
    if (displayQty != null) {
      return {
        primary: formatQuantityWithUom(
          displayQty,
          displayUom.symbol,
          displayUom.code,
        ),
        stockSecondary: `${storedAsLabel} ${formatQuantityWithUom(row.quantity, stockUom.symbol, stockUom.code)}`,
      }
    }
  }

  return {
    primary: formatQuantityWithUom(row.quantity, row.uomSymbol, row.uomCode),
    stockSecondary: null,
  }
}

export function getTransactionQuantityView(
  enteredQuantity: number,
  enteredUomSymbol?: string | null,
  enteredUomCode?: string | null,
  stockQuantity?: number | null,
  stockUomSymbol?: string | null,
  stockUomCode?: string | null,
  storedAsLabel?: string,
): { primary: string; stockSecondary: string | null } {
  const primary = formatQuantityWithUom(enteredQuantity, enteredUomSymbol, enteredUomCode)
  const stockSecondary =
    stockQuantity != null && (stockUomSymbol || stockUomCode) && storedAsLabel
      ? `${storedAsLabel} ${formatQuantityWithUom(stockQuantity, stockUomSymbol, stockUomCode)}`
      : null
  return { primary, stockSecondary }
}
