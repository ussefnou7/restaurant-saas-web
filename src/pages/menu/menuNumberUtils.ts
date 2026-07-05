import type { Locale } from '../../i18n/types'

export function formatMenuNumber(value: number, locale: Locale): string {
  const intlLocale = locale === 'ar' ? 'ar-EG' : 'en-US'
  return new Intl.NumberFormat(intlLocale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  }).format(value)
}

export function formatMenuPrice(value: number, locale: Locale): string {
  const intlLocale = locale === 'ar' ? 'ar-EG' : 'en-US'
  return new Intl.NumberFormat(intlLocale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function parseNonNegativeNumber(value: string): number | null {
  const normalized = value.replace(/,/g, '.').trim()
  if (!normalized) return null
  const num = Number(normalized)
  if (Number.isNaN(num) || num < 0) return null
  return num
}

export function parsePositiveNumber(value: string): number | null {
  const num = parseNonNegativeNumber(value)
  if (num === null || num <= 0) return null
  return num
}

export const QUICK_ADD_CATEGORY_VALUE = '__add_category__'
