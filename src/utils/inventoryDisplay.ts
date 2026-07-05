import { pickLocalizedValue } from '../i18n/localized'
import type { Locale } from '../i18n/types'

export type InventoryNamedEntity = {
  name: string
  nameEn?: string | null
  nameAr?: string | null
  code?: string
}

export function displayArabicName(value?: string | null, fallback = '—'): string {
  const trimmed = value?.trim()
  return trimmed ? trimmed : fallback
}

export function getInventoryLocalizedName(
  entity: InventoryNamedEntity,
  locale: Locale,
): string {
  return pickLocalizedValue(locale, {
    en: entity.nameEn ?? entity.name,
    ar: entity.nameAr ?? entity.name,
  })
}

/** Primary / secondary lines for bilingual material (and similar) cells. */
export function getInventoryBilingualLines(
  entity: InventoryNamedEntity,
  locale: Locale,
): { primary: string; secondary: string | null; code: string | null } {
  const english = (entity.nameEn ?? entity.name).trim()
  const arabic = (entity.nameAr ?? '').trim()
  const code = entity.code?.trim() || null

  if (locale === 'ar') {
    const primary = arabic || english
    const secondary =
      english && arabic && english.toLowerCase() !== arabic.toLowerCase() ? english : null
    return { primary, secondary, code }
  }

  const primary = english
  const secondary =
    arabic && english && arabic.toLowerCase() !== english.toLowerCase() ? arabic : null
  return { primary, secondary, code }
}

export function getInventoryArabicName(entity: InventoryNamedEntity): string {
  return entity.nameAr?.trim() ?? ''
}

export function getInventoryFormNames(entity: InventoryNamedEntity) {
  return {
    name: entity.nameEn ?? entity.name,
    nameAr: entity.nameAr ?? '',
  }
}

export function matchesInventorySearch(
  entity: InventoryNamedEntity,
  query: string,
  extraFields: string[] = [],
): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true

  return [
    entity.name,
    entity.nameEn ?? '',
    entity.nameAr ?? '',
    entity.code ?? '',
    ...extraFields,
  ]
    .filter(Boolean)
    .some((field) => field.toLowerCase().includes(q))
}
