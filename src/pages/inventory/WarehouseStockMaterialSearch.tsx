import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { CSSProperties } from 'react'
import { Loader2, Search } from 'lucide-react'
import { useTranslation } from '../../i18n/useTranslation'
import * as inventoryService from '../../services/inventoryService'
import type { MaterialResponse } from '../../types/inventory'
import { translateApiError } from '../../utils/errors'
import { getInventoryLocalizedName } from '../../utils/inventoryDisplay'

interface WarehouseStockMaterialSearchProps {
  value: MaterialResponse | null
  onChange: (material: MaterialResponse | null) => void
  excludedMaterialIds: number[]
  disabled?: boolean
  hasError?: boolean
}

export function WarehouseStockMaterialSearch({
  value,
  onChange,
  excludedMaterialIds,
  disabled,
  hasError,
}: WarehouseStockMaterialSearchProps) {
  const { t, locale } = useTranslation()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [materials, setMaterials] = useState<MaterialResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLUListElement>(null)
  const [dropdownStyle, setDropdownStyle] = useState<CSSProperties>({})
  const listId = useId()

  const updateDropdownPosition = useCallback(() => {
    const input = inputRef.current
    if (!input) return
    const rect = input.getBoundingClientRect()
    setDropdownStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    })
  }, [])

  const displayValue = value ? getInventoryLocalizedName(value, locale) : search

  const loadMaterials = useCallback(
    async (query: string) => {
      setLoading(true)
      setLoadError('')
      try {
        const data = await inventoryService.getMaterials({
          search: query.trim() || undefined,
          active: true,
        })
        setMaterials(data.filter((material) => !excludedMaterialIds.includes(material.id)))
      } catch (err) {
        setMaterials([])
        setLoadError(translateApiError(err, t).message)
      } finally {
        setLoading(false)
      }
    },
    [excludedMaterialIds, t],
  )

  useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(() => {
      void loadMaterials(search)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [loadMaterials, open, search])

  useLayoutEffect(() => {
    if (!open) return
    updateDropdownPosition()
  }, [open, updateDropdownPosition])

  useEffect(() => {
    if (!open) return
    window.addEventListener('scroll', updateDropdownPosition, true)
    window.addEventListener('resize', updateDropdownPosition)
    return () => {
      window.removeEventListener('scroll', updateDropdownPosition, true)
      window.removeEventListener('resize', updateDropdownPosition)
    }
  }, [open, updateDropdownPosition])

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node
      if (!rootRef.current?.contains(target) && !dropdownRef.current?.contains(target)) {
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

  function handleInputChange(next: string) {
    setSearch(next)
    if (value) {
      onChange(null)
    }
    if (!open) setOpen(true)
  }

  function handleSelect(material: MaterialResponse) {
    onChange(material)
    setSearch(getInventoryLocalizedName(material, locale))
    setOpen(false)
  }

  return (
    <div ref={rootRef} className="stocks-search-wrapper">
      <Search className="stocks-search-wrapper__icon" size={15} aria-hidden />
      <input
        ref={inputRef}
        type="search"
        className={`stocks-search-input${hasError ? ' stocks-search-input--error' : ''}`}
        value={displayValue}
        onChange={(event) => handleInputChange(event.target.value)}
        onFocus={() => setOpen(true)}
        placeholder={t('inventory.warehouses.stocks.searchMaterial')}
        aria-label={t('inventory.warehouses.stocks.searchMaterial')}
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-autocomplete="list"
        disabled={disabled}
      />
      {loading ? <Loader2 className="stocks-search-wrapper__spinner" size={16} aria-hidden /> : null}

      {loadError ? <p className="stocks-inline-error">{loadError}</p> : null}

      {open && !disabled
        ? createPortal(
            <ul
              ref={dropdownRef}
              id={listId}
              className="stocks-search-dropdown"
              role="listbox"
              style={dropdownStyle}
            >
              {materials.length === 0 && !loading ? (
                <li className="stocks-search-dropdown__empty" role="presentation">
                  {t('common.noResults')}
                </li>
              ) : (
                materials.map((material) => {
                  const isSelected = value?.id === material.id
                  return (
                    <li key={material.id} role="presentation">
                      <button
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        className={`stocks-search-dropdown__option${
                          isSelected ? ' stocks-search-dropdown__option--selected' : ''
                        }`}
                        onClick={() => handleSelect(material)}
                      >
                        {getInventoryLocalizedName(material, locale)}
                      </button>
                    </li>
                  )
                })
              )}
            </ul>,
            document.body,
          )
        : null}
    </div>
  )
}
