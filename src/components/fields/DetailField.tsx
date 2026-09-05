import type { ReactNode } from 'react'
import { FieldTooltip } from './FieldTooltip'

export interface DetailFieldProps {
  label: string
  value?: ReactNode
  emptyValue?: string
  icon?: ReactNode
  dir?: 'ltr' | 'rtl' | 'auto'
  fullWidth?: boolean
  empty?: boolean
  tooltip?: string
  children?: ReactNode
  className?: string
}

export function DetailField({
  label,
  value,
  emptyValue = '—',
  icon,
  dir,
  fullWidth,
  empty,
  tooltip,
  children,
  className,
}: DetailFieldProps) {
  const ltr = dir === 'ltr'

  return (
    <div
      className={`field-box field-box--detail${fullWidth ? ' field-box--full' : ''}${
        className ? ` ${className}` : ''
      }`}
    >
      <span className="field-box__label">
        <span>{label}</span>
        {tooltip ? <FieldTooltip text={tooltip} /> : null}
      </span>
      <div className="field-box__body">
        {icon ? <span className="field-box__icon">{icon}</span> : null}
        {children ?? (
          <span
            className={`field-box__value${ltr ? ' field-box__value--ltr' : ''}${
              empty ? ' field-box__value--empty' : ''
            }`}
            dir={dir}
          >
            {value ?? emptyValue}
          </span>
        )}
      </div>
    </div>
  )
}
