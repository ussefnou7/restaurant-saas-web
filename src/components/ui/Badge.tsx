import type { ReactNode } from 'react'

type BadgeVariant = 'success' | 'warning' | 'danger' | 'muted' | 'primary' | 'inactive'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
}

export function Badge({ children, variant = 'muted' }: BadgeProps) {
  return <span className={`badge badge--${variant}`}>{children}</span>
}
