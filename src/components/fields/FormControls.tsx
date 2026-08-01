import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { formInputClassName, formSelectClassName, formTextareaClassName } from './formControlClasses'

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
