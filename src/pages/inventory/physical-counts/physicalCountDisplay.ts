import type { Locale } from '../../../i18n/types'
import type { PhysicalCountLineResponse, PhysicalCountStatus } from '../../../types/inventoryOperations'
import { formatMoney } from '../../../utils/format'
import { formatStockQuantity } from '../../../utils/inventoryStockDisplay'
import { getInventoryLocalizedName } from '../../../utils/inventoryDisplay'

export type LineVarianceDisplay = {
  expectedDisplay: number
  variance: number
  varianceValue: number | null
  isProvisional: boolean
}

export function getStatusVariant(status: PhysicalCountStatus): 'muted' | 'warning' | 'success' {
  switch (status) {
    case 'DRAFT':
    case 'CANCELLED':
      return 'muted'
    case 'IN_PROGRESS':
      return 'warning'
    case 'RECONCILED':
      return 'success'
    default:
      return 'muted'
  }
}

export function getLineVarianceDisplay(line: PhysicalCountLineResponse): LineVarianceDisplay | null {
  if (line.countedQuantity == null) return null

  if (line.variance != null) {
    const variance = line.variance
    return {
      expectedDisplay: line.adjustedExpectedQuantity ?? line.expectedQuantity,
      variance,
      varianceValue:
        line.varianceValue ??
        (line.unitCostAtFreeze != null ? variance * line.unitCostAtFreeze : null),
      isProvisional: false,
    }
  }

  return null
}

export function getExpectedQuantityDisplay(line: PhysicalCountLineResponse): number {
  return line.adjustedExpectedQuantity ?? line.expectedQuantity
}

export function formatSignedMoney(value: number | null | undefined): string {
  if (value == null) return '—'
  const absolute = formatMoney(Math.abs(value))
  if (value > 0) return `+${absolute}`
  if (value < 0) return `-${absolute}`
  return absolute
}

export function getVarianceCellClass(variance: number | null | undefined): string {
  if (variance == null) return ''
  if (variance > 0) return 'variance-positive'
  if (variance < 0) return 'variance-negative'
  return 'variance-zero'
}

export function formatVarianceQuantity(variance: number): string {
  if (variance > 0) return `+${variance}`
  return String(variance)
}

export function formatPhysicalCountQuantity(value: number | string | null | undefined): string {
  if (value == null) return '—'
  const numericValue = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numericValue)) return String(value)
  return formatStockQuantity(numericValue)
}

function padDatePart(value: number): string {
  return String(value).padStart(2, '0')
}

function formatYmd(year: number, month: number, day: number): string {
  return `${year}/${padDatePart(month)}/${padDatePart(day)}`
}

export function formatPhysicalCountDate(value?: string | null): string {
  if (!value) return '-'

  const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch
    return `${year}/${month}/${day}`
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return formatYmd(date.getFullYear(), date.getMonth() + 1, date.getDate())
}

export function formatPhysicalCountDateTime(value?: string | null): string {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  const hours = date.getHours()
  const displayHours = hours % 12 || 12
  const minutes = padDatePart(date.getMinutes())
  const seconds = padDatePart(date.getSeconds())
  const period = hours >= 12 ? 'PM' : 'AM'

  return `${formatYmd(date.getFullYear(), date.getMonth() + 1, date.getDate())} ${displayHours}:${minutes}:${seconds} ${period}`
}

type TranslationFn = (key: string) => string

const translatedUomCodes = new Set([
  'kg',
  'g',
  'ml',
  'l',
  'pcs',
  'pc',
  'piece',
  'each',
  'unit',
  'box',
])

function normalizeUomCode(value?: string | null): string {
  return value?.trim().toLowerCase() ?? ''
}

export function getMaterialDisplayName(
  line: { materialCode?: string | null; materialName?: string | null; materialNameAr?: string | null },
  locale: Locale,
): string {
  return getInventoryLocalizedName(
    {
      name: line.materialName ?? line.materialCode ?? '',
      nameAr: line.materialNameAr ?? undefined,
      code: line.materialCode ?? undefined,
    },
    locale,
  )
}

export function getPhysicalCountUomDisplay(
  value: string,
  locale: Locale,
  t: TranslationFn,
): { label: string; dir: 'ltr' | undefined } {
  const code = normalizeUomCode(value)
  if (!translatedUomCodes.has(code)) {
    return { label: value || '-', dir: 'ltr' }
  }

  return {
    label: t(`inventory.units.${code}`),
    dir: locale === 'ar' ? undefined : 'ltr',
  }
}

export function sumLineVarianceValues(
  lines: PhysicalCountLineResponse[],
): number {
  return lines.reduce((total, line) => {
    const display = getLineVarianceDisplay(line)
    if (!display || display.variance === 0 || display.varianceValue == null) return total
    return total + display.varianceValue
  }, 0)
}

export function hasEstimatedVarianceValue(line: PhysicalCountLineResponse): boolean {
  const display = getLineVarianceDisplay(line)
  return Boolean(display && display.variance !== 0 && display.varianceValue != null && line.varianceValueIsEstimate)
}
