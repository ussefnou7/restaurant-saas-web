import type { TranslationKey } from '../i18n/types'

const SKIPPED_REASON_KEYS: Record<string, TranslationKey> = {
  ALREADY_IMPORTED: 'inventory.catalog.skippedReason.ALREADY_IMPORTED',
  INACTIVE_CATALOG_MATERIAL: 'inventory.catalog.skippedReason.INACTIVE_CATALOG_MATERIAL',
  NOT_FOUND: 'inventory.catalog.skippedReason.NOT_FOUND',
  CODE_ALREADY_EXISTS: 'inventory.catalog.skippedReason.CODE_ALREADY_EXISTS',
}

export function getImportSkippedReasonLabel(
  reason: string,
  t: (key: TranslationKey) => string,
): string {
  const key = SKIPPED_REASON_KEYS[reason]
  if (key) return t(key)
  return reason
}
