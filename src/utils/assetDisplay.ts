import type { BadgeVariant } from '../types/assetsDisplay'
import type { AssetDisposalReason, AssetStatus } from '../types/assets'

type TranslateFn = (key: string) => string

export function getAssetCategoryLabel(category: string, t: TranslateFn): string {
  return t(`assets.category.${category}`)
}

export function getAssetStatusLabel(status: AssetStatus, t: TranslateFn): string {
  return t(`assets.status.${status}`)
}

export function getAssetDisposalReasonLabel(reason: AssetDisposalReason, t: TranslateFn): string {
  return t(`assets.reason.${reason}`)
}

export function getAssetStatusBadgeVariant(status: AssetStatus): BadgeVariant {
  if (status === 'ACTIVE') return 'success'
  if (status === 'PARTIALLY_DISPOSED') return 'warning'
  return 'inactive'
}

export function formatDecimalString(value?: string | number | null, fallback = ''): string {
  const trimmed = typeof value === 'number' ? String(value) : value?.trim()
  if (!trimmed) return fallback
  const [integerPart, fractionPart = ''] = trimmed.split('.')
  const sign = integerPart.startsWith('-') ? '-' : ''
  const unsignedInteger = sign ? integerPart.slice(1) : integerPart
  const groupedInteger = unsignedInteger.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const trimmedFraction = fractionPart.replace(/0+$/, '')
  return `${sign}${groupedInteger || '0'}${trimmedFraction ? `.${trimmedFraction}` : ''}`
}

export function formatAssetLineLabel(label: string | undefined, id: number, t: TranslateFn): string {
  const trimmed = label?.trim()
  return trimmed || t('assets.lines.fallbackLabel').replace('{{id}}', String(id))
}

function normalizeDecimal(value: string): { sign: 1 | -1; integer: string; fraction: string } | null {
  const trimmed = value.trim()
  if (!/^-?\d+(\.\d+)?$/.test(trimmed)) return null
  const sign = trimmed.startsWith('-') ? -1 : 1
  const unsigned = sign === -1 ? trimmed.slice(1) : trimmed
  const [rawInteger, rawFraction = ''] = unsigned.split('.')
  const integer = rawInteger.replace(/^0+(?=\d)/, '') || '0'
  return { sign, integer, fraction: rawFraction.replace(/0+$/, '') }
}

export function compareDecimalStrings(a: string, b: string): number | null {
  const left = normalizeDecimal(a)
  const right = normalizeDecimal(b)
  if (!left || !right) return null
  if (left.sign !== right.sign) return left.sign > right.sign ? 1 : -1
  const multiplier = left.sign
  if (left.integer.length !== right.integer.length) {
    return left.integer.length > right.integer.length ? multiplier : -multiplier
  }
  if (left.integer !== right.integer) {
    return left.integer > right.integer ? multiplier : -multiplier
  }
  const maxFractionLength = Math.max(left.fraction.length, right.fraction.length)
  const leftFraction = left.fraction.padEnd(maxFractionLength, '0')
  const rightFraction = right.fraction.padEnd(maxFractionLength, '0')
  if (leftFraction === rightFraction) return 0
  return leftFraction > rightFraction ? multiplier : -multiplier
}
