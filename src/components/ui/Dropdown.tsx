import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

export interface DropdownOption {
  value: string
  label: ReactNode
}

interface DropdownProps {
  value: string
  onChange: (value: string) => void
  options: DropdownOption[]
  ariaLabel: string
  size?: 'toolbar' | 'md'
  className?: string
  disabled?: boolean
}

export function Dropdown({
  value,
  onChange,
  options,
  ariaLabel,
  size = 'md',
  className = '',
  disabled,
}: DropdownProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const selected = options.find((option) => option.value === value)

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
    <div
      ref={rootRef}
      className={`dropdown${size === 'toolbar' ? ' dropdown--toolbar' : ''}${className ? ` ${className}` : ''}`}
    >
      <button
        type="button"
        className="dropdown__trigger"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? listId : undefined}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="dropdown__value">{selected?.label ?? '—'}</span>
        <ChevronDown
          className={`dropdown__chevron${open ? ' dropdown__chevron--open' : ''}`}
          size={16}
          aria-hidden="true"
        />
      </button>
      {open ? (
        <ul id={listId} className="dropdown__panel" role="listbox" aria-label={ariaLabel}>
          {options.map((option) => {
            const isSelected = option.value === value
            return (
              <li key={option.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`dropdown__option${isSelected ? ' dropdown__option--selected' : ''}`}
                  onClick={() => {
                    onChange(option.value)
                    setOpen(false)
                  }}
                >
                  {option.label}
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
