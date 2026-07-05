import type { ReactNode } from 'react'
import { Dropdown, type DropdownOption } from './Dropdown'

interface SelectFilterProps {
  value: string
  onChange: (value: string) => void
  options: DropdownOption[]
  ariaLabel: string
  className?: string
  disabled?: boolean
}

export function SelectFilter({
  value,
  onChange,
  options,
  ariaLabel,
  className,
  disabled,
}: SelectFilterProps) {
  return (
    <Dropdown
      value={value}
      onChange={onChange}
      options={options}
      ariaLabel={ariaLabel}
      size="toolbar"
      className={className}
      disabled={disabled}
    />
  )
}

interface StatusFilterProps {
  value: string
  onChange: (value: string) => void
  ariaLabel: string
  allLabel: string
  activeLabel: ReactNode
  inactiveLabel: ReactNode
}

export function StatusFilter({
  value,
  onChange,
  ariaLabel,
  allLabel,
  activeLabel,
  inactiveLabel,
}: StatusFilterProps) {
  return (
    <SelectFilter
      value={value}
      onChange={onChange}
      ariaLabel={ariaLabel}
      className="select-filter--status"
      options={[
        { value: 'all', label: allLabel },
        { value: 'active', label: activeLabel },
        { value: 'inactive', label: inactiveLabel },
      ]}
    />
  )
}
