import { useEffect, useState } from 'react'
import { useTranslation } from '../i18n/useTranslation'

type TitleSubscriber = (title: string | null) => void

const subscribers = new Set<TitleSubscriber>()
let currentOverrideTitle: string | null = null

export function setDocumentTitleOverride(title: string | null) {
  currentOverrideTitle = title
  subscribers.forEach((sub) => sub(title))
}

export function subscribeToDocumentTitle(subscriber: TitleSubscriber) {
  subscribers.add(subscriber)
  return () => {
    subscribers.delete(subscriber)
  }
}

export function getDocumentTitleOverride() {
  return currentOverrideTitle
}

/**
 * Formats a title with the localized brand prefix:
 * e.g., "Restoro | Employees" or "ريستورو | الموظفين"
 */
export function formatDocumentTitle(
  pageTitle: string | null | undefined,
  brandName: string = 'Restoro',
): string {
  const trimmed = pageTitle?.trim()
  if (!trimmed || trimmed === brandName) {
    return brandName
  }
  return `${brandName} | ${trimmed}`
}

/**
 * Custom hook to dynamically override the page title from within a component.
 * Cleans up automatically on unmount.
 *
 * @param title Optional title string (or null/undefined to clear override)
 */
export function useDocumentTitle(title?: string | null) {
  const { t } = useTranslation()

  useEffect(() => {
    if (title !== undefined) {
      setDocumentTitleOverride(title)
    }

    return () => {
      if (title !== undefined) {
        setDocumentTitleOverride(null)
      }
    }
  }, [title])

  const [override, setOverride] = useState<string | null>(currentOverrideTitle)

  useEffect(() => {
    return subscribeToDocumentTitle(setOverride)
  }, [])

  return {
    overrideTitle: override,
    brandName: t('common.appName') || 'Restoro',
  }
}
