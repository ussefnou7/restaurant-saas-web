import type { ReactNode } from 'react'

export interface FieldGridProps {
  children: ReactNode
  columns?: 2 | 3
  className?: string
}

export function FieldGrid({ children, columns = 3, className }: FieldGridProps) {
  return (
    <div
      className={`field-grid field-grid--cols-${columns}${className ? ` ${className}` : ''}`}
    >
      {children}
    </div>
  )
}
