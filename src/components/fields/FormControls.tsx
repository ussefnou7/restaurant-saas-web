import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

function joinClasses(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(' ')
}

export function formInputClassName(options?: { ltr?: boolean; code?: boolean; className?: string }) {
  return joinClasses(
    'field-box__input',
    options?.ltr && 'field-box__input--ltr',
    options?.code && 'field-box__input--code',
    options?.className,
  )
}

export function formTextareaClassName(options?: { ltr?: boolean; className?: string }) {
  return joinClasses(
    'field-box__textarea',
    options?.ltr && 'field-box__textarea--ltr',
    options?.className,
  )
}

export function formSelectClassName(options?: { ltr?: boolean; className?: string }) {
  return joinClasses(
    'field-box__select',
    options?.ltr && 'field-box__select--ltr',
    options?.className,
  )
}

export function FormInput({
  ltr,
  code,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { ltr?: boolean; code?: boolean }) {
  return (
    <input className={formInputClassName({ ltr, code, className })} dir={ltr ? 'ltr' : props.dir} {...props} />
  )
}

export function FormTextarea({
  ltr,
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { ltr?: boolean }) {
  return (
    <textarea
      className={formTextareaClassName({ ltr, className })}
      dir={ltr ? 'ltr' : props.dir}
      {...props}
    />
  )
}

export function FormSelect({
  ltr,
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { ltr?: boolean }) {
  return (
    <select className={formSelectClassName({ ltr, className })} dir={ltr ? 'ltr' : props.dir} {...props}>
      {children}
    </select>
  )
}

export function formDropdownClassName(className?: string) {
  return joinClasses('dropdown--form', 'dropdown--field', className)
}
