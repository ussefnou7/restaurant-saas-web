import { DocumentBackButton } from '../layout/DocumentLayout/DocumentBackButton'

interface EntityDetailLayoutProps {
  backTo: string
  backLabel?: string
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
  title,
  subtitle,
  headerExtra,
  actions,
  children,
  className,
  hideHeader = false,
}: EntityDetailLayoutProps) {
  return (
    <div className={`entity-detail-page${className ? ` ${className}` : ''}`} dir="rtl">
      <div className="mb-3 flex justify-start">
        <DocumentBackButton to={backTo} />
      </div>

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
