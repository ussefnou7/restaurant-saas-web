import type { Locale } from '../i18n/types'
import type { LeaveBalanceResponse } from '../types/leaveBalance'
import type { LeaveTypeResponse } from '../types/leaveType'

export function getLocalizedLeaveTypeName(
  balance: LeaveBalanceResponse,
  locale: Locale,
): string {
  if (locale === 'ar') {
    return (
      balance.leaveTypeNameAr?.trim() ||
      balance.leaveTypeNameEn?.trim() ||
      balance.leaveTypeName?.trim() ||
      balance.leaveTypeCode?.trim() ||
      '—'
    )
  }

  return (
    balance.leaveTypeNameEn?.trim() ||
    balance.leaveTypeNameAr?.trim() ||
    balance.leaveTypeName?.trim() ||
    balance.leaveTypeCode?.trim() ||
    '—'
  )
}

export function getLocalizedLeaveTypeResponseName(
  leaveType: LeaveTypeResponse,
  locale: Locale,
): string {
  if (locale === 'ar') {
    return (
      leaveType.nameAr?.trim() ||
      leaveType.nameEn?.trim() ||
      leaveType.name?.trim() ||
      leaveType.code?.trim() ||
      '—'
    )
  }

  return (
    leaveType.nameEn?.trim() ||
    leaveType.nameAr?.trim() ||
    leaveType.name?.trim() ||
    leaveType.code?.trim() ||
    '—'
  )
}

export function formatDecimalDays(value?: number | null): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  if (Number.isInteger(value) || Math.abs(value - Math.trunc(value)) < 0.000001) {
    return String(Math.trunc(value))
  }
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

export function formatLeaveBalanceOptionLabel(
  balance: LeaveBalanceResponse,
  locale: Locale,
  daysUnit: string,
): string {
  const name = getLocalizedLeaveTypeName(balance, locale)
  const remaining = formatDecimalDays(balance.remainingDays)

  if (locale === 'ar') {
    return `${name} — المتبقي ${remaining} ${daysUnit}`
  }

  return `${name} — Remaining ${remaining} days`
}
