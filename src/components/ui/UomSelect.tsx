import { useCallback, useMemo, type FocusEvent } from 'react'
import { useUomLookup } from '../../hooks/useUomLookup'
import { useTranslation } from '../../i18n/useTranslation'
import type { SelectOption } from '../../types/lineSchema'

export interface UomSelectProps {
  value: string | number
  onChange: (value: string) => void
  options?: SelectOption[]
  disabled?: boolean
  ariaLabel?: string
  className?: string
  placeholder?: string
  onFocus?: (e: FocusEvent<HTMLSelectElement>) => void
}

export function UomSelect({
  value,
  onChange,
  options,
  disabled = false,
  ariaLabel,
  className = 'pi-form-field__select',
  placeholder,
  onFocus,
}: UomSelectProps) {
  const { t } = useTranslation()
  const { activeUoms, uomLabel, uomSymbol, revalidateOnOpen } = useUomLookup()

  const handleOpenTrigger = useCallback(() => {
    void revalidateOnOpen()
  }, [revalidateOnOpen])

  const handleFocus = useCallback(
    (e: FocusEvent<HTMLSelectElement>) => {
      handleOpenTrigger()
      onFocus?.(e)
    },
    [handleOpenTrigger, onFocus],
  )

  const handleMouseDown = useCallback(() => {
    handleOpenTrigger()
  }, [handleOpenTrigger])

  const computedOptions = useMemo<SelectOption[]>(() => {
    if (options && options.length > 0) {
      const result = [...options]
      const strVal = String(value ?? '')
      if (strVal && !result.some((opt) => opt.value === strVal)) {
        const symbol = uomSymbol(strVal)
        result.push({
          value: strVal,
          label: symbol !== '—' ? symbol : uomLabel(strVal),
        })
      }
      return result
    }

    const baseList: SelectOption[] = activeUoms.map((u) => ({
      value: String(u.id),
      label: uomSymbol(u.id) !== '—' ? uomSymbol(u.id) : uomLabel(u.id),
    }))

    const strVal = String(value ?? '')
    if (strVal && !baseList.some((opt) => opt.value === strVal)) {
      const symbol = uomSymbol(strVal)
      baseList.push({
        value: strVal,
        label: symbol !== '—' ? symbol : uomLabel(strVal),
      })
    }

    return baseList
  }, [options, activeUoms, value, uomSymbol, uomLabel])

  return (
    <select
      className={className}
      value={String(value ?? '')}
      onChange={(e) => onChange(e.target.value)}
      onFocus={handleFocus}
      onMouseDown={handleMouseDown}
      disabled={disabled}
      aria-label={ariaLabel ?? t('inventory.purchase.lines.uom')}
    >
      <option value="">{placeholder ?? t('common.select')}</option>
      {computedOptions.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}
