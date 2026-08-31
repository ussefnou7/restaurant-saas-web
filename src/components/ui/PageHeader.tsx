import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from '../../i18n/useTranslation'

export type BreadcrumbItem = {
  label: string
  to?: string
}

export interface PageHeaderProps {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  actions?: ReactNode
  badge?: ReactNode
  trail?: BreadcrumbItem[]
  className?: string
}

export function PageHeader({
  title,
  description,
  action,
  actions,
  badge,
  trail,
  className,
}: PageHeaderProps) {
  const { t } = useTranslation()
  const renderedActions = actions || action

  return (
    <header className={`page-header page-header--row${className ? ` ${className}` : ''}`}>
      <div className="page-header__text">
        {trail && trail.length > 0 ? (
          <nav className="page-header__breadcrumb" aria-label={t('hubs.breadcrumb.label')}>
            {trail.map((crumb, idx) => {
              const isLast = idx === trail.length - 1
              return (
                <span
                  key={crumb.to || idx}
                  className={`page-header__crumb${isLast ? ' page-header__crumb--current' : ''}`}
                >
                  {crumb.to && !isLast ? (
                    <Link to={crumb.to}>{crumb.label}</Link>
                  ) : (
                    <span>{crumb.label}</span>
                  )}
                  {!isLast && (
                    <span className="page-header__crumb-separator" aria-hidden="true">
                      /
                    </span>
                  )}
                </span>
              )
            })}
          </nav>
        ) : null}

        <div className="page-header__title-row">
          <h1>{title}</h1>
          {badge ? <div className="page-header__badge">{badge}</div> : null}
        </div>

        {description ? <p className="page-description">{description}</p> : null}
      </div>

      {renderedActions ? <div className="page-header__action">{renderedActions}</div> : null}
    </header>
  )
}
