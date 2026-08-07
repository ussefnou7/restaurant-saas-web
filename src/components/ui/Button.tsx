import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'dangerConfirm' | 'warning' | 'ghost' | 'post' | 'unpost'
type ButtonSize = 'md' | 'sm' | 'action'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  children: ReactNode
}

const variantClass: Record<ButtonVariant, string> = {
  primary: 'button-primary',
  secondary: 'button-secondary',
  danger: 'button-danger',
  dangerConfirm: 'button-danger button-danger--confirm',
  warning: 'button-warning',
  ghost: 'button-secondary',
  post: 'button-post',
  unpost: 'button-unpost',
}

const sizeClass: Record<ButtonSize, string> = {
  md: '',
  sm: 'button-sm',
  action: 'action-btn',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  children,
  ...props
}: ButtonProps) {
  const classes = [variantClass[variant], sizeClass[size], className].filter(Boolean).join(' ')
  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  )
}
