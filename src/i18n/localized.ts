import type { Locale } from './types'

export type LocalizedValueInput = {
  en?: string | null
  ar?: string | null
}

export function pickLocalizedValue(locale: Locale, values: LocalizedValueInput): string {
  const en = values.en?.trim() ?? ''
  const ar = values.ar?.trim() ?? ''

  if (locale === 'ar') {
    return ar || en
  }

  return en || ar
}

export function localized(values: LocalizedValueInput): LocalizedValueInput {
  return values
}
