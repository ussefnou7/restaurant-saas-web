import type { TranslationKey } from '../i18n/types'

export function getPermissionModuleLabel(
  module: string,
  t: (key: TranslationKey, values?: Record<string, string | number>) => string,
): string {
  const key = `permissions.modules.${module}` as TranslationKey
  const translated = t(key)
  if (translated !== key) return translated
  return module
}
