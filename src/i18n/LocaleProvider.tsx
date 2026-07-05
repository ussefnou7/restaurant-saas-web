import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { LocaleContext } from './LocaleContext'
import { ar } from './locales/ar'
import { en } from './locales/en'
import type { Direction, Locale, TranslationDictionary } from './types'

const LOCALE_STORAGE_KEY = 'app-locale'

const dictionaries: Record<Locale, TranslationDictionary> = {
  en,
  ar,
}

function localeToDirection(locale: Locale): Direction {
  return locale === 'ar' ? 'rtl' : 'ltr'
}

function readStoredLocale(): Locale {
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
  if (stored === 'ar' || stored === 'en') return stored
  return 'en'
}

interface LocaleProviderProps {
  children: ReactNode
}

function applyDocumentLocale(locale: Locale, direction: Direction) {
  document.documentElement.lang = locale
  document.documentElement.dir = direction
}

export function LocaleProvider({ children }: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const initial = readStoredLocale()
    applyDocumentLocale(initial, localeToDirection(initial))
    return initial
  })
  const direction = localeToDirection(locale)
  const messages = dictionaries[locale]

  const setLocale = (next: Locale) => {
    setLocaleState(next)
    localStorage.setItem(LOCALE_STORAGE_KEY, next)
  }

  useEffect(() => {
    applyDocumentLocale(locale, direction)
  }, [locale, direction])

  const value = useMemo(
    () => ({ locale, direction, messages, setLocale }),
    [locale, direction, messages],
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}
