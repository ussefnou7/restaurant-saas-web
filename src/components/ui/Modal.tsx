import { useEffect, type ReactNode } from 'react'

interface ModalProps {
  open: boolean
  title: string
  subtitle?: string
  children: ReactNode
  onClose: () => void
  footer?: ReactNode
  size?: 'default' | 'medium' | 'wide' | 'large'
  className?: string
}

export function Modal({
  open,
  title,
  subtitle,
  children,
  onClose,
  footer,
  size = 'default',
  className,
}: ModalProps) {
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
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className={`modal card modal--${size}${className ? ` ${className}` : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <div className="modal-header-text">
            <h2 id="modal-title" className="modal-title">
              {title}
            </h2>
            {subtitle ? <p className="modal-subtitle">{subtitle}</p> : null}
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <div className="modal-body">{children}</div>
        {footer ? <footer className="modal-footer">{footer}</footer> : null}
      </div>
    </div>
  )
}
