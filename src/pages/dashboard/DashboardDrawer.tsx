import type { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { useTranslation } from '../../i18n/useTranslation'

interface DashboardDrawerProps {
  titleKey: string
  /** The one line that stands in for the contents while the drawer is shut. */
  summaryKey: string
  summaryValues?: Record<string, string | number>
  children: ReactNode
}

/**
 * A collapsed group of secondary blocks.
 *
 * Built on `<details>` rather than a `useState` toggle: the open/closed state is browser-owned, so
 * it keeps keyboard operation, the disclosure role and in-page find-on-page behaviour without any
 * of them being written here. Nothing on the dashboard needs to read whether a drawer is open.
 *
 * The summary line is not decoration. A shut drawer that only says "data health" gives an owner no
 * reason to open it and no reason not to, so the headline figure is lifted out of the contents.
 */
export function DashboardDrawer({
  titleKey,
  summaryKey,
  summaryValues,
  children,
}: DashboardDrawerProps) {
  const { t } = useTranslation()

  return (
    <details className="dashboard-drawer">
      <summary className="dashboard-drawer__summary">
        <span className="dashboard-drawer__text">
          <span className="dashboard-drawer__title">{t(titleKey)}</span>
          <span className="dashboard-drawer__hint">{t(summaryKey, summaryValues)}</span>
        </span>
        <ChevronDown className="dashboard-drawer__chevron" size={16} aria-hidden="true" />
      </summary>

      <div className="dashboard-drawer__body">{children}</div>
    </details>
  )
}
