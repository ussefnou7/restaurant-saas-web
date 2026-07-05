import { pickLocalizedValue } from '../i18n/localized'
import type { Locale } from '../i18n/types'
import type { RoleResponse } from '../types/user'

type LocalizedNameFields = {
  name?: string
  nameEn?: string | null
  nameAr?: string | null
}

export function getLocalizedRoleName(role: RoleResponse, locale: Locale): string {
  const extended = role as RoleResponse & { nameEn?: string | null; nameAr?: string | null }
  return pickLocalizedValue(locale, {
    en: extended.nameEn ?? role.name,
    ar: extended.nameAr ?? role.name,
  })
}

export function getLocalizedBranchName(branch: LocalizedNameFields, locale: Locale): string {
  return pickLocalizedValue(locale, {
    en: branch.nameEn ?? branch.name ?? '',
    ar: branch.nameAr ?? branch.name ?? '',
  })
}

export function getLocalizedUserBranchName(
  user: {
    branchName?: string | null
    branchNameEn?: string | null
    branchNameAr?: string | null
  },
  locale: Locale,
): string {
  return pickLocalizedValue(locale, {
    en: user.branchNameEn ?? user.branchName ?? '',
    ar: user.branchNameAr ?? user.branchName ?? '',
  })
}
