import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { ChevronDown, Search } from 'lucide-react'

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
  searchable?: boolean
  searchPlaceholder?: string
}

export function Dropdown({
  value,
  onChange,
  options,
  ariaLabel,
  size = 'md',
  className = '',
  disabled,
  searchable = false,
  searchPlaceholder,
}: DropdownProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const selected = options.find((option) => option.value === value)
  const filteredOptions = searchable
    ? options.filter((option) =>
        String(option.label).toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()),
      )
    : options

  const closeDropdown = useCallback(() => {
    setOpen(false)
    setSearch('')
  }, [])

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        closeDropdown()
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') closeDropdown()
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [closeDropdown, open])

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
        onClick={() => (open ? closeDropdown() : setOpen(true))}
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
          {searchable ? (
            <li role="presentation">
              <label className="dropdown__search">
                <Search size={15} aria-hidden="true" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={searchPlaceholder}
                  aria-label={searchPlaceholder}
                />
              </label>
            </li>
          ) : null}
          {filteredOptions.length === 0 ? (
            <li className="dropdown__empty" role="presentation">
              —
            </li>
          ) : null}
          {filteredOptions.map((option) => {
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
                            closeDropdown()
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
