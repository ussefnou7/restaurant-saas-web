import { useCallback, useContext } from 'react'
import { en } from './locales/en'
import { LocaleContext } from './LocaleContext'
import type { TranslationKey, TranslationValues } from './types'

const warnedKeys = new Set<string>()

function resolveMessage(
  messages: Record<string, string>,
  key: TranslationKey,
  locale: string,
): string | undefined {
  const direct = messages[key]
  if (direct !== undefined) return direct
  if (locale !== 'en') {
    return en[key]
  }
  return undefined
}

export function useTranslation() {
  const context = useContext(LocaleContext)
  if (!context) {
    throw new Error('useTranslation must be used within LocaleProvider')
  }

  const { locale, direction, setLocale, messages } = context

  const t = useCallback(
    (key: TranslationKey, values?: TranslationValues): string => {
      const template = resolveMessage(messages, key, locale) ?? key

      if (template === key && import.meta.env.DEV && !warnedKeys.has(key)) {
        warnedKeys.add(key)
        console.warn(`[i18n] Missing translation for key: "${key}" (locale: ${locale})`)
      }

      if (!values) return template
      return Object.entries(values).reduce(
        (result, [name, value]) => result.replaceAll(`{{${name}}}`, String(value)),
        template,
      )
    },
    [locale, messages],
  )

  return { t, locale, direction, setLocale }
}
