import { pickLocalizedValue } from '../i18n/localized'
import type { Locale } from '../i18n/types'
import type { BranchResponse } from '../types/branch'

export function buildBranchOptions(
  branches: BranchResponse[],
  currentBranchId?: number | null,
): BranchResponse[] {
  const active = branches.filter((branch) => branch.active)
  if (currentBranchId == null) return active

  const current = branches.find((branch) => branch.id === currentBranchId)
  if (!current || active.some((branch) => branch.id === currentBranchId)) {
    return active
  }

  return [current, ...active]
}

export function getLocalizedBranchName(branch: BranchResponse, locale: Locale): string {
  return pickLocalizedValue(locale, {
    en: branch.nameEn ?? branch.name,
    ar: branch.nameAr ?? branch.name,
  })
}

export function getLocalizedBranchAddress(branch: BranchResponse, locale: Locale): string {
  const extended = branch as BranchResponse & {
    addressEn?: string | null
    addressAr?: string | null
  }
  return pickLocalizedValue(locale, {
    en: extended.addressEn ?? branch.address ?? '',
    ar: extended.addressAr ?? branch.address ?? '',
  })
}

export function getBranchFormNames(branch: BranchResponse) {
  return {
    name: branch.nameEn ?? branch.name,
    nameAr: branch.nameAr ?? '',
  }
}
