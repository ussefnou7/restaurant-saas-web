import type { ReactNode } from 'react'

export interface FormFieldProps {
  label: string
  htmlFor?: string
  error?: string
  helper?: string
  fullWidth?: boolean
  disabled?: boolean
  required?: boolean
  children: ReactNode
  className?: string
}

export function FormField({
  label,
  htmlFor,
  error,
  helper,
  fullWidth,
  disabled,
  required,
  children,
  className,
}: FormFieldProps) {
  const LabelTag = htmlFor ? 'label' : 'span'

  return (
    <div
      className={`field-box field-box--form${error ? ' field-box--error' : ''}${
        disabled ? ' field-box--disabled' : ''
      }${fullWidth ? ' field-box--full' : ''}${className ? ` ${className}` : ''}`}
    >
      <LabelTag className="field-box__label" htmlFor={htmlFor}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </LabelTag>
      <div className="field-box__body">
        {children}
        {helper ? <span className="field-box__helper">{helper}</span> : null}
        {error ? <span className="field-box__error">{error}</span> : null}
      </div>
    </div>
  )
}
