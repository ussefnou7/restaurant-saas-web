import { useEffect, useState } from 'react'
import { useLocation, useMatches } from 'react-router-dom'
import { useTranslation } from '../i18n/useTranslation'
import {
  formatDocumentTitle,
  getDocumentTitleOverride,
  subscribeToDocumentTitle,
} from '../hooks/useDocumentTitle'

export interface RouteHandle {
  titleKey?: string
  title?: string
}

export function DocumentTitleManager() {
  const { t, locale } = useTranslation()
  const location = useLocation()
  const matches = useMatches()
  const [overrideTitle, setOverrideTitle] = useState<string | null>(getDocumentTitleOverride())

  useEffect(() => {
    return subscribeToDocumentTitle(setOverrideTitle)
  }, [])

  useEffect(() => {
    const brandName = t('common.appName') || (locale === 'ar' ? 'ريستورو' : 'Restoro')

    if (overrideTitle) {
      document.title = formatDocumentTitle(overrideTitle, brandName)
      return
    }

    let resolvedTitle: string | undefined

    for (let i = matches.length - 1; i >= 0; i--) {
      const match = matches[i]
      const handle = match.handle as RouteHandle | undefined
      if (handle?.titleKey) {
        const translated = t(handle.titleKey)
        if (translated && translated !== handle.titleKey) {
          resolvedTitle = translated
          break
        }
      } else if (handle?.title) {
        resolvedTitle = handle.title
        break
      }
    }

    document.title = formatDocumentTitle(resolvedTitle, brandName)
  }, [matches, location.pathname, t, locale, overrideTitle])

  return null
}
