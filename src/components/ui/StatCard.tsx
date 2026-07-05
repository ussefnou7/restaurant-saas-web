type DotVariant = 'primary' | 'accent' | 'success' | 'warning' | 'danger'

interface StatCardProps {
  title: string
  value: string | number
  helperText?: string
  dotVariant?: DotVariant
}

/** Full-size stat card (e.g. dashboard). */
export function StatCard({ title, value, helperText, dotVariant = 'primary' }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="stat-card-icon" aria-hidden="true">
        <span className={`stat-card-dot stat-card-dot--${dotVariant}`} />
      </div>
      <div className="stat-card-content">
        <span className="stat-card-label">{title}</span>
        <span className="stat-card-value">{value}</span>
        {helperText ? <span className="stat-card-helper">{helperText}</span> : null}
      </div>
    </div>
  )
}

interface CompactStatCardProps {
  title: string
  value: string | number
  dotVariant?: DotVariant
}

/** Compact summary pill for list pages (e.g. users). */
export function CompactStatCard({ title, value, dotVariant = 'primary' }: CompactStatCardProps) {
  return (
    <div className="compact-stat-card">
      <span className={`stat-dot stat-dot--${dotVariant}`} aria-hidden="true" />
      <div className="compact-stat-text">
        <span className="stat-label">{title}</span>
        <span className="stat-value">{value}</span>
      </div>
    </div>
  )
}
