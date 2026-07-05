import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  inputSize?: 'md' | 'toolbar'
}

export function Input({ className = '', inputSize = 'md', ...props }: InputProps) {
  const sizeClass = inputSize === 'toolbar' ? 'ui-input ui-input--toolbar' : 'ui-input'
  return <input className={`${sizeClass}${className ? ` ${className}` : ''}`} {...props} />
}
