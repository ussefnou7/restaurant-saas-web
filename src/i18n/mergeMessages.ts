import type { TranslationDictionary } from './types'

export function mergeMessages(...parts: TranslationDictionary[]): TranslationDictionary {
  return Object.assign({}, ...parts)
}
