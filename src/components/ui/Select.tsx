import type { ReactNode, SelectHTMLAttributes } from 'react'

interface SelectOption {
  value: string
  label: ReactNode
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options?: SelectOption[]
  selectSize?: 'md' | 'toolbar'
  wrapClassName?: string
}

export function Select({
  className = '',
  options,
  children,
  selectSize = 'md',
  wrapClassName = '',
  ...props
}: SelectProps) {
  const sizeClass = selectSize === 'toolbar' ? 'ui-select ui-select--toolbar' : 'ui-select'
  return (
    <div className={`ui-select-wrap${wrapClassName ? ` ${wrapClassName}` : ''}`}>
      <select className={`${sizeClass}${className ? ` ${className}` : ''}`} {...props}>
        {options
          ? options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))
          : children}
      </select>
    </div>
  )
}
