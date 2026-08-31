import type { ReactNode } from 'react'
import { DetailHeader } from './DetailHeader'

export interface EntityDetailLayoutProps {
  title?: ReactNode
  subtitle?: ReactNode
  badge?: ReactNode
  headerExtra?: ReactNode
  actions?: ReactNode
  backTo?: string
  backLabel?: string
  children: ReactNode
  className?: string
  hideHeader?: boolean
  headerFields?: ReactNode
}

export function EntityDetailLayout({
  title,
  subtitle,
  badge,
  headerExtra,
  actions,
  backTo,
  children,
  className,
  hideHeader = false,
  headerFields,
}: EntityDetailLayoutProps) {
  const renderedBadge = badge ?? headerExtra
  const showHeader = !hideHeader && title

  return (
    <div className={`entity-detail-page${className ? ` ${className}` : ''}`}>
      {showHeader ? (
        <DetailHeader
          title={title}
          reference={subtitle}
          statusBadge={renderedBadge}
          actions={actions}
          backTo={backTo}
        >
          {headerFields}
        </DetailHeader>
      ) : null}

      <div className="entity-detail-page__content">{children}</div>
    </div>
  )
}
