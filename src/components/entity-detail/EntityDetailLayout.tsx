import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface EntityDetailLayoutProps {
  backTo: string
  backLabel: string
  title?: string
  subtitle?: ReactNode
  headerExtra?: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
  hideHeader?: boolean
}

export function EntityDetailLayout({
  backTo,
  backLabel,
  title,
  subtitle,
  headerExtra,
  actions,
  children,
  className,
  hideHeader = false,
}: EntityDetailLayoutProps) {
  return (
    <div className={`entity-detail-page${className ? ` ${className}` : ''}`}>
      <Link to={backTo} className="entity-detail-page__back">
        <ArrowLeft size={16} aria-hidden />
        <span>{backLabel}</span>
      </Link>

      {hideHeader ? null : (
        <header className="entity-detail-page__header entity-detail-page__header--compact">
          <div className="entity-detail-page__header-main">
            <div className="entity-detail-page__title-wrap">
              {title ? <h1 className="entity-detail-page__title">{title}</h1> : null}
              {subtitle ? (
                <p className="entity-detail-page__subtitle" dir="ltr">
                  {subtitle}
                </p>
              ) : null}
            </div>
            {headerExtra ? (
              <div className="entity-detail-page__header-extra">{headerExtra}</div>
            ) : null}
          </div>
          {actions ? <div className="entity-detail-page__actions">{actions}</div> : null}
        </header>
      )}

      <div className="entity-detail-page__content">{children}</div>
    </div>
  )
}
