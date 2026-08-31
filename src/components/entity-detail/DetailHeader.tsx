import type { ReactNode } from 'react'
import { DocumentBackButton } from '../layout/DocumentLayout/DocumentBackButton'

export interface DetailHeaderProps {
  title: ReactNode
  statusBadge?: ReactNode
  actions?: ReactNode
  reference?: ReactNode
  backTo?: string
  onBack?: () => void
  backDisabled?: boolean
  children?: ReactNode
}

export function DetailHeader({
  title,
  statusBadge,
  actions,
  reference,
  backTo,
  onBack,
  backDisabled,
  children,
}: DetailHeaderProps) {
  const showActions = actions || backTo || onBack

  return (
    <section className="pi-form-header-card detail-header">
      <div className="pi-form-header-card__topbar">
        <div className="pi-form-header-card__topbar-start">
          <h1 className="pi-form-topbar__title">{title}</h1>
          {statusBadge}
        </div>
        <div className="pi-form-header-card__topbar-end">
          {showActions ? (
            <div className="pi-form-topbar__actions-bar">
              {actions}
              {(backTo || onBack) && actions ? (
                <span className="pi-form-topbar__actions-divider" aria-hidden />
              ) : null}
              {backTo || onBack ? (
                <DocumentBackButton to={backTo} onClick={onBack} disabled={backDisabled} />
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="pi-form-header-card__divider" />

      {reference ? <div className="pi-form-header-card__invoice-line">{reference}</div> : null}

      {children ? <div className="detail-header__fields">{children}</div> : null}
    </section>
  )
}
