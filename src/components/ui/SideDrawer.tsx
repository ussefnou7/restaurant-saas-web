import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { useTranslation } from '../../i18n/useTranslation'

interface SideDrawerProps {
  open: boolean
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  headerExtra?: ReactNode
  className?: string
  width?: 'default' | 'wide'
}

export function SideDrawer({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
  headerExtra,
  className = '',
  width = 'default',
}: SideDrawerProps) {
  const { t } = useTranslation()

  useEffect(() => {
    if (!open) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="drawer-backdrop" role="presentation" onClick={onClose}>
      <aside
        className={`drawer entity-details-drawer${width === 'wide' ? ' drawer--wide' : ''}${className ? ` ${className}` : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="entity-drawer-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="drawer-header entity-details-drawer__header">
          <div className="drawer-header-text">
            <h2 id="entity-drawer-title" className="drawer-title">
              {title}
            </h2>
            {subtitle ? <p className="drawer-subtitle">{subtitle}</p> : null}
          </div>
          <div className="entity-details-drawer__header-end">
            {headerExtra}
            <button
              type="button"
              className="drawer-close"
              onClick={onClose}
              aria-label={t('common.close')}
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </header>
        <div className="drawer-body entity-details-drawer__body">{children}</div>
        {footer ? <footer className="drawer-footer entity-details-drawer__footer">{footer}</footer> : null}
      </aside>
    </div>
  )
}
