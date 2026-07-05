import { useCallback } from 'react'
import { pickLocalizedValue, type LocalizedValueInput } from './localized'
import { useTranslation } from './useTranslation'

export function useLocalized() {
  const { locale } = useTranslation()

  const localized = useCallback(
    (values: LocalizedValueInput) => pickLocalizedValue(locale, values),
    [locale],
  )

  return { locale, localized }
}
