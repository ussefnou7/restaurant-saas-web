import { useEffect, useId, useRef, useState } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { useTranslation } from '../../i18n/useTranslation'

export interface ActionMenuItem {
  id: string
  label: string
  onClick: () => void
  disabled?: boolean
  tone?: 'default' | 'mint' | 'danger'
}

interface ActionMenuProps {
  items: ActionMenuItem[]
  disabled?: boolean
  ariaLabel?: string
}

export function ActionMenu({ items, disabled, ariaLabel }: ActionMenuProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  return (
    <div className="action-menu" ref={rootRef}>
      <button
        type="button"
        className="action-menu__trigger"
        disabled={disabled}
        aria-label={ariaLabel ?? t('common.actions')}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
      >
        <MoreHorizontal size={16} aria-hidden="true" />
      </button>
      {open ? (
        <div id={menuId} className="action-menu__panel" role="menu">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              className={`action-menu__item${
                item.tone === 'mint'
                  ? ' action-menu__item--mint'
                  : item.tone === 'danger'
                    ? ' action-menu__item--danger'
                    : ''
              }`}
              disabled={item.disabled}
              onClick={() => {
                setOpen(false)
                item.onClick()
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
