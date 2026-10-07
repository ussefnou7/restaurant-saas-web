import type { ReactNode } from 'react'

interface HeroTileProps {
  title: string
  value: string
  hint?: string
  /** `lead` is the one tile the page is about; `support` sits beside it at a smaller size. */
  size?: 'lead' | 'support'
  /** Rendered under the figure — the lead tile carries the trend chart here. */
  children?: ReactNode
}

/**
 * One of the three sales figures at the top of the dashboard.
 *
 * Replaces `StatCard` on this page for one reason: the lead tile has to hold the trend chart under
 * its figure, and a chart in a `helperText` slot is the wrong shape. The coloured status dot is
 * gone with it — six tiles each wearing a different colour made the row read as six equal findings,
 * which was the thing worth fixing.
 */
export function HeroTile({ title, value, hint, size = 'support', children }: HeroTileProps) {
  return (
    <div className={`hero-tile hero-tile--${size}`}>
      <p className="hero-tile__label">{title}</p>
      <p className="hero-tile__value">{value}</p>
      {hint ? <p className="hero-tile__hint">{hint}</p> : null}
      {children}
    </div>
  )
}
