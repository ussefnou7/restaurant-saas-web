import { pickLocalizedValue, type LocalizedValueInput } from '../i18n/localized'
import type { Locale } from '../i18n/types'
import type { PermissionResponse } from '../types/permission'

export function getPermissionNameFields(permission: PermissionResponse): LocalizedValueInput {
  return {
    en: permission.nameEn ?? permission.name ?? '',
    ar: permission.nameAr ?? permission.name ?? '',
  }
}

export function getPermissionDescriptionFields(
  permission: PermissionResponse,
): LocalizedValueInput {
  return {
    en: permission.descriptionEn ?? permission.description ?? '',
    ar: permission.descriptionAr ?? permission.description ?? '',
  }
}

export function getLocalizedPermissionName(
  permission: PermissionResponse,
  locale: Locale,
): string {
  return pickLocalizedValue(locale, getPermissionNameFields(permission))
}

export function getLocalizedPermissionDescription(
  permission: PermissionResponse,
  locale: Locale,
): string {
  return pickLocalizedValue(locale, getPermissionDescriptionFields(permission))
}

/** All searchable text; includes code for internal matching only. */
export function getPermissionSearchHaystack(permission: PermissionResponse): string[] {
  return [
    permission.nameEn,
    permission.nameAr,
    permission.name,
    permission.descriptionEn,
    permission.descriptionAr,
    permission.description,
    permission.code,
    permission.module,
  ]
    .filter((value) => value != null && String(value).trim() !== '')
    .map((value) => String(value))
}

export function permissionMatchesSearch(permission: PermissionResponse, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true

  return getPermissionSearchHaystack(permission).some((field) => field.toLowerCase().includes(q))
}

export function comparePermissionsByLocalizedName(
  a: PermissionResponse,
  b: PermissionResponse,
  locale: Locale,
): number {
  return getLocalizedPermissionName(a, locale).localeCompare(
    getLocalizedPermissionName(b, locale),
  )
}
