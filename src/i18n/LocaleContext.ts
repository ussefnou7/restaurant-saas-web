import { createContext } from 'react'
import type { Direction, Locale, TranslationDictionary } from './types'

export interface LocaleContextValue {
  locale: Locale
  direction: Direction
  messages: TranslationDictionary
  setLocale: (locale: Locale) => void
}

export const LocaleContext = createContext<LocaleContextValue | null>(null)
