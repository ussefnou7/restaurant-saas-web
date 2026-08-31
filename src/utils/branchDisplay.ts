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

export type BranchLike = {
  name?: string | null
  nameEn?: string | null
  nameAr?: string | null
  branchName?: string | null
  branchNameEn?: string | null
  branchNameAr?: string | null
}

export function getLocalizedBranchName(
  branch: BranchLike | null | undefined,
  locale: Locale,
): string {
  if (!branch) return ''
  const en = branch.nameEn ?? branch.branchNameEn ?? branch.name ?? branch.branchName ?? ''
  const ar = branch.nameAr ?? branch.branchNameAr ?? branch.name ?? branch.branchName ?? ''
  return pickLocalizedValue(locale, { en, ar })
}

export function resolveBranchName(
  branchId: number | string | undefined | null,
  branches: BranchResponse[],
  locale: Locale,
  fallbackEntity?: BranchLike | null,
): string {
  if (branchId != null) {
    const found = branches.find((b) => String(b.id) === String(branchId))
    if (found) {
      const localized = getLocalizedBranchName(found, locale)
      if (localized) return localized
    }
  }
  if (fallbackEntity) {
    const localizedFallback = getLocalizedBranchName(fallbackEntity, locale)
    if (localizedFallback) return localizedFallback
  }
  return '—'
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
