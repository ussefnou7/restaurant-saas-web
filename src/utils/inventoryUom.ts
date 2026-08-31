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

export function getLocalizedUomSymbol(
  uom: {
    code?: string | null
    symbol?: string | null
    symbolAr?: string | null
  },
  locale: Locale,
): string | undefined {
  const symbol = uom.symbol?.trim()
  if (locale === 'ar') return uom.symbolAr?.trim() || symbol || uom.code?.trim() || undefined
  return symbol || uom.code?.trim() || undefined
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
    const symbol = getLocalizedUomSymbol(uom, locale)
    return symbol ? `${name} (${symbol})` : name
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
    return getLocalizedUomSymbol(uom, locale) ?? name
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

export const rootOf = (u: UomResponse): number => u.baseUomId ?? u.id

export function getCompatibleUoms(uoms: UomResponse[], anchorUomId: number | string): UomResponse[] {
  const active = uoms.filter((u) => u.active)
  const anchor = active.find((u) => u.id === Number(anchorUomId))
  if (!anchor) return active
  const anchorRoot = rootOf(anchor)
  return active.filter((u) => rootOf(u) === anchorRoot)
}

export function convertUomQuantity(
  quantity: number,
  fromUom: UomResponse,
  toUom: UomResponse,
): number | null {
  if (rootOf(fromUom) !== rootOf(toUom)) return null
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

function findUom(uoms: UomResponse[], uomId?: number | null): UomResponse | undefined {
  if (uomId == null) return undefined
  return uoms.find((u) => u.id === uomId)
}

export type BalanceDisplayView = {
  primary: string
  stockSecondary: string | null
}

export function getBalanceDisplayView(
  row: StockBalanceResponse,
  uoms: UomResponse[],
  storedAsLabel: string,
  locale?: Locale,
): BalanceDisplayView {
  const stockUom = findUom(uoms, row.uomId)
  const displayUom = findUom(uoms, row.displayUomId)

  if (row.displayQuantity != null) {
    const primaryUom = displayUom ?? stockUom
    const stockUnitSymbol = (stockUom && locale ? getLocalizedUomSymbol(stockUom, locale) : stockUom?.symbol) ?? row.uomSymbol
    const stockUnitCode = stockUom?.code ?? row.uomCode
    const primary = formatQuantityWithUom(
      row.displayQuantity,
      (primaryUom && locale ? getLocalizedUomSymbol(primaryUom, locale) : primaryUom?.symbol) ?? row.displayUomSymbol,
      primaryUom?.code ?? row.displayUomCode,
    )
    const stockSecondary =
      row.quantity != null && (stockUnitSymbol || stockUnitCode)
        ? `${storedAsLabel} ${formatQuantityWithUom(row.quantity, stockUnitSymbol, stockUnitCode)}`
        : null
    return { primary, stockSecondary }
  }

  if (stockUom && displayUom) {
    const displayQty = convertUomQuantity(row.quantity, stockUom, displayUom)
    if (displayQty != null) {
      return {
        primary: formatQuantityWithUom(
          displayQty,
          locale ? getLocalizedUomSymbol(displayUom, locale) : displayUom.symbol,
          displayUom.code,
        ),
        stockSecondary: `${storedAsLabel} ${formatQuantityWithUom(row.quantity, locale ? getLocalizedUomSymbol(stockUom, locale) : stockUom.symbol, stockUom.code)}`,
      }
    }
  }

  return {
    primary: formatQuantityWithUom(
      row.quantity,
      (stockUom && locale ? getLocalizedUomSymbol(stockUom, locale) : stockUom?.symbol) ?? row.uomSymbol,
      stockUom?.code ?? row.uomCode,
    ),
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
