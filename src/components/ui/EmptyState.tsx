import { Inbox, SearchX } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from './Button'

interface EmptyStateProps {
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  children?: ReactNode
  variant?: 'empty' | 'filter'
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  children,
  variant = 'empty',
}: EmptyStateProps) {
  const Icon = variant === 'filter' ? SearchX : Inbox

  return (
    <div className="list-state empty-state empty-state--card">
      <Icon className="list-state__icon" size={36} strokeWidth={1.25} aria-hidden="true" />
      <p className="list-state__title empty-state-title">{title}</p>
      {description ? <p className="list-state__text empty-state-text">{description}</p> : null}
      {children}
      {actionLabel && onAction ? (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  )
}
