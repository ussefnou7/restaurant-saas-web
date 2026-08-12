import type { ReactNode } from 'react'

export interface DocumentHeaderProps {
  title: ReactNode
  statusBadge?: ReactNode
  actions?: ReactNode
  reference?: ReactNode
  children?: ReactNode
}

export function DocumentHeader({
  title,
  statusBadge,
  actions,
  reference,
  children,
}: DocumentHeaderProps) {
  return (
    <section className="pi-form-header-card" dir="rtl">
      <div className="pi-form-header-card__topbar">
        <div className="pi-form-header-card__topbar-start">
          <h1 className="pi-form-topbar__title">{title}</h1>
          {statusBadge}
        </div>
        <div className="pi-form-header-card__topbar-end">
          {actions ? <div className="pi-form-topbar__actions-bar">{actions}</div> : null}
        </div>
      </div>

      <div className="pi-form-header-card__divider" />

      {reference ? <div className="pi-form-header-card__invoice-line">{reference}</div> : null}

      {children}
    </section>
  )
}
