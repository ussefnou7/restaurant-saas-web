import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Loader2, Search } from 'lucide-react'
import type { Locale } from '../../i18n/types'
import type { MaterialResponse } from '../../types/inventory'
import { getInventoryLocalizedName } from '../../utils/inventoryDisplay'
import './MaterialSelect.css'

interface MaterialSelectProps {
  value: string
  onChange: (materialId: string) => void
  materials: MaterialResponse[]
  excludeMaterialIds?: number[]
  locale: Locale
  disabled?: boolean
  loading?: boolean
  hasError?: boolean
  placeholder: string
  searchPlaceholder: string
  ariaLabel: string
}

const MATERIAL_SELECT_Z_INDEX = 10001

export function MaterialSelect({
  value,
  onChange,
  materials,
  excludeMaterialIds = [],
  locale,
  disabled,
  loading,
  hasError,
  placeholder,
  searchPlaceholder,
  ariaLabel,
}: MaterialSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({})
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const listId = useId()

  const excludedSet = useMemo(() => new Set(excludeMaterialIds), [excludeMaterialIds])
  const availableMaterials = useMemo(
    () =>
      materials.filter(
        (material) => !excludedSet.has(material.id) || String(material.id) === value,
      ),
    [excludedSet, materials, value],
  )

  const selected = materials.find((material) => String(material.id) === value)

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return availableMaterials

    return availableMaterials.filter((material) => {
      const name = getInventoryLocalizedName(material, locale).toLowerCase()
      const code = (material.code ?? '').toLowerCase()
      return name.includes(query) || code.includes(query)
    })
  }, [availableMaterials, locale, search])

  const closeSelect = useCallback(() => {
    setOpen(false)
    setSearch('')
  }, [])

  const updatePanelPosition = useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) return

    const rect = trigger.getBoundingClientRect()
    setPanelStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: MATERIAL_SELECT_Z_INDEX,
    })
  }, [])

  useEffect(() => {
    if (!open) return

    const timer = window.setTimeout(() => searchRef.current?.focus(), 0)
    return () => window.clearTimeout(timer)
  }, [open])

  useLayoutEffect(() => {
    if (!open) return
    updatePanelPosition()
  }, [open, updatePanelPosition])

  useEffect(() => {
    if (!open) return

    window.addEventListener('scroll', updatePanelPosition, true)
    window.addEventListener('resize', updatePanelPosition)
    return () => {
      window.removeEventListener('scroll', updatePanelPosition, true)
      window.removeEventListener('resize', updatePanelPosition)
    }
  }, [open, updatePanelPosition])

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      if (
        !rootRef.current?.contains(event.target as Node) &&
        !panelRef.current?.contains(event.target as Node)
      ) {
        closeSelect()
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') closeSelect()
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [closeSelect, open])

  return (
    <div
      ref={rootRef}
      className={`pi-material-select${hasError ? ' pi-material-select--error' : ''}${disabled ? ' pi-material-select--disabled' : ''}`}
    >
      <button
        ref={triggerRef}
        type="button"
        className="pi-material-select__trigger"
        disabled={disabled || loading}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? listId : undefined}
        onClick={() => (open ? closeSelect() : setOpen(true))}
      >
        {loading ? (
          <Loader2 className="pi-material-select__spinner" size={16} aria-hidden="true" />
        ) : selected ? (
          <span className="pi-material-select__name">
            {getInventoryLocalizedName(selected, locale)}
          </span>
        ) : (
          <span className="pi-material-select__placeholder">{placeholder}</span>
        )}
        <ChevronDown
          className={`pi-material-select__chevron${open ? ' pi-material-select__chevron--open' : ''}`}
          size={16}
          aria-hidden="true"
        />
      </button>

      {open
        ? createPortal(
            <div ref={panelRef} className="pi-material-select__panel" style={panelStyle}>
              <div className="pi-material-select__search-wrap">
                <Search className="pi-material-select__search-icon" size={15} aria-hidden="true" />
                <input
                  ref={searchRef}
                  type="search"
                  className="pi-material-select__search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={searchPlaceholder}
                  aria-label={searchPlaceholder}
                />
              </div>
              <ul id={listId} className="pi-material-select__list" role="listbox" aria-label={ariaLabel}>
                {filtered.length === 0 ? (
                  <li className="pi-material-select__empty" role="presentation">
                    —
                  </li>
                ) : (
                  filtered.map((material) => {
                    const isSelected = String(material.id) === value
                    return (
                      <li key={material.id} role="presentation">
                        <button
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          className={`pi-material-select__option${isSelected ? ' pi-material-select__option--selected' : ''}`}
                          onClick={() => {
                            onChange(String(material.id))
                            closeSelect()
                          }}
                        >
                          {getInventoryLocalizedName(material, locale)}
                        </button>
                      </li>
                    )
                  })
                )}
              </ul>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
