import type { TranslationKey, TranslationValues } from '../i18n/types'
import type { ShiftExpenseStatus, ShiftPaymentMethod, ShiftStatus } from '../types/shift'

type TranslateFn = (key: TranslationKey, values?: TranslationValues) => string
type BadgeVariant = 'success' | 'warning' | 'danger' | 'muted' | 'primary' | 'inactive'

export function getShiftStatusLabel(status: ShiftStatus, t: TranslateFn): string {
  return t(`shifts.status.${status}`)
}

export function getShiftStatusBadgeVariant(status: ShiftStatus): BadgeVariant {
  return status === 'OPEN' ? 'success' : 'muted'
}

export function getShiftExpenseStatusLabel(status: ShiftExpenseStatus, t: TranslateFn): string {
  return t(`shifts.expenseStatus.${status}`)
}

export function getShiftExpenseStatusBadgeVariant(status: ShiftExpenseStatus): BadgeVariant {
  return status === 'ACTIVE' ? 'success' : 'inactive'
}

export function getShiftPaymentMethodLabel(method: ShiftPaymentMethod, t: TranslateFn): string {
  return t(`shifts.paymentMethod.${method}`)
}

export function formatShiftDuration(minutes?: number | null, t?: TranslateFn): string {
  if (minutes === null || minutes === undefined) return t ? t('common.empty.dash') : '-'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours <= 0) return t ? t('shifts.duration.minutes', { minutes: mins }) : `${mins}m`
  if (mins === 0) return t ? t('shifts.duration.hours', { hours }) : `${hours}h`
  return t ? t('shifts.duration.hoursMinutes', { hours, minutes: mins }) : `${hours}h ${mins}m`
}

export function formatSignedMoney(value?: number | null, empty = '-'): string {
  if (value === null || value === undefined) return empty
  const absolute = Math.abs(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  if (value < 0) return `-${absolute}`
  if (value > 0) return `+${absolute}`
  return absolute
}

export function formatShiftBusinessDate(value?: string | null, locale?: string): string {
  if (!value) return '-'
  return new Date(`${value}T00:00:00`).toLocaleDateString(
    locale === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US-u-nu-latn',
  )
}
