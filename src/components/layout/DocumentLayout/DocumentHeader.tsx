import type { ReactNode } from 'react'
import { DocumentBackButton } from './DocumentBackButton'

export interface DocumentHeaderProps {
  title: ReactNode
  subtitle?: ReactNode
  statusBadge?: ReactNode
  backPath?: string
  onBackClick?: () => void
  backDisabled?: boolean
  editButton?: ReactNode
  actions?: ReactNode
  children?: ReactNode
}

export function DocumentHeader({
  title,
  subtitle,
  statusBadge,
  backPath,
  onBackClick,
  backDisabled,
  editButton,
  actions,
  children,
}: DocumentHeaderProps) {
  const hasActions = Boolean(actions || editButton)

  return (
    <section className="pi-form-header-card" dir="rtl">
      <div className="pi-form-header-card__topbar">
        <div className="pi-form-header-card__topbar-start">
          <h1 className="pi-form-topbar__title">{title}</h1>
          {statusBadge}
        </div>
        <div className="pi-form-header-card__topbar-end">
          <div className="pi-form-topbar__actions-bar">
            {actions}
            {editButton}
            {hasActions ? <span className="pi-form-topbar__actions-divider" aria-hidden /> : null}
            {backPath || onBackClick ? (
              <DocumentBackButton to={backPath} onClick={onBackClick} disabled={backDisabled} />
            ) : null}
          </div>
        </div>
      </div>

      {subtitle ? (
        <>
          <div className="pi-form-header-card__divider" />
          <div className="pi-form-header-card__invoice-line">{subtitle}</div>
        </>
      ) : null}

      {children ? (
        <>
          <div className="pi-form-header-card__divider" />
          {children}
        </>
      ) : null}
    </section>
  )
}
