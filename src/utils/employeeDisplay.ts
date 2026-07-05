import { pickLocalizedValue } from '../i18n/localized'
import type { Locale } from '../i18n/types'
import type { EmployeeResponse } from '../types/employee'

export function getEmployeeDisplayName(
  employee: EmployeeResponse,
  locale: Locale,
): string {
  return pickLocalizedValue(locale, {
    en: employee.fullNameEn ?? employee.fullName,
    ar: employee.fullNameAr ?? employee.fullName,
  })
}

export function getEmployeeJobName(employee: EmployeeResponse, locale: Locale): string {
  return pickLocalizedValue(locale, {
    en: employee.jobNameEn ?? employee.jobName,
    ar: employee.jobNameAr ?? employee.jobName,
  })
}

export function getEmployeeBranchName(employee: EmployeeResponse, locale: Locale): string {
  return pickLocalizedValue(locale, {
    en: employee.branchNameEn ?? employee.branchName,
    ar: employee.branchNameAr ?? employee.branchName,
  })
}

export function getEmployeeFormNames(employee: EmployeeResponse) {
  return {
    fullName: employee.fullNameEn ?? employee.fullName,
    fullNameAr: employee.fullNameAr ?? '',
  }
}
